
import { LEVEL_CONSTANTS, User, Achievement, UserAchievement } from "../types";
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
export const calculateLevelProgress = (user: User): number => {
  const currentLevelXp = calculateXpForLevel(user.level);
  const nextLevelXp = calculateXpForLevel(user.level + 1);
  const xpInCurrentLevel = user.experience - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  
  return Math.min(100, Math.floor((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
};

// Add XP to user and handle level up
export const addExperience = (user: User, xpAmount: number): User => {
  const updatedUser = { ...user };
  const oldLevel = updatedUser.level;
  
  // Add XP
  updatedUser.experience += xpAmount;
  
  // Check for level up
  while (
    updatedUser.level < LEVEL_CONSTANTS.MAX_LEVEL &&
    updatedUser.experience >= calculateXpForLevel(updatedUser.level + 1)
  ) {
    updatedUser.level += 1;
    
    // Add a rune to inventory on level up
    addItemToInventory(updatedUser, 'rune', `Level ${updatedUser.level} Rune`, 
      `A mystical rune gained upon reaching level ${updatedUser.level}`, 1);
  }
  
  // Show level up notification
  if (updatedUser.level > oldLevel) {
    toast.success(`Level Up! You are now level ${updatedUser.level}`, {
      description: "You've gained a new rune in your inventory!"
    });
  }
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Add item to user inventory
export const addItemToInventory = (
  user: User,
  type: 'rune' | 'map' | 'compass' | 'other',
  name: string,
  description: string,
  quantity: number
): void => {
  // Check if item already exists
  const existingItemIndex = user.inventory.findIndex(
    item => item.type === type && item.name === name
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item
    user.inventory[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    user.inventory.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type,
      name,
      description,
      quantity
    });
  }
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
