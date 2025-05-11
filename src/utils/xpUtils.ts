
import { 
  LEVEL_CONSTANTS, User, Achievement, UserAchievement, InventoryItem, 
  UserStats, STAT_MULTIPLIERS, PlayerClass, CLASS_DESCRIPTIONS, 
  REGENERATION_CONSTANTS, Quest, QUEST_TYPES
} from "../types";
import { updateUser } from "./authUtils";
import { toast } from "@/components/ui/sonner";

// Calculate XP required for a specific level
export const calculateXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  if (level > LEVEL_CONSTANTS.MAX_LEVEL) return Infinity;
  
  return Math.floor(
    LEVEL_CONSTANTS.BASE_XP * (Math.pow(LEVEL_CONSTANTS.SCALING_FACTOR, level - 1) - 1) / 
    (LEVEL_CONSTANTS.SCALING_FACTOR - 1)
  );
};

// Calculate total XP needed to reach next level
export const xpToNextLevel = (currentLevel: number): number => {
  return calculateXpForLevel(currentLevel + 1) - calculateXpForLevel(currentLevel);
};

// Calculate current level progress percentage
// Modified to accept either a User object or a level number
export const calculateLevelProgress = (userOrLevel: User | number): number => {
  const level = typeof userOrLevel === 'number' ? userOrLevel : userOrLevel.level;
  const experience = typeof userOrLevel === 'number' ? 0 : userOrLevel.experience;
  
  const currentLevelXp = calculateXpForLevel(level);
  const nextLevelXp = calculateXpForLevel(level + 1);
  const xpInCurrentLevel = experience - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  
  return Math.min(100, Math.floor((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
};

// Add XP to user and handle level up
export const addExperience = (user: User, xpAmount: number, source?: string): User => {
  const updatedUser = { ...user };
  const oldLevel = updatedUser.level;
  
  // Add XP
  updatedUser.experience += xpAmount;
  
  // Update stats
  if (!updatedUser.stats) {
    initializeUserStats(updatedUser);
  }
  
  updatedUser.stats.totalXpEarned += xpAmount;
  
  // Check for level up
  while (
    updatedUser.level < LEVEL_CONSTANTS.MAX_LEVEL &&
    updatedUser.experience >= calculateXpForLevel(updatedUser.level + 1)
  ) {
    updatedUser.level += 1;
    
    // Add a rune to inventory on level up
    addItemToInventory(
      updatedUser,
      'rune',
      `Level ${updatedUser.level} Rune`,
      `A mystical rune gained upon reaching level ${updatedUser.level}`,
      1,
      '✨'
    );
    
    // Recalculate max stats based on new level
    recalculatePlayerStats(updatedUser);
  }
  
  // Show level up notification
  if (updatedUser.level > oldLevel) {
    toast.success(`Level Up! You are now level ${updatedUser.level}`, {
      description: "You've gained a new rune in your inventory!"
    });
  } else if (source) {
    // Show XP notification
    toast.success(`Gained ${xpAmount} XP`, {
      description: `From: ${source}`
    });
  }
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Initialize user stats if they don't exist
export const initializeUserStats = (user: User): User => {
  if (!user.stats) {
    user.stats = {
      strength: 1,
      intelligence: 1,
      dexterity: 1,
      distanceTravelled: 0,
      locationsDiscovered: 0,
      totalXpEarned: user.experience,
      questXpEarned: 0,
      walkingXpEarned: 0,
      totalGoldEarned: user.gold || 0,
      questGoldEarned: 0,
      questsCompleted: 0,
      achievementsUnlocked: 0,
      dailyQuestsCompleted: 0,
      weeklyQuestsCompleted: 0,
      monthlyQuestsCompleted: 0
    };
  }
  
  // Initialize health/mana/stamina if not set
  if (user.health === undefined) {
    recalculatePlayerStats(user);
  }
  
  return user;
};

// Update specific user stats
export const updateUserStats = (user: User, updates: Partial<UserStats>): User => {
  if (!user.stats) {
    initializeUserStats(user);
  }
  
  // Apply updates
  Object.keys(updates).forEach((key) => {
    const statKey = key as keyof UserStats;
    const currentValue = user.stats[statKey] as number;
    const updateValue = updates[statKey] as number;
    
    user.stats[statKey] = currentValue + updateValue;
  });
  
  return user;
};

// Recalculate player stats based on class, level, and attributes
export const recalculatePlayerStats = (user: User): User => {
  const updatedUser = { ...user };
  
  // Initialize stats if they don't exist
  if (!updatedUser.stats) {
    initializeUserStats(updatedUser);
  }
  
  // Get base stats from class or use defaults
  let baseStats = { strength: 1, intelligence: 1, dexterity: 1 };
  if (updatedUser.playerClass && CLASS_DESCRIPTIONS[updatedUser.playerClass]) {
    baseStats = { ...CLASS_DESCRIPTIONS[updatedUser.playerClass].baseStats };
  }
  
  // Calculate max health, mana, and stamina
  const maxHealth = (updatedUser.stats.strength + baseStats.strength) * STAT_MULTIPLIERS.HEALTH_PER_STRENGTH;
  const maxMana = (updatedUser.stats.intelligence + baseStats.intelligence) * STAT_MULTIPLIERS.MANA_PER_INTELLIGENCE;
  const maxStamina = (updatedUser.stats.dexterity + baseStats.dexterity) * STAT_MULTIPLIERS.STAMINA_PER_DEXTERITY;
  
  // Update max values
  updatedUser.maxHealth = maxHealth;
  updatedUser.maxMana = maxMana;
  updatedUser.maxStamina = maxStamina;
  
  // Initialize current values if not set
  if (updatedUser.health === undefined) updatedUser.health = maxHealth;
  if (updatedUser.mana === undefined) updatedUser.mana = maxMana;
  if (updatedUser.stamina === undefined) updatedUser.stamina = maxStamina;
  if (updatedUser.isDead === undefined) updatedUser.isDead = false;
  
  // Cap current values at max
  updatedUser.health = Math.min(updatedUser.health, maxHealth);
  updatedUser.mana = Math.min(updatedUser.mana, maxMana);
  updatedUser.stamina = Math.min(updatedUser.stamina, maxStamina);
  
  return updatedUser;
};

// Check and update regeneration for health, mana, stamina
export const checkRegeneration = (user: User): User => {
  const updatedUser = { ...user };
  const now = new Date();
  
  // Skip regeneration if user is dead
  if (updatedUser.isDead) return updatedUser;
  
  const lastRegen = updatedUser.lastRegenerationTime ? new Date(updatedUser.lastRegenerationTime) : null;
  if (!lastRegen) {
    updatedUser.lastRegenerationTime = now;
    return updatedUser;
  }
  
  const timeElapsed = now.getTime() - lastRegen.getTime();
  if (timeElapsed < REGENERATION_CONSTANTS.CHECK_INTERVAL_MS) {
    return updatedUser; // Not enough time has passed
  }
  
  // Calculate regeneration amounts
  const regenFraction = Math.min(1, timeElapsed / REGENERATION_CONSTANTS.FULL_REGEN_TIME_MS);
  const healthRegen = Math.floor(updatedUser.maxHealth * regenFraction);
  const manaRegen = Math.floor(updatedUser.maxMana * regenFraction);
  const staminaRegen = Math.floor(updatedUser.maxStamina * regenFraction);
  
  // Apply regeneration
  updatedUser.health = Math.min(updatedUser.maxHealth, updatedUser.health + healthRegen);
  updatedUser.mana = Math.min(updatedUser.maxMana, updatedUser.mana + manaRegen);
  updatedUser.stamina = Math.min(updatedUser.maxStamina, updatedUser.stamina + staminaRegen);
  
  // Update timestamp
  updatedUser.lastRegenerationTime = now;
  
  return updatedUser;
};

// Handle character death
export const handleDeath = (user: User): User => {
  const updatedUser = { ...user };
  
  // Check if health is 0
  if (updatedUser.health <= 0 && !updatedUser.isDead) {
    updatedUser.health = 0;
    updatedUser.isDead = true;
    
    // Check for revival elixir
    const revivalElixir = updatedUser.inventory.find(
      item => item.type === 'elixir' && 
      item.useEffect === 'revival' && 
      item.quantity > 0
    );
    
    if (revivalElixir) {
      // Auto-use revival elixir
      useItem(updatedUser, revivalElixir.id);
      
      toast.success('Revival Elixir Used', {
        description: 'You were revived automatically using a Revival Elixir from your inventory.'
      });
    } else {
      // No revival elixir available
      toast.error('You have died!', {
        description: 'Wait for regeneration or use a Revival Elixir to continue your adventure.'
      });
    }
  }
  
  return updatedUser;
};

// Revive character
export const reviveCharacter = (user: User): User => {
  const updatedUser = { ...user };
  
  if (updatedUser.isDead) {
    updatedUser.isDead = false;
    updatedUser.health = Math.floor(updatedUser.maxHealth * 0.3); // Revive with 30% health
    updatedUser.mana = Math.floor(updatedUser.maxMana * 0.3);
    updatedUser.stamina = Math.floor(updatedUser.maxStamina * 0.3);
    
    toast.success('You have been revived!', {
      description: 'Continue your adventure with caution.'
    });
  }
  
  return updatedUser;
};

// Use an item from inventory
export const useItem = (user: User, itemId: string): User => {
  const updatedUser = { ...user };
  const itemIndex = updatedUser.inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    toast.error('Item not found in inventory');
    return updatedUser;
  }
  
  const item = updatedUser.inventory[itemIndex];
  
  // Check if item can be used
  if (item.quantity <= 0) {
    toast.error('You do not have any of this item');
    return updatedUser;
  }
  
  // Apply item effect
  switch (item.useEffect) {
    case 'health':
      if (!updatedUser.isDead) {
        updatedUser.health = Math.min(updatedUser.maxHealth, updatedUser.health + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} health points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'mana':
      if (!updatedUser.isDead) {
        updatedUser.mana = Math.min(updatedUser.maxMana, updatedUser.mana + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} mana points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'stamina':
      if (!updatedUser.isDead) {
        updatedUser.stamina = Math.min(updatedUser.maxStamina, updatedUser.stamina + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} stamina points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'revival':
      if (updatedUser.isDead) {
        reviveCharacter(updatedUser);
      } else {
        toast.info(`Cannot use ${item.name} while alive`);
        return updatedUser;
      }
      break;
    
    default:
      toast.info(`Used ${item.name}`);
      break;
  }
  
  // Decrease quantity
  updatedUser.inventory[itemIndex].quantity -= 1;
  
  // Remove item from inventory if quantity is 0
  if (updatedUser.inventory[itemIndex].quantity <= 0) {
    updatedUser.inventory = updatedUser.inventory.filter(i => i.id !== itemId);
  }
  
  return updatedUser;
};

// Add item to user inventory
export const addItemToInventory = (
  user: User,
  type: 'rune' | 'map' | 'compass' | 'weapon' | 'potion' | 'elixir' | 'other' | 'gold',
  name: string,
  description: string,
  quantity: number,
  icon?: string,
  useEffect?: 'health' | 'mana' | 'stamina' | 'revival' | 'none',
  value?: number
): InventoryItem => {
  // Check if item already exists
  const existingItemIndex = user.inventory.findIndex(
    item => item.type === type && item.name === name
  );
  
  let item: InventoryItem;
  
  if (existingItemIndex >= 0) {
    // Update existing item
    user.inventory[existingItemIndex].quantity += quantity;
    item = user.inventory[existingItemIndex];
  } else {
    // Add new item
    item = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type,
      name,
      description,
      quantity,
      icon,
      useEffect,
      value
    };
    user.inventory.push(item);
  }
  
  return item;
};

// Add gold to user
export const addGoldToUser = (user: User, amount: number, source?: string): User => {
  const updatedUser = { ...user };
  
  // Initialize gold if it doesn't exist
  if (updatedUser.gold === undefined) {
    updatedUser.gold = 0;
  }
  
  // Add gold
  updatedUser.gold += amount;
  
  // Show notification
  if (source && amount > 0) {
    toast.success(`Gained ${amount} Gold`, {
      description: `From: ${source}`
    });
  }
  
  // Update stats
  if (!updatedUser.stats) {
    initializeUserStats(updatedUser);
  }
  
  updatedUser.stats.totalGoldEarned += amount;
  
  return updatedUser;
};

// Spend gold for purchases
export const spendGold = (user: User, amount: number, reason?: string): [User, boolean] => {
  const updatedUser = { ...user };
  
  // Initialize gold if it doesn't exist
  if (updatedUser.gold === undefined) {
    updatedUser.gold = 0;
  }
  
  // Check if user has enough gold
  if (updatedUser.gold < amount) {
    toast.error('Not enough gold', {
      description: 'You do not have enough gold for this purchase.'
    });
    return [updatedUser, false]; // Return false for failure
  }
  
  // Spend gold
  updatedUser.gold -= amount;
  
  // Show notification
  if (reason) {
    toast.info(`Spent ${amount} Gold`, {
      description: reason
    });
  }
  
  return [updatedUser, true]; // Return true for success
};

// Track progress for an achievement
export const trackAchievement = (user: User, achievementId: string): User => {
  const updatedUser = { ...user };
  
  // Find achievement in user's achievements
  const achievementIndex = updatedUser.achievements.findIndex(
    a => a.achievementId === achievementId
  );
  
  if (achievementIndex >= 0) {
    // Mark as tracked
    updatedUser.achievements[achievementIndex].isTracked = true;
    
    // Add to active quests if not already there
    if (!updatedUser.activeQuests.includes(achievementId)) {
      updatedUser.activeQuests.push(achievementId);
    }
  }
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Untrack an achievement
export const untrackAchievement = (user: User, achievementId: string): User => {
  const updatedUser = { ...user };
  
  // Find achievement in user's achievements
  const achievementIndex = updatedUser.achievements.findIndex(
    a => a.achievementId === achievementId
  );
  
  if (achievementIndex >= 0) {
    // Mark as untracked
    updatedUser.achievements[achievementIndex].isTracked = false;
    
    // Remove from active quests
    updatedUser.activeQuests = updatedUser.activeQuests.filter(id => id !== achievementId);
  }
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Walking tracker utilities
const WALKING_XP_PER_KM = 10; // XP per kilometer
const WALKING_STORAGE_KEY = 'lorequest_walking_data';

// Get user walking data
export const getUserWalkingData = (userId: string): WalkingData => {
  try {
    const walkingDataJson = localStorage.getItem(WALKING_STORAGE_KEY);
    const allWalkingData = walkingDataJson ? JSON.parse(walkingDataJson) : [];
    
    // Find user data
    const userData = allWalkingData.find((data: WalkingData) => data.userId === userId);
    
    if (userData) {
      return userData;
    }
    
    // Create new walking data for user
    const newData: WalkingData = {
      userId,
      totalDistanceKm: 0,
      earnedXP: 0,
      lastXpAwardDate: new Date().toISOString().split('T')[0]
    };
    
    // Save to storage
    allWalkingData.push(newData);
    localStorage.setItem(WALKING_STORAGE_KEY, JSON.stringify(allWalkingData));
    
    return newData;
  } catch (error) {
    console.error('Error getting walking data:', error);
    return {
      userId,
      totalDistanceKm: 0,
      earnedXP: 0,
      lastXpAwardDate: new Date().toISOString().split('T')[0]
    };
  }
};

// Update walking data with new position
export const updateWalkingData = (
  userId: string,
  latitude: number,
  longitude: number
): {walkingData: WalkingData, xpGained: number, distanceAdded: number} => {
  try {
    // Get all walking data
    const walkingDataJson = localStorage.getItem(WALKING_STORAGE_KEY);
    const allWalkingData = walkingDataJson ? JSON.parse(walkingDataJson) : [];
    
    // Find user data
    const userDataIndex = allWalkingData.findIndex((data: WalkingData) => data.userId === userId);
    let userData: WalkingData;
    
    if (userDataIndex >= 0) {
      userData = allWalkingData[userDataIndex];
    } else {
      userData = {
        userId,
        totalDistanceKm: 0,
        earnedXP: 0,
        lastXpAwardDate: new Date().toISOString().split('T')[0]
      };
      allWalkingData.push(userData);
    }
    
    // Check if we have a previous position
    let distanceKm = 0;
    let xpGained = 0;
    
    if (userData.lastPosition) {
      // Calculate distance
      distanceKm = calculateDistanceKm(
        userData.lastPosition.latitude,
        userData.lastPosition.longitude,
        latitude,
        longitude
      );
      
      // Sanity check - if distance is too large, it might be a GPS error or teleportation
      if (distanceKm > 0 && distanceKm < 1) { // Less than 1km at a time
        // Update total distance
        userData.totalDistanceKm += distanceKm;
        
        // Check if we need to award XP
        const today = new Date().toISOString().split('T')[0];
        const lastXpAwardDate = userData.lastXpAwardDate || '1970-01-01';
        
        // We award XP for distance once per day
        if (today !== lastXpAwardDate && userData.totalDistanceKm >= 1) {
          // Calculate XP to award
          const kmToAward = Math.floor(userData.totalDistanceKm);
          xpGained = kmToAward * WALKING_XP_PER_KM;
          
          // Update lastXpAwardDate and reset distance counter
          userData.lastXpAwardDate = today;
          userData.earnedXP += xpGained;
          userData.totalDistanceKm -= kmToAward; // Keep the fraction for next time
        }
      }
    }
    
    // Update last position
    userData.lastPosition = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    
    // Save all walking data
    if (userDataIndex >= 0) {
      allWalkingData[userDataIndex] = userData;
    }
    
    localStorage.setItem(WALKING_STORAGE_KEY, JSON.stringify(allWalkingData));
    
    return { walkingData: userData, xpGained, distanceAdded: distanceKm };
  } catch (error) {
    console.error('Error updating walking data:', error);
    return { 
      walkingData: {
        userId,
        totalDistanceKm: 0,
        earnedXP: 0,
        lastXpAwardDate: new Date().toISOString().split('T')[0]
      }, 
      xpGained: 0,
      distanceAdded: 0
    };
  }
};

// Calculate distance between two points in kilometers
const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Quest related functions
interface WalkingData {
  userId: string;
  lastPosition?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  totalDistanceKm: number;
  earnedXP: number;
  lastXpAwardDate: string;
}

// Generate daily, weekly, monthly quests
export const generateTimeBasedQuests = (user: User): User => {
  const updatedUser = { ...user };
  const now = new Date();
  
  // Initialize quest storage if needed
  const QUESTS_STORAGE_KEY = `lorequest_quests_${user.id}`;
  let questsData: {
    daily: Quest[];
    weekly: Quest[];
    monthly: Quest[];
    lastDaily: string;
    lastWeekly: string;
    lastMonthly: string;
  } = {
    daily: [],
    weekly: [],
    monthly: [],
    lastDaily: '',
    lastWeekly: '',
    lastMonthly: ''
  };
  
  try {
    const storedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);
    if (storedQuests) {
      questsData = JSON.parse(storedQuests);
    }
  } catch (error) {
    console.error('Failed to load quests data:', error);
  }
  
  // Check if we need to generate new daily quests
  const today = now.toISOString().split('T')[0];
  if (questsData.lastDaily !== today) {
    // Generate new daily quest
    const dailyWalkingQuest: Quest = {
      id: `daily-walking-${today}`,
      name: QUEST_TYPES.DAILY.WALKING_DISTANCE.name,
      description: QUEST_TYPES.DAILY.WALKING_DISTANCE.description,
      type: 'daily',
      targetCount: QUEST_TYPES.DAILY.WALKING_DISTANCE.targetCount,
      xpReward: QUEST_TYPES.DAILY.WALKING_DISTANCE.xpReward,
      goldReward: QUEST_TYPES.DAILY.WALKING_DISTANCE.goldReward,
      completed: false,
      progress: 0,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    };
    
    questsData.daily = [dailyWalkingQuest];
    questsData.lastDaily = today;
  }
  
  // Check if we need to generate new weekly quests
  const startOfWeek = getStartOfWeek(now).toISOString().split('T')[0];
  if (questsData.lastWeekly !== startOfWeek) {
    // Generate new weekly quest
    const weeklyWalkingQuest: Quest = {
      id: `weekly-walking-${startOfWeek}`,
      name: QUEST_TYPES.WEEKLY.WALKING_DISTANCE.name,
      description: QUEST_TYPES.WEEKLY.WALKING_DISTANCE.description,
      type: 'weekly',
      targetCount: QUEST_TYPES.WEEKLY.WALKING_DISTANCE.targetCount,
      xpReward: QUEST_TYPES.WEEKLY.WALKING_DISTANCE.xpReward,
      goldReward: QUEST_TYPES.WEEKLY.WALKING_DISTANCE.goldReward,
      completed: false,
      progress: 0,
      expiresAt: new Date(getStartOfWeek(now).getTime() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    };
    
    questsData.weekly = [weeklyWalkingQuest];
    questsData.lastWeekly = startOfWeek;
  }
  
  // Check if we need to generate new monthly quests
  const startOfMonth = getStartOfMonth(now).toISOString().split('T')[0];
  if (questsData.lastMonthly !== startOfMonth) {
    // Generate new monthly quest
    const monthlyWalkingQuest: Quest = {
      id: `monthly-walking-${startOfMonth}`,
      name: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.name,
      description: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.description,
      type: 'monthly',
      targetCount: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.targetCount,
      xpReward: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.xpReward,
      goldReward: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.goldReward,
      itemReward: QUEST_TYPES.MONTHLY.WALKING_DISTANCE.itemReward,
      completed: false,
      progress: 0,
      expiresAt: new Date(getEndOfMonth(now).getTime()) // Expires at end of month
    };
    
    questsData.monthly = [monthlyWalkingQuest];
    questsData.lastMonthly = startOfMonth;
  }
  
  // Save updated quests
  localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(questsData));
  
  return updatedUser;
};

// Get user's time-based quests
export const getTimeBasedQuests = (userId: string): {
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
} => {
  const QUESTS_STORAGE_KEY = `lorequest_quests_${userId}`;
  
  try {
    const storedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);
    if (storedQuests) {
      const questsData = JSON.parse(storedQuests);
      return {
        daily: questsData.daily || [],
        weekly: questsData.weekly || [],
        monthly: questsData.monthly || []
      };
    }
  } catch (error) {
    console.error('Failed to load quests data:', error);
  }
  
  return {
    daily: [],
    weekly: [],
    monthly: []
  };
};

// Check quest progress based on activity
export const checkQuestProgress = (user: User, activityType: 'walk' | 'discover' | 'other', amount: number): User => {
  const updatedUser = { ...user };
  const userId = updatedUser.id;
  const QUESTS_STORAGE_KEY = `lorequest_quests_${userId}`;
  
  try {
    const storedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);
    if (!storedQuests) return updatedUser;
    
    const questsData = JSON.parse(storedQuests);
    let questsUpdated = false;
    
    // Check for matching quests and update progress
    const updateQuestProgress = (quest: Quest) => {
      if (quest.completed) return quest;
      
      // Matching activity type for walking quests
      if (activityType === 'walk' && (
        quest.type === 'daily' || 
        quest.type === 'weekly' || 
        quest.type === 'monthly'
      )) {
        // Update progress
        quest.progress += amount / quest.targetCount;
        
        // Cap progress at 1.0 (100%)
        if (quest.progress > 1) {
          quest.progress = 1;
        }
        
        // Check for completion
        if (quest.progress >= 1 && !quest.completed) {
          quest.completed = true;
          
          // Award XP and Gold
          if (quest.xpReward) {
            updatedUser.experience += quest.xpReward;
            
            if (!updatedUser.stats) {
              initializeUserStats(updatedUser);
            }
            
            updatedUser.stats.totalXpEarned += quest.xpReward;
            updatedUser.stats.questXpEarned += quest.xpReward;
            
            toast.success(`Quest Complete: ${quest.name}`, {
              description: `Earned ${quest.xpReward} XP!`
            });
          }
          
          if (quest.goldReward) {
            updatedUser.gold = (updatedUser.gold || 0) + quest.goldReward;
            
            if (!updatedUser.stats) {
              initializeUserStats(updatedUser);
            }
            
            updatedUser.stats.totalGoldEarned += quest.goldReward;
            updatedUser.stats.questGoldEarned += quest.goldReward;
            
            toast.success(`Quest Complete: ${quest.name}`, {
              description: `Earned ${quest.goldReward} Gold!`
            });
          }
          
          // Add item reward if available
          if (quest.itemReward) {
            addItemToInventory(
              updatedUser,
              quest.itemReward.type as any,
              quest.itemReward.name,
              `Reward from ${quest.name} quest`,
              quest.itemReward.quantity
            );
            
            toast.success(`Quest Complete: ${quest.name}`, {
              description: `Earned ${quest.itemReward.quantity} ${quest.itemReward.name}!`
            });
          }
          
          // Update quest completion stats
          if (!updatedUser.stats) {
            initializeUserStats(updatedUser);
          }
          
          updatedUser.stats.questsCompleted++;
          
          if (quest.type === 'daily') {
            updatedUser.stats.dailyQuestsCompleted++;
          } else if (quest.type === 'weekly') {
            updatedUser.stats.weeklyQuestsCompleted++;
          } else if (quest.type === 'monthly') {
            updatedUser.stats.monthlyQuestsCompleted++;
          }
        }
        
        questsUpdated = true;
        return quest;
      }
      
      return quest;
    };
    
    // Update all quest types
    questsData.daily = questsData.daily.map(updateQuestProgress);
    questsData.weekly = questsData.weekly.map(updateQuestProgress);
    questsData.monthly = questsData.monthly.map(updateQuestProgress);
    
    // Save updated quests
    if (questsUpdated) {
      localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(questsData));
    }
    
    // Save updated user
    updateUser(updatedUser);
  } catch (error) {
    console.error('Failed to update quests progress:', error);
  }
  
  return updatedUser;
};

// Helper functions for date calculations
const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(date.getDate() - date.getDay()); // Set to Sunday
  result.setHours(0, 0, 0, 0);
  return result;
};

const getStartOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getEndOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0); // Last day of current month
  result.setHours(23, 59, 59, 999);
  return result;
};

// Email verification quest
export const addVerificationQuest = (user: User): User => {
  const updatedUser = { ...user };
  
  // Create verification achievement if not exists
  const hasVerificationAchievement = updatedUser.achievements.some(
    a => a.achievementId === 'email-verification'
  );
  
  if (!hasVerificationAchievement) {
    const verificationAchievement: UserAchievement = {
      achievementId: 'email-verification',
      completed: false,
      progress: user.emailVerified ? 1 : 0,
      isTracked: true
    };
    
    updatedUser.achievements.push(verificationAchievement);
    
    // Add to active quests
    if (!updatedUser.activeQuests.includes('email-verification')) {
      updatedUser.activeQuests.push('email-verification');
    }
  }
  
  return updatedUser;
};

// Complete email verification quest
export const completeVerificationQuest = (user: User): User => {
  const updatedUser = { ...user };
  
  // Find verification achievement
  const achievementIndex = updatedUser.achievements.findIndex(
    a => a.achievementId === 'email-verification'
  );
  
  if (achievementIndex >= 0 && !updatedUser.achievements[achievementIndex].completed) {
    // Mark as completed
    updatedUser.achievements[achievementIndex].completed = true;
    updatedUser.achievements[achievementIndex].progress = 1;
    updatedUser.achievements[achievementIndex].completedAt = new Date();
    
    // Award XP and Gold
    const xpReward = 100;
    const goldReward = 50;
    
    // Add XP
    updatedUser.experience += xpReward;
    
    // Add Gold
    updatedUser.gold = (updatedUser.gold || 0) + goldReward;
    
    // Update stats
    if (!updatedUser.stats) {
      initializeUserStats(updatedUser);
    }
    
    updatedUser.stats.totalXpEarned += xpReward;
    updatedUser.stats.questXpEarned += xpReward;
    updatedUser.stats.totalGoldEarned += goldReward;
    updatedUser.stats.questGoldEarned += goldReward;
    updatedUser.stats.questsCompleted++;
    
    // Show notification
    toast.success('Email Verification Complete!', {
      description: `Earned ${xpReward} XP and ${goldReward} Gold!`
    });
    
    // Add to completed quests
    if (!updatedUser.completedQuests.includes('email-verification')) {
      updatedUser.completedQuests.push('email-verification');
    }
    
    // Remove from active quests
    updatedUser.activeQuests = updatedUser.activeQuests.filter(id => id !== 'email-verification');
  }
  
  return updatedUser;
};

// Upgrade stats using runes
export const upgradeStatWithRune = (user: User, stat: 'strength' | 'intelligence' | 'dexterity'): User => {
  const updatedUser = { ...user };
  
  // Check if user has any runes
  const runesCount = updatedUser.inventory.reduce((total, item) => {
    return item.type === 'rune' ? total + item.quantity : total;
  }, 0);
  
  if (runesCount === 0) {
    toast.error('No Runes Available', {
      description: 'You need runes to upgrade your stats. Level up to earn more runes.'
    });
    return updatedUser;
  }
  
  // Initialize stats if they don't exist
  if (!updatedUser.stats) {
    initializeUserStats(updatedUser);
  }
  
  // Find the first rune in inventory
  const runeIndex = updatedUser.inventory.findIndex(item => item.type === 'rune' && item.quantity > 0);
  
  if (runeIndex >= 0) {
    // Use one rune
    updatedUser.inventory[runeIndex].quantity -= 1;
    
    // If quantity becomes 0, remove the item
    if (updatedUser.inventory[runeIndex].quantity <= 0) {
      updatedUser.inventory = updatedUser.inventory.filter((_, index) => index !== runeIndex);
    }
    
    // Upgrade the stat
    updatedUser.stats[stat] += 1;
    
    // Recalculate player stats
    recalculatePlayerStats(updatedUser);
    
    // Show notification
    toast.success(`${stat.charAt(0).toUpperCase() + stat.slice(1)} Increased!`, {
      description: `Your ${stat} is now ${updatedUser.stats[stat]}.`
    });
  }
  
  return updatedUser;
};
