import { User, Quest, Achievement, ItemType, EquippableItem, InventoryItem, EquipmentStats, EquipmentSlot, UserAchievement } from "../types";
import { getUsers, updateUser } from "./authUtils";
import { toast } from "@/components/ui/sonner";

// Add experience points to the user
export const addExperience = (user: User, amount: number, reason?: string): User => {
  // Get current experience and calculate new experience
  const currentExperience = user.experience || 0;
  const newExperience = currentExperience + amount;
  
  // Check if the user leveled up
  let newLevel = user.level || 1;
  const experienceNeededForLevel = calculateExperienceForLevel(newLevel + 1);
  
  const updatedUser = { ...user };
  
  // Update user stats
  updatedUser.stats = {
    ...user.stats,
    totalXpEarned: (user.stats?.totalXpEarned || 0) + amount
  };
  
  if (newExperience >= experienceNeededForLevel) {
    newLevel += 1;
    
    // Show level up toast
    toast.success(`Level Up! You are now level ${newLevel}`, {
      description: "New abilities and quests are now available to you!"
    });
    
    // Add rewards for leveling up (gold, items, etc)
    updatedUser.gold = (updatedUser.gold || 0) + (newLevel * 50); // Gold reward based on new level
    
    // Add a leveling reward item
    const rewardUpdatedUser = addItemToInventory(
      updatedUser,
      "other", // Changed from "chest" to "other" to match the allowed ItemType values
      `Level ${newLevel} Achievement Chest`,
      "A special reward for reaching level " + newLevel,
      1,
      "chest",
      "none"
    );
    
    // Copy properties from the reward updated user
    Object.assign(updatedUser, rewardUpdatedUser);
  }
  
  // If reason is provided, show a toast with the reason
  if (reason && amount > 0) {
    toast.success(`+${amount} XP`, {
      description: reason
    });
  }
  
  // Update the user object
  updatedUser.experience = newExperience;
  updatedUser.level = newLevel;
  
  // Persist changes
  updateUser(updatedUser);
  
  return updatedUser;
};

// Calculate the total experience needed for a given level
export const calculateExperienceForLevel = (level: number): number => {
  // Simple formula: Each level requires level^2 * 100 XP
  return level * level * 100;
};

// Calculate level progress percentage
export const calculateLevelProgress = (user: User): number => {
  if (!user) return 0;
  
  const currentLevel = user.level || 1;
  const currentXP = user.experience || 0;
  const xpForCurrentLevel = calculateExperienceForLevel(currentLevel);
  const xpForNextLevel = calculateExperienceForLevel(currentLevel + 1);
  
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  
  return Math.floor((xpProgress / xpNeeded) * 100);
};

// Calculate XP needed for next level
export const xpToNextLevel = (user: User): number => {
  if (!user) return 0;
  
  const currentLevel = user.level || 1;
  const currentXP = user.experience || 0;
  const xpForNextLevel = calculateExperienceForLevel(currentLevel + 1);
  
  return xpForNextLevel - currentXP;
};

// Add an item to the user's inventory
export const addItemToInventory = (
  user: User, 
  type: ItemType, 
  name: string, 
  description: string,
  quantity: number = 1, 
  icon?: string,
  useEffect?: "health" | "mana" | "stamina" | "revival" | "none",
  value?: number,
  isEquippable?: boolean,
  equipmentStats?: EquipmentStats
): User => {
  // Create a copy of the user's inventory or initialize if it doesn't exist
  const inventory = user.inventory ? [...user.inventory] : [];
  
  // Check if item already exists in inventory
  const existingItemIndex = inventory.findIndex(item => 
    item.name === name && item.type === type && !item.isEquippable
  );
  
  if (existingItemIndex !== -1 && !isEquippable) {
    // Update quantity if it's not an equippable item
    inventory[existingItemIndex].quantity += quantity;
  } else {
    // Add new item, ensuring it matches the required type
    if (isEquippable && equipmentStats) {
      // For equippable items, we need to create a properly typed EquippableItem
      const equippableItem: EquippableItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        name,
        description,
        quantity,
        icon,
        useEffect,
        value,
        isEquippable: true as const, // Use const assertion to ensure it's the literal true
        equipmentStats
      };
      
      inventory.push(equippableItem);
    } else {
      // For regular items
      const newItem: InventoryItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        name,
        description,
        quantity,
        icon,
        useEffect,
        value,
        isEquippable: false, // Explicitly set to false for regular items
        equipmentStats
      };
      
      inventory.push(newItem);
    }
  }
  
  // Update user with new inventory
  const updatedUser = { ...user, inventory };
  
  // Show toast for item acquisition
  toast.success(`Acquired ${quantity}x ${name}`, {
    description: description
  });
  
  return updatedUser;
};

// Add gold to user
export const addGold = (user: User, amount: number, reason?: string): User => {
  const updatedUser = { ...user };
  updatedUser.gold = (updatedUser.gold || 0) + amount;
  
  if (reason && amount > 0) {
    toast.success(`+${amount} Gold`, {
      description: reason
    });
  }
  
  updateUser(updatedUser);
  return updatedUser;
};

// Spend gold (return original user if not enough gold)
export const spendGold = (user: User, amount: number, reason?: string): User => {
  if ((user.gold || 0) < amount) {
    toast.error(`Not enough gold`, {
      description: `You need ${amount} gold for this purchase.`
    });
    return user;
  }
  
  const updatedUser = { ...user };
  updatedUser.gold = (updatedUser.gold || 0) - amount;
  
  if (reason) {
    toast.success(`Spent ${amount} Gold`, {
      description: reason
    });
  }
  
  updateUser(updatedUser);
  return updatedUser;
};

// Get user walking data
export const getUserWalkingData = (userId: string) => {
  const todayKey = new Date().toISOString().split('T')[0];
  const storageKey = `walking_data_${userId}_${todayKey}`;
  
  const storedData = localStorage.getItem(storageKey);
  
  if (storedData) {
    return JSON.parse(storedData);
  } else {
    return {
      totalDistanceKm: 0,
      earnedXP: 0,
      steps: 0,
      lastUpdate: new Date().toISOString()
    };
  }
};

// Add walking distance
export const addWalkingDistance = (user: User, distanceKm: number): User => {
  if (!user) return user;
  
  // Get today's date string for storage key
  const todayKey = new Date().toISOString().split('T')[0];
  const storageKey = `walking_data_${user.id}_${todayKey}`;
  
  // Get existing walking data or initialize
  const walkingData = getUserWalkingData(user.id);
  
  // Update walking data
  walkingData.totalDistanceKm += distanceKm;
  walkingData.steps += Math.floor(distanceKm * 1312); // ~1312 steps per km
  
  // Calculate XP earned (10 XP per km)
  const xpEarned = Math.floor(distanceKm * 10);
  walkingData.earnedXP += xpEarned;
  walkingData.lastUpdate = new Date().toISOString();
  
  // Save updated walking data
  localStorage.setItem(storageKey, JSON.stringify(walkingData));
  
  // Update user stats
  const updatedUser = {
    ...user,
    stats: {
      ...user.stats,
      distanceTravelled: (user.stats?.distanceTravelled || 0) + distanceKm,
      walkingXpEarned: (user.stats?.walkingXpEarned || 0) + xpEarned
    }
  };
  
  // Add the earned XP to the user
  return addExperience(updatedUser, xpEarned, `Walking ${distanceKm.toFixed(2)} km`);
};

// Award XP for walking
export const awardWalkingXp = (user: User, distanceKm: number): { updatedUser: User; xpAwarded: number } => {
  if (!user) return { updatedUser: user, xpAwarded: 0 };
  
  // Calculate XP (10 XP per km)
  const xpAwarded = Math.floor(distanceKm * 10);
  
  // Add XP to user
  const updatedUser = {
    ...user,
    stats: {
      ...user.stats,
      walkingXpEarned: (user.stats?.walkingXpEarned || 0) + xpAwarded,
      distanceTravelled: (user.stats?.distanceTravelled || 0) + distanceKm
    }
  };
  
  // Add the experience
  const userWithXp = addExperience(updatedUser, xpAwarded, `Walking ${distanceKm.toFixed(2)} km`);
  
  return { updatedUser: userWithXp, xpAwarded };
};

// Check and regenerate health, mana, stamina
export const checkRegeneration = (user: User): User => {
  if (!user) return user;
  
  // Add lastRegenCheck property to User type if it's missing
  const lastChecked = user.lastRegenCheck ? new Date(user.lastRegenCheck) : new Date();
  const now = new Date();
  const diffMinutes = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
  
  // If less than 5 minutes since last check, return user unchanged
  if (diffMinutes < 5) return user;
  
  // Calculate regeneration (1% of max per 5 minutes)
  const healthRegen = Math.floor((user.maxHealth || 100) * 0.01 * (diffMinutes / 5));
  const manaRegen = Math.floor((user.maxMana || 100) * 0.01 * (diffMinutes / 5));
  const staminaRegen = Math.floor((user.maxStamina || 100) * 0.01 * (diffMinutes / 5));
  
  const updatedUser = { ...user };
  
  // Apply regeneration, not exceeding max values
  updatedUser.health = Math.min(user.maxHealth || 100, (user.health || 0) + healthRegen);
  updatedUser.mana = Math.min(user.maxMana || 100, (user.mana || 0) + manaRegen);
  updatedUser.stamina = Math.min(user.maxStamina || 100, (user.stamina || 0) + staminaRegen);
  updatedUser.lastRegenCheck = now.toISOString();
  
  // Only update if there were actual changes
  if (healthRegen > 0 || manaRegen > 0 || staminaRegen > 0) {
    updateUser(updatedUser);
  }
  
  return updatedUser;
};

// Initialize time-based quests
export const getTimeBasedQuests = (userId: string) => {
  // Get the quests from local storage or initialize
  const storageKey = `time_quests_${userId}`;
  const storedQuests = localStorage.getItem(storageKey);
  
  if (storedQuests) {
    return JSON.parse(storedQuests);
  }
  
  // Initialize with default quests
  const defaultQuests = {
    daily: [
      {id: 'daily-1', title: 'Daily Walk', description: 'Walk 2km today', completed: false},
      {id: 'daily-2', title: 'Visit Landmark', description: 'Discover a new location', completed: false}
    ],
    weekly: [
      {id: 'weekly-1', title: 'Complete Daily Quests', description: 'Complete 5 daily quests', completed: false},
      {id: 'weekly-2', title: 'Long Journey', description: 'Walk a total of 10km', completed: false}
    ],
    monthly: [
      {id: 'monthly-1', title: 'Dedicated Explorer', description: 'Complete 4 weekly quests', completed: false},
      {id: 'monthly-2', title: 'Grand Expedition', description: 'Discover 10 unique locations', completed: false}
    ]
  };
  
  // Save to local storage
  localStorage.setItem(storageKey, JSON.stringify(defaultQuests));
  
  return defaultQuests;
};

// Create specific stat tracking/updating functions
export const updateUserStats = (user: User, statUpdates: Partial<typeof user.stats>): User => {
  if (!user || !user.stats) return user;
  
  const updatedUser = {
    ...user,
    stats: {
      ...user.stats,
      ...statUpdates
    }
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

// Upgrade player stat with rune (STR, INT, DEX)
export const upgradeStatWithRune = (user: User, stat: 'strength' | 'intelligence' | 'dexterity'): User => {
  if (!user) return user;
  
  const updatedUser = { ...user };
  if (!updatedUser.stats) {
    updatedUser.stats = {
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
    };
  }
  
  // Increase the specified stat
  updatedUser.stats[stat] += 1;
  
  // Update derived stats based on core stats
  updatedUser.maxHealth = 100 + (updatedUser.stats.strength * 10);
  updatedUser.maxMana = 100 + (updatedUser.stats.intelligence * 10);
  updatedUser.maxStamina = 100 + (updatedUser.stats.dexterity * 10);
  
  // Ensure current values don't exceed new maximums
  updatedUser.health = Math.min(updatedUser.health || 100, updatedUser.maxHealth);
  updatedUser.mana = Math.min(updatedUser.mana || 100, updatedUser.maxMana);
  updatedUser.stamina = Math.min(updatedUser.stamina || 100, updatedUser.maxStamina);
  
  updateUser(updatedUser);
  
  toast.success(`${stat.charAt(0).toUpperCase() + stat.slice(1)} increased to ${updatedUser.stats[stat]}`, {
    description: "Your character's abilities have improved!"
  });
  
  return updatedUser;
};

// Achievement tracking functions
export const trackAchievement = (user: User, achievementId: string): User => {
  if (!user) return user;
  
  // Ensure the trackedAchievements array exists
  if (!user.trackedAchievements) {
    user = { ...user, trackedAchievements: [] };
  }
  
  // Only allow 3 tracked achievements max
  if (user.trackedAchievements.length >= 3) {
    toast.error("You can only track 3 achievements at once", {
      description: "Please untrack an achievement before tracking a new one"
    });
    return user;
  }
  
  // Check if achievement is already tracked
  if (user.trackedAchievements.includes(achievementId)) {
    return user;
  }
  
  const updatedUser = {
    ...user,
    trackedAchievements: [...user.trackedAchievements, achievementId]
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

export const untrackAchievement = (user: User, achievementId: string): User => {
  if (!user) return user;
  
  // Ensure the trackedAchievements array exists
  if (!user.trackedAchievements) {
    return user;
  }
  
  const updatedUser = {
    ...user,
    trackedAchievements: user.trackedAchievements.filter(id => id !== achievementId)
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

// Initialize user stats
export const initializeUserStats = (user: User): User => {
  const initialStats = {
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
  };
  
  const updatedUser = {
    ...user,
    stats: initialStats
  };
  
  return updatedUser;
};

// Add a new quest to the user's active quests
export const addQuest = (user: User, quest: Quest): User => {
  // Check if user.activeQuests is a string array or Quest array
  // If it's a Quest array, we need to extract just the IDs
  const updatedUser = {
    ...user,
    activeQuests: [...(user.activeQuests || []), quest.id]
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

// Remove a quest from the user's active quests and add it to completed quests
export const completeQuest = (user: User, questId: string, awardToast: boolean = true): User => {
  // Find the quest in the activeQuests array
  const questToRemoveIndex = user.activeQuests.findIndex(quest => quest === questId);
  
  if (questToRemoveIndex === -1) {
    console.warn(`Quest with ID ${questId} not found in active quests.`);
    return user;
  }
  
  // Create a copy of the activeQuests array and remove the quest
  const updatedActiveQuests = [...user.activeQuests];
  const questIdToRemove = updatedActiveQuests.splice(questToRemoveIndex, 1)[0];
  
  // Get quest details from somewhere (you might need to implement this)
  const questDetails = getQuestDetails(questIdToRemove);
  
  if (!questDetails) {
    console.warn(`Quest details for ID ${questId} not found.`);
    return user;
  }
  
  // Create a copy of the completedQuests array and add the quest
  const updatedCompletedQuests = user.completedQuests ? [...user.completedQuests] : [];
  updatedCompletedQuests.push(questIdToRemove);
  
  // Update user stats
  let updatedUser = {
    ...user,
    activeQuests: updatedActiveQuests,
    completedQuests: updatedCompletedQuests,
    stats: {
      ...user.stats,
      questsCompleted: (user.stats?.questsCompleted || 0) + 1,
      questXpEarned: (user.stats?.questXpEarned || 0) + questDetails.xpReward,
      questGoldEarned: (user.stats?.questGoldEarned || 0) + (questDetails.goldReward || 0)
    }
  };
  
  // Add quest rewards
  updatedUser = addExperience(updatedUser, questDetails.xpReward, `Completed Quest: ${questDetails.name}`);
  updatedUser.gold = (updatedUser.gold || 0) + (questDetails.goldReward || 0);
  
  // Show toast for quest completion
  if (awardToast) {
    toast.success(`Quest Completed: ${questDetails.name}`, {
      description: questDetails.description
    });
  }
  
  updateUser(updatedUser);
  return updatedUser;
};

// Helper function to get quest details from a quest ID
const getQuestDetails = (questId: string): Quest | null => {
  // This is a placeholder. You should implement this to retrieve quest details
  // from your database or local storage.
  return null;
};

// Add a new achievement to the user's achievements
export const addAchievement = (user: User, achievement: Achievement): User => {
  const userAchievement: UserAchievement = {
    achievementId: achievement.id,
    completed: true,
    progress: 100,
    isTracked: false
  };
  
  const updatedUser = {
    ...user,
    achievements: [...(user.achievements || []), userAchievement],
    stats: {
      ...user.stats,
      achievementsUnlocked: (user.stats?.achievementsUnlocked || 0) + 1
    }
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

// Check if a user has completed a specific quest
export const hasCompletedQuest = (user: User, questId: string): boolean => {
  return (user.completedQuests || []).some(qId => qId === questId);
};

// Check if a user has unlocked a specific achievement
export const hasUnlockedAchievement = (user: User, achievementId: string): boolean => {
  return (user.achievements || []).some(achievement => achievement.achievementId === achievementId);
};

// Generate daily quests for the user
export const generateDailyQuests = (user: User): User => {
  // Define possible daily quests
  const possibleQuests: Quest[] = [
    {
      id: "daily-quest-1",
      name: "Explore Local Areas",
      description: "Discover 3 new locations in your vicinity.",
      xpReward: 150,
      goldReward: 75,
      type: "daily" as QuestType,
      requiredLevel: 1,
      tasks: ["Discover 3 new locations"]
    },
    {
      id: "daily-quest-2",
      name: "Take a Morning Stroll",
      description: "Walk a distance of 2km before noon.",
      xpReward: 120,
      goldReward: 60,
      type: "daily" as QuestType,
      requiredLevel: 1,
      tasks: ["Walk 2km before noon"]
    },
    {
      id: "daily-quest-3",
      name: "Visit a Landmark",
      description: "Visit a historical landmark or monument.",
      xpReward: 180,
      goldReward: 90,
      type: "daily" as QuestType,
      requiredLevel: 1,
      tasks: ["Visit a historical landmark"]
    }
  ];
  
  // Filter out quests that the user has already completed today
  const availableQuests = possibleQuests.filter(quest => !hasCompletedQuest(user, quest.id));
  
  if (availableQuests.length === 0) {
    // User has completed all possible daily quests today
    return user;
  }
  
  // Select a random quest from the available quests
  const randomIndex = Math.floor(Math.random() * availableQuests.length);
  const selectedQuest = availableQuests[randomIndex];
  
  // Add the selected quest to the user's active quests
  const updatedUser = addQuest(user, selectedQuest);
  
  return updatedUser;
};

// Generate weekly quests for the user
export const generateWeeklyQuests = (user: User): User => {
  // Define possible weekly quests
  const possibleQuests: Quest[] = [
    {
      id: "weekly-quest-1",
      name: "Explore Different Realms",
      description: "Discover locations in 3 different realms (countries).",
      xpReward: 500,
      goldReward: 250,
      type: "weekly" as QuestType,
      requiredLevel: 5,
      tasks: ["Discover locations in 3 different realms"]
    },
    {
      id: "weekly-quest-2",
      name: "Long Distance Journey",
      description: "Travel a total distance of 20km in a week.",
      xpReward: 400,
      goldReward: 200,
      type: "weekly" as QuestType,
      requiredLevel: 5,
      tasks: ["Travel 20km in a week"]
    },
    {
      id: "weekly-quest-3",
      name: "Visit Multiple Landmarks",
      description: "Visit 5 different historical landmarks or monuments.",
      xpReward: 600,
      goldReward: 300,
      type: "weekly" as QuestType,
      requiredLevel: 5,
      tasks: ["Visit 5 different historical landmarks"]
    }
  ];
  
  // Filter out quests that the user has already completed this week
  const availableQuests = possibleQuests.filter(quest => !hasCompletedQuest(user, quest.id));
  
  if (availableQuests.length === 0) {
    // User has completed all possible weekly quests this week
    return user;
  }
  
  // Select a random quest from the available quests
  const randomIndex = Math.floor(Math.random() * availableQuests.length);
  const selectedQuest = availableQuests[randomIndex];
  
  // Add the selected quest to the user's active quests
  const updatedUser = addQuest(user, selectedQuest);
  
  return updatedUser;
};

// Generate monthly quests for the user
export const generateMonthlyQuests = (user: User): User => {
  // Define possible monthly quests
  const possibleQuests = [
    {
      id: "monthly-quest-1",
      name: "Grand Explorer",
      description: "Discover 15 new locations this month.",
      xpReward: 1500,
      goldReward: 750,
      type: "monthly" as QuestType,
      requiredLevel: 10,
      tasks: ["Discover 15 new locations"]
    },
    {
      id: "monthly-quest-2",
      name: "Marathon Walker",
      description: "Walk a total distance of 100km this month.",
      xpReward: 1200,
      goldReward: 600,
      type: "monthly" as QuestType,
      requiredLevel: 10,
      tasks: ["Walk 100km this month"]
    },
    {
      id: "monthly-quest-3",
      name: "Historical Enthusiast",
      description: "Visit 20 different historical landmarks or monuments this month.",
      xpReward: 1800,
      goldReward: 900,
      type: "monthly" as QuestType,
      requiredLevel: 10,
      tasks: ["Visit 20 different historical landmarks"]
    }
  ];
  
  // Filter out quests that the user has already completed this month
  const availableQuests = possibleQuests.filter(quest => !hasCompletedQuest(user, quest.id));
  
  if (availableQuests.length === 0) {
    // User has completed all possible monthly quests this month
    return user;
  }
  
  // Select a random quest from the available quests
  const randomIndex = Math.floor(Math.random() * availableQuests.length);
  const selectedQuest = availableQuests[randomIndex];
  
  // Add the selected quest to the user's active quests
  const updatedUser = addQuest(user, selectedQuest);
  
  return updatedUser;
};

// Generate time-based quests (daily, weekly, monthly)
export const generateTimeBasedQuests = (user: User): User => {
  const now = new Date();
  
  // Get the last quest generation date from local storage
  const lastQuestGenerationDate = localStorage.getItem(`lastQuestGenerationDate_${user.id}`);
  
  if (lastQuestGenerationDate) {
    const lastGenerationDate = new Date(lastQuestGenerationDate);
    
    // Check if it's a new day, week, or month
    const isNewDay = now.getDate() !== lastGenerationDate.getDate();
    const isNewWeek = now.getDay() === 0 && now.getTime() > lastGenerationDate.getTime() + (7 * 24 * 60 * 60 * 1000); // Sunday
    const isNewMonth = now.getMonth() !== lastGenerationDate.getMonth();
    
    let updatedUser = user;
    
    if (isNewDay) {
      // Generate daily quests
      updatedUser = generateDailyQuests(user);
      
      // Update daily quests completed stat
      updatedUser.stats = {
        ...user.stats,
        dailyQuestsCompleted: 0
      };
    }
    
    if (isNewWeek) {
      // Generate weekly quests
      updatedUser = generateWeeklyQuests(user);
      
      // Update weekly quests completed stat
      updatedUser.stats = {
        ...user.stats,
        weeklyQuestsCompleted: 0
      };
    }
    
    if (isNewMonth) {
      // Generate monthly quests
      updatedUser = generateMonthlyQuests(user);
      
      // Update monthly quests completed stat
      updatedUser.stats = {
        ...user.stats,
        monthlyQuestsCompleted: 0
      };
    }
    
    // Save the current date as the last quest generation date
    localStorage.setItem(`lastQuestGenerationDate_${user.id}`, now.toISOString());
    
    return updatedUser;
  } else {
    // First time generating quests for the user
    let updatedUser = user;
    
    // Generate all quests
    updatedUser = generateDailyQuests(user);
    updatedUser = generateWeeklyQuests(user);
    updatedUser = generateMonthlyQuests(user);
    
    // Save the current date as the last quest generation date
    localStorage.setItem(`lastQuestGenerationDate_${user.id}`, now.toISOString());
    
    return updatedUser;
  }
};

// Add email verification quest
export const addVerificationQuest = (user: User): User => {
  // Define verification quest
  const verificationQuest = {
    id: "email-verification-quest",
    name: "Verify Your Email",
    description: "Verify your email address to unlock exclusive rewards.",
    xpReward: 250,
    goldReward: 100,
    type: "verification" as QuestType,
    requiredLevel: 1,
    tasks: ["Verify your email address"]
  };
  
  // Define verification achievement
  const verificationAchievement = {
    id: "email-verification", // Changed from achievementId to id
    name: "Email Verified", // Changed from title to name
    description: "Successfully verified your email address.",
    xpReward: 500,
    icon: "email"
  };
  
  // Add the verification quest to the user's active quests
  let updatedUser = addQuest(user, verificationQuest);
  
  // Add the verification achievement to the user's achievements
  updatedUser = addAchievement(updatedUser, verificationAchievement);
  
  return updatedUser;
};

// Complete email verification quest
export const completeVerificationQuest = (user: User): User => {
  // Complete the quest
  let updatedUser = completeQuest(user, "email-verification-quest", false);
  
  // Show toast for email verification
  toast.success("Email Verified!", {
    description: "You have successfully verified your email address and unlocked exclusive rewards."
  });
  
  return updatedUser;
};

// Equip an item
export const equipItem = (user: User, itemId: string): User => {
  if (!user || !user.inventory) return user;
  
  // Find the item in the inventory
  const itemIndex = user.inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return user;
  
  const item = user.inventory[itemIndex];
  
  // Check if the item is equippable
  if (!item.isEquippable || !item.equipmentStats) {
    toast.error("This item cannot be equipped");
    return user;
  }
  
  // Create a copy of the user's equipment or initialize if it doesn't exist
  const updatedEquipment = user.equipment ? { ...user.equipment } : {};
  
  // Get the slot this item belongs to
  const slot = item.equipmentStats.slot;
  
  // Check if there's already an item in this slot
  const currentItem = updatedEquipment[slot];
  
  // Create updated user object
  let updatedUser = { ...user };
  
  // If there's already an item equipped in this slot, put it back in the inventory
  if (currentItem) {
    // Add the current item back to inventory
    updatedUser = addItemToInventory(
      updatedUser,
      currentItem.type,
      currentItem.name,
      currentItem.description || "",
      1,
      currentItem.icon,
      currentItem.useEffect,
      currentItem.value,
      true,
      currentItem.equipmentStats
    );
  }
  
  // Remove one of the equipped item from inventory
  const updatedInventory = [...updatedUser.inventory];
  if (item.quantity <= 1) {
    // Remove item entirely if only 1 remains
    updatedInventory.splice(itemIndex, 1);
  } else {
    // Decrement quantity if multiple exist
    updatedInventory[itemIndex] = { ...item, quantity: item.quantity - 1 };
  }
  
  // Equip the item - ensuring it's correctly typed as EquippableItem
  // Ensure equipmentStats is not optional when creating the equippableItem
  const equippableItem: EquippableItem = {
    ...item,
    isEquippable: true as const,
    equipmentStats: item.equipmentStats // This is now guaranteed to exist due to the check above
  };
  
  updatedEquipment[slot] = equippableItem;
  
  // Update user object
  updatedUser = {
    ...updatedUser,
    inventory: updatedInventory,
    equipment: updatedEquipment
  };
  
  // Recalculate armor and other stats based on equipped items
  updatedUser = recalculateStats(updatedUser);
  
  // Show toast for equipped item
  toast.success(`Equipped ${item.name}`, {
    description: `${item.name} has been equipped in the ${slot} slot.`
  });
  
  updateUser(updatedUser);
  return updatedUser;
};

// Unequip an item
export const unequipItem = (user: User, slot: EquipmentSlot): User => {
  if (!user || !user.equipment) return user;
  
  // Get the item in the slot
  const item = user.equipment[slot];
  if (!item) return user;
  
  // Create updated user object
  let updatedUser = { ...user };
  
  // Add the item back to inventory
  updatedUser = addItemToInventory(
    updatedUser,
    item.type,
    item.name,
    item.description || "",
    1,
    item.icon,
    item.useEffect,
    item.value,
    true,
    item.equipmentStats
  );
  
  // Create a copy of the equipment and remove the item from the slot
  const updatedEquipment = { ...updatedUser.equipment };
  delete updatedEquipment[slot];
  
  // Update user object
  updatedUser = {
    ...updatedUser,
    equipment: updatedEquipment
  };
  
  // Recalculate armor and other stats based on equipped items
  updatedUser = recalculateStats(updatedUser);
  
  // Show toast for unequipped item
  toast.success(`Unequipped ${item.name}`, {
    description: `${item.name} has been removed from the ${slot} slot.`
  });
  
  updateUser(updatedUser);
  return updatedUser;
};

// Recalculate user stats based on equipment
const recalculateStats = (user: User): User => {
  if (!user || !user.equipment) return user;
  
  // Start with base stats
  let armor = 0;
  let bonusStrength = 0;
  let bonusIntelligence = 0;
  let bonusDexterity = 0;
  
  // Calculate equipment bonuses
  Object.values(user.equipment).forEach(item => {
    if (!item || !item.equipmentStats) return;
    
    // Add armor
    if (item.equipmentStats.armor) {
      armor += item.equipmentStats.armor;
    }
    
    // Add stat bonuses
    if (item.equipmentStats.statBonuses) {
      item.equipmentStats.statBonuses.forEach(bonus => {
        if (bonus.attribute === 'strength') {
          bonusStrength += bonus.value;
        } else if (bonus.attribute === 'intelligence') {
          bonusIntelligence += bonus.value;
        } else if (bonus.attribute === 'dexterity') {
          bonusDexterity += bonus.value;
        }
      });
    }
  });
  
  // Update user stats
  const updatedUser = {
    ...user,
    armor,
    stats: {
      ...user.stats,
      totalStrength: (user.stats?.strength || 0) + bonusStrength,
      totalIntelligence: (user.stats?.intelligence || 0) + bonusIntelligence,
      totalDexterity: (user.stats?.dexterity || 0) + bonusDexterity
    }
  };
  
  return updatedUser;
};
