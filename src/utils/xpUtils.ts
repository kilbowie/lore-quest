
import { LEVEL_CONSTANTS, User, Achievement, UserAchievement, InventoryItem } from "../types";
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

// Add item to user inventory
export const addItemToInventory = (
  user: User,
  type: 'rune' | 'map' | 'compass' | 'weapon' | 'other',
  name: string,
  description: string,
  quantity: number
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
      quantity
    };
    user.inventory.push(item);
  }
  
  return item;
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

interface WalkingData {
  userId: string;
  lastPosition?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  totalDistanceKm: number;
  earnedXP: number;
  lastXpAwardDate: string; // YYYY-MM-DD
}

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
): {walkingData: WalkingData, xpGained: number} => {
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
    
    return { walkingData: userData, xpGained };
  } catch (error) {
    console.error('Error updating walking data:', error);
    return { 
      walkingData: {
        userId,
        totalDistanceKm: 0,
        earnedXP: 0,
        lastXpAwardDate: new Date().toISOString().split('T')[0]
      }, 
      xpGained: 0 
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
