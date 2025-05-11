import { User, PlayerClass, CLASS_DESCRIPTIONS, STAT_MULTIPLIERS } from "../types";
import { toast } from "@/components/ui/sonner";
import bcrypt from "bcryptjs";
import { initializeUserStats, recalculatePlayerStats, addVerificationQuest } from "../utils/xpUtils";

// Mock user database for local storage
export const USERS_STORAGE_KEY = 'lorequest_users';
export const CURRENT_USER_KEY = 'lorequest_current_user';
export const VERIFICATION_TOKENS_KEY = 'lorequest_verification_tokens';
export const PASSWORD_RESET_TOKENS_KEY = 'lorequest_reset_tokens';

// Add missing variables at the right location
const TUTORIAL_XP_REWARD = 150;
const TUTORIAL_GOLD_REWARD = 50;

// Create a new user
export const createUser = (name: string, email: string, username: string, password: string): User | null => {
  try {
    // Get existing users
    const existingUsers = loadUsers();
    
    // Check if user with email or username already exists
    const userExists = existingUsers.some(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (userExists) {
      throw new Error('User with this email or username already exists');
    }
    
    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    // Create new user
    const newUser: User = {
      id: generateUniqueId(),
      name,
      email,
      username,
      level: 1,
      experience: 0,
      gold: 0,
      inventory: [
        {
          id: generateUniqueId(),
          type: 'compass',
          name: 'Starter Compass',
          description: 'Your first tool for exploration',
          quantity: 1,
          icon: '🧭'
        }
      ],
      discoveredLocations: [],
      achievements: [],
      activeQuests: [],
      completedQuests: [],
      emailVerified: false,
      createdAt: new Date(),
      tutorialCompleted: false,
      stats: {
        strength: 1,
        intelligence: 1,
        dexterity: 1,
        distanceTravelled: 0,
        locationsDiscovered: 0,
        totalXpEarned: 0,
        questXpEarned: 0,
        walkingXpEarned: 0,
        totalGoldEarned: 0,
        questGoldEarned: 0,
        questsCompleted: 0,
        achievementsUnlocked: 0,
        dailyQuestsCompleted: 0,
        weeklyQuestsCompleted: 0,
        monthlyQuestsCompleted: 0
      },
      health: 10,
      maxHealth: 10,
      mana: 10,
      maxMana: 10,
      stamina: 10,
      maxStamina: 10,
      isDead: false,
      lastRegenerationTime: new Date()
    };
    
    // Set stats based on default values
    recalculatePlayerStats(newUser);
    
    // Add verification quest
    addVerificationQuest(newUser);
    
    // Create auth record
    const userAuth = {
      userId: newUser.id,
      email,
      username,
      passwordHash
    };
    
    // Save user auth
    const authData = loadUserAuth();
    authData.push(userAuth);
    localStorage.setItem('lorequest_auth', JSON.stringify(authData));
    
    // Generate email verification token
    const verificationToken = generateVerificationToken(newUser.id);
    
    // In a real app, this would send an email with the token
    // For now, we'll just show it in a toast message for demo purposes
    toast.info(`Verification email sent to ${email}`, {
      description: `Verification token: ${verificationToken} (This would be sent via email in production)`
    });
    
    // Save user
    existingUsers.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Login user
export const loginUser = (usernameOrEmail: string, password: string): User | null => {
  try {
    const authData = loadUserAuth();
    const userAuth = authData.find(
      auth => 
        (auth.email.toLowerCase() === usernameOrEmail.toLowerCase() || 
         auth.username.toLowerCase() === usernameOrEmail.toLowerCase())
    );
    
    if (!userAuth) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const passwordMatches = bcrypt.compareSync(password, userAuth.passwordHash);
    if (!passwordMatches) {
      throw new Error('Invalid credentials');
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === userAuth.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Ensure user has stats
    if (!user.stats) {
      initializeUserStats(user);
      recalculatePlayerStats(user);
    }
    
    // Check for regeneration
    checkRegeneration(user);
    
    // Check if email is verified
    if (!user.emailVerified) {
      toast.warning('Please verify your email address', {
        description: 'Check your inbox for a verification email',
        action: {
          label: 'Resend',
          onClick: () => resendVerificationEmail(user.email)
        }
      });
    }
    
    // Save current user to localStorage
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
};

// Check for health/mana/stamina regeneration
export const checkRegeneration = (user: User): User => {
  if (!user.lastRegenerationTime) {
    user.lastRegenerationTime = new Date();
    return user;
  }
  
  const now = new Date();
  const lastRegen = new Date(user.lastRegenerationTime);
  const elapsedMs = now.getTime() - lastRegen.getTime();
  
  // Skip if user is dead
  if (user.isDead) {
    user.lastRegenerationTime = now;
    return user;
  }
  
  // Calculate regeneration (12 hours for full regen)
  const FULL_REGEN_TIME_MS = 12 * 60 * 60 * 1000;
  const regenRatio = Math.min(1, elapsedMs / FULL_REGEN_TIME_MS);
  
  if (regenRatio > 0) {
    // Calculate regeneration amounts
    const healthRegen = Math.floor(user.maxHealth * regenRatio);
    const manaRegen = Math.floor(user.maxMana * regenRatio);
    const staminaRegen = Math.floor(user.maxStamina * regenRatio);
    
    // Apply regeneration
    user.health = Math.min(user.maxHealth, user.health + healthRegen);
    user.mana = Math.min(user.maxMana, user.mana + manaRegen);
    user.stamina = Math.min(user.maxStamina, user.stamina + staminaRegen);
    user.lastRegenerationTime = now;
    
    // Save user
    updateUser(user);
    
    // Check for auto-resurrection after 12 hours
    if (user.isDead && regenRatio >= 1) {
      user.isDead = false;
      user.health = Math.floor(user.maxHealth * 0.3); // Resurrect with 30% health
      
      toast.success('You have been resurrected', {
        description: 'You have recovered after resting for 12 hours.'
      });
    }
  }
  
  return user;
};

// Set user's class
export const setUserClass = (userId: string, playerClass: PlayerClass): User => {
  try {
    // Get existing users
    const users = loadUsers();
    
    // Find user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const user = users[userIndex];
    
    // Set class
    user.playerClass = playerClass;
    
    // Initialize stats if they don't exist
    if (!user.stats) {
      initializeUserStats(user);
    }
    
    // Apply base stats from class
    const baseStats = CLASS_DESCRIPTIONS[playerClass].baseStats;
    
    // Recalculate health, mana, stamina based on class
    recalculatePlayerStats(user);
    
    // Save updated users
    users[userIndex] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    console.error('Error setting user class:', error);
    
    // Return original user if available
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    return user || {
      id: userId,
      name: '',
      email: '',
      username: '',
      level: 1,
      experience: 0,
      gold: 0,
      inventory: [],
      discoveredLocations: [],
      achievements: [],
      activeQuests: [],
      completedQuests: [],
      createdAt: new Date(),
      health: 10,
      maxHealth: 10,
      mana: 10,
      maxMana: 10,
      stamina: 10,
      maxStamina: 10,
      isDead: false,
      stats: {
        strength: 1,
        intelligence: 1,
        dexterity: 1,
        distanceTravelled: 0,
        locationsDiscovered: 0,
        totalXpEarned: 0,
        questXpEarned: 0,
        walkingXpEarned: 0,
        totalGoldEarned: 0,
        questGoldEarned: 0,
        questsCompleted: 0,
        achievementsUnlocked: 0,
        dailyQuestsCompleted: 0,
        weeklyQuestsCompleted: 0,
        monthlyQuestsCompleted: 0
      }
    };
  }
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Check if user is logged in
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson) as User;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user
export const updateUser = (user: User): boolean => {
  try {
    // Get existing users
    const users = loadUsers();
    
    // Find and update user
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    users[index] = user;
    
    // Save updated users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

// Generate email verification token
export const generateVerificationToken = (userId: string): string => {
  const token = generateTokenString();
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  // Load existing tokens
  const tokens = loadVerificationTokens();
  
  // Remove any existing tokens for this user
  const filteredTokens = tokens.filter(t => t.userId !== userId);
  
  // Add new token
  filteredTokens.push({
    token,
    userId,
    expiry
  });
  
  // Save tokens
  localStorage.setItem(VERIFICATION_TOKENS_KEY, JSON.stringify(filteredTokens));
  
  return token;
};

// Verify email with token
export const verifyEmail = (token: string): boolean => {
  try {
    // Load tokens
    const tokens = loadVerificationTokens();
    
    // Find token
    const tokenData = tokens.find(t => t.token === token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }
    
    // Check if token is expired
    if (tokenData.expiry < Date.now()) {
      throw new Error('Token expired');
    }
    
    // Find user
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === tokenData.userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update user
    users[userIndex].emailVerified = true;
    
    // Complete verification quest
    const user = users[userIndex];
    
    // Find verification achievement
    const achievementIndex = user.achievements.findIndex(a => a.achievementId === 'email-verification');
    if (achievementIndex >= 0) {
      user.achievements[achievementIndex].completed = true;
      user.achievements[achievementIndex].progress = 1;
      user.achievements[achievementIndex].completedAt = new Date();
      
      // Award XP and gold rewards
      const xpReward = TUTORIAL_XP_REWARD;
      const goldReward = TUTORIAL_GOLD_REWARD;
      
      user.experience += xpReward;
      user.gold = (user.gold || 0) + goldReward;
      
      // Update stats
      if (!user.stats) {
        user.stats = {
          strength: 1,
          intelligence: 1,
          dexterity: 1,
          distanceTravelled: 0,
          locationsDiscovered: 0,
          totalXpEarned: user.experience,
          questXpEarned: xpReward,
          walkingXpEarned: 0,
          totalGoldEarned: user.gold,
          questGoldEarned: goldReward,
          questsCompleted: 1,
          achievementsUnlocked: 1,
          dailyQuestsCompleted: 0,
          weeklyQuestsCompleted: 0,
          monthlyQuestsCompleted: 0
        };
      } else {
        user.stats.totalXpEarned += xpReward;
        user.stats.questXpEarned += xpReward;
        user.stats.totalGoldEarned += goldReward;
        user.stats.questGoldEarned += goldReward;
        user.stats.questsCompleted += 1;
        user.stats.achievementsUnlocked += 1;
      }
    }
    
    // Save users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Remove token
    const filteredTokens = tokens.filter(t => t.token !== token);
    localStorage.setItem(VERIFICATION_TOKENS_KEY, JSON.stringify(filteredTokens));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === tokenData.userId) {
      currentUser.emailVerified = true;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      
      // Show success message
      toast.success('Email verification complete!', {
        description: `You earned ${xpReward} XP and ${goldReward} Gold!`
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
};

// Resend verification email
export const resendVerificationEmail = (email: string): boolean => {
  try {
    // Find user by email
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new token
    const token = generateVerificationToken(user.id);
    
    // In a real app, this would send an email with the token
    // For now, we'll just show it in a toast message for demo purposes
    toast.info(`Verification email resent to ${email}`, {
      description: `Verification token: ${token} (This would be sent via email in production)`
    });
    
    return true;
  } catch (error) {
    console.error('Error resending verification email:', error);
    return false;
  }
};

// Request password reset
export const requestPasswordReset = (email: string): boolean => {
  try {
    // Find user by email
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate password reset token
    const token = generateTokenString();
    const expiry = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    
    // Load existing tokens
    const tokens = loadResetTokens();
    
    // Remove any existing tokens for this user
    const filteredTokens = tokens.filter(t => t.userId !== user.id);
    
    // Add new token
    filteredTokens.push({
      token,
      userId: user.id,
      expiry
    });
    
    // Save tokens
    localStorage.setItem(PASSWORD_RESET_TOKENS_KEY, JSON.stringify(filteredTokens));
    
    // In a real app, this would send an email with the token
    // For now, we'll just show it in a toast message for demo purposes
    toast.info(`Password reset email sent to ${email}`, {
      description: `Reset token: ${token} (This would be sent via email in production)`
    });
    
    return true;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return false;
  }
};

// Reset password with token
export const resetPassword = (token: string, newPassword: string): boolean => {
  try {
    // Load tokens
    const tokens = loadResetTokens();
    
    // Find token
    const tokenData = tokens.find(t => t.token === token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired token');
    }
    
    // Check if token is expired
    if (tokenData.expiry < Date.now()) {
      throw new Error('Token expired');
    }
    
    // Find user
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === tokenData.userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Find user auth
    const authData = loadUserAuth();
    const authIndex = authData.findIndex(a => a.userId === tokenData.userId);
    
    if (authIndex === -1) {
      throw new Error('User auth not found');
    }
    
    // Hash new password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);
    
    // Update user auth
    authData[authIndex].passwordHash = passwordHash;
    
    // Save auth data
    localStorage.setItem('lorequest_auth', JSON.stringify(authData));
    
    // Remove token
    const filteredTokens = tokens.filter(t => t.token !== token);
    localStorage.setItem(PASSWORD_RESET_TOKENS_KEY, JSON.stringify(filteredTokens));
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
};

// Helper functions
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateTokenString = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const loadUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const loadUserAuth = (): any[] => {
  const authJson = localStorage.getItem('lorequest_auth');
  return authJson ? JSON.parse(authJson) : [];
};

const loadVerificationTokens = (): any[] => {
  const tokensJson = localStorage.getItem(VERIFICATION_TOKENS_KEY);
  return tokensJson ? JSON.parse(tokensJson) : [];
};

const loadResetTokens = (): any[] => {
  const tokensJson = localStorage.getItem(PASSWORD_RESET_TOKENS_KEY);
  return tokensJson ? JSON.parse(tokensJson) : [];
};

// Complete tutorial for user
export const completeTutorial = (userId: string): boolean => {
  try {
    // Find user
    const users = loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update user
    users[userIndex].tutorialCompleted = true;
    
    // Save users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.tutorialCompleted = true;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
    
    return true;
  } catch (error) {
    console.error('Error completing tutorial:', error);
    return false;
  }
};
