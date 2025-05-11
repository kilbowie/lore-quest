
import { User } from "../types";
import { toast } from "@/components/ui/sonner";
import bcrypt from "bcryptjs";

// Mock user database for local storage
export const USERS_STORAGE_KEY = 'lorequest_users';
export const CURRENT_USER_KEY = 'lorequest_current_user';
export const VERIFICATION_TOKENS_KEY = 'lorequest_verification_tokens';
export const PASSWORD_RESET_TOKENS_KEY = 'lorequest_reset_tokens';

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
      inventory: [
        {
          id: generateUniqueId(),
          type: 'compass',
          name: 'Starter Compass',
          description: 'Your first tool for exploration',
          quantity: 1
        }
      ],
      discoveredLocations: [],
      achievements: [],
      activeQuests: [],
      completedQuests: [],
      emailVerified: false,
      createdAt: new Date(),
      tutorialCompleted: false
    };
    
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
    
    // Save users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Remove token
    const filteredTokens = tokens.filter(t => t.token !== token);
    localStorage.setItem(VERIFICATION_TOKENS_KEY, JSON.stringify(filteredTokens));
    
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
