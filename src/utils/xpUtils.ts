import { User, Quest, Achievement, Item, ItemType, EquippableItem, InventoryItem, EquipmentStats } from "../types";
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
    if (newLevel % 5 === 0) {
      // Every 5 levels, add a special item
      updatedUser = addItemToInventory(
        updatedUser,
        "Special Reward",
        `Level ${newLevel} Achievement Chest`,
        "chest",
        1,
        "A special reward for reaching level " + newLevel,
        "chest"
      );
    }
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

// Add an item to the user's inventory
export const addItemToInventory = (
  user: User, 
  name: string, 
  description: string, 
  type: ItemType, 
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

// Remove an item from the user's inventory
export const removeItemFromInventory = (user: User, itemId: string, quantityToRemove: number = 1): User => {
  const inventory = user.inventory ? [...user.inventory] : [];
  const itemIndex = inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    console.warn(`Item with ID ${itemId} not found in inventory.`);
    return user;
  }
  
  const item = inventory[itemIndex];
  
  if (item.quantity && item.quantity > quantityToRemove) {
    // Decrease the quantity of the item
    inventory[itemIndex].quantity -= quantityToRemove;
  } else {
    // Remove the item from the inventory
    inventory.splice(itemIndex, 1);
  }
  
  const updatedUser = { ...user, inventory };
  updateUser(updatedUser);
  
  return updatedUser;
};

// Equip an item
export const equipItem = (user: User, itemId: string): User => {
  const inventory = user.inventory ? [...user.inventory] : [];
  const itemIndex = inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    console.warn(`Item with ID ${itemId} not found in inventory.`);
    return user;
  }
  
  const item = inventory[itemIndex];
  
  if (!item.isEquippable) {
    console.warn(`Item with ID ${itemId} is not equippable.`);
    return user;
  }
  
  // Get the equipment slot based on the item type
  const equipmentSlot = item.type;
  
  // Create a copy of the user's equipment or initialize if it doesn't exist
  const equipment = user.equipment ? { ...user.equipment } : {};
  
  // Unequip the currently equipped item in the slot, if any
  if (equipment[equipmentSlot]) {
    const unequippedItem = equipment[equipmentSlot];
    
    // Add the unequipped item back to the inventory
    const updatedUserWithUnequippedItem = addItemToInventory(
      user,
      unequippedItem.name,
      unequippedItem.description,
      unequippedItem.type,
      1,
      unequippedItem.icon,
      unequippedItem.useEffect,
      unequippedItem.value,
      true,
      unequippedItem.equipmentStats
    );
    
    // Remove the unequipped item from the equipment
    delete equipment[equipmentSlot];
    
    // Remove the equipped item from the inventory
    const updatedUserWithoutEquippedItem = removeItemFromInventory(updatedUserWithUnequippedItem, itemId, 1);
    
    // Equip the new item
    equipment[equipmentSlot] = item;
    
    // Update user with new equipment and inventory
    const updatedUser = { ...updatedUserWithoutEquippedItem, equipment };
    
    // Update user armor
    updatedUser.armor = calculateArmor(updatedUser);
    
    updateUser(updatedUser);
    
    return updatedUser;
  } else {
    // Equip the new item
    equipment[equipmentSlot] = item;
    
    // Remove the equipped item from the inventory
    const updatedUserWithoutEquippedItem = removeItemFromInventory(user, itemId, 1);
    
    // Update user with new equipment and inventory
    const updatedUser = { ...updatedUserWithoutEquippedItem, equipment };
    
    // Update user armor
    updatedUser.armor = calculateArmor(updatedUser);
    
    updateUser(updatedUser);
    
    return updatedUser;
  }
};

// Unequip an item
export const unequipItem = (user: User, itemType: ItemType): User => {
  // Create a copy of the user's equipment or initialize if it doesn't exist
  const equipment = user.equipment ? { ...user.equipment } : {};
  
  // Check if there is an item equipped in the slot
  if (!equipment[itemType]) {
    console.warn(`No item equipped in slot ${itemType}.`);
    return user;
  }
  
  const unequippedItem = equipment[itemType];
  
  // Add the unequipped item back to the inventory
  const updatedUserWithUnequippedItem = addItemToInventory(
    user,
    unequippedItem.name,
    unequippedItem.description,
    unequippedItem.type,
    1,
    unequippedItem.icon,
    unequippedItem.useEffect,
    unequippedItem.value,
    true,
    unequippedItem.equipmentStats
  );
  
  // Remove the unequipped item from the equipment
  delete equipment[itemType];
  
  // Update user with new equipment and inventory
  const updatedUser = { ...updatedUserWithUnequippedItem, equipment };
  
  // Update user armor
  updatedUser.armor = calculateArmor(updatedUser);
  
  updateUser(updatedUser);
  
  return updatedUser;
};

// Calculate armor based on equipped items
export const calculateArmor = (user: User): number => {
  let armor = 0;
  
  if (user.equipment) {
    Object.values(user.equipment).forEach(item => {
      if (item && item.equipmentStats && item.equipmentStats.armor) {
        armor += item.equipmentStats.armor;
      }
    });
  }
  
  return armor;
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
  const updatedUser = {
    ...user,
    activeQuests: [...user.activeQuests, quest]
  };
  
  updateUser(updatedUser);
  return updatedUser;
};

// Remove a quest from the user's active quests and add it to completed quests
export const completeQuest = (user: User, questId: string, awardToast: boolean = true): User => {
  // Find the quest in the activeQuests array
  const questToRemoveIndex = user.activeQuests.findIndex(quest => quest.id === questId);
  
  if (questToRemoveIndex === -1) {
    console.warn(`Quest with ID ${questId} not found in active quests.`);
    return user;
  }
  
  // Create a copy of the activeQuests array and remove the quest
  const updatedActiveQuests = [...user.activeQuests];
  const questToRemove = updatedActiveQuests.splice(questToRemoveIndex, 1)[0];
  
  // Create a copy of the completedQuests array and add the quest
  const updatedCompletedQuests = user.completedQuests ? [...user.completedQuests] : [];
  updatedCompletedQuests.push(questToRemove);
  
  // Update user stats
  let updatedUser = {
    ...user,
    activeQuests: updatedActiveQuests,
    completedQuests: updatedCompletedQuests,
    stats: {
      ...user.stats,
      questsCompleted: (user.stats?.questsCompleted || 0) + 1,
      questXpEarned: (user.stats?.questXpEarned || 0) + questToRemove.xpReward,
      questGoldEarned: (user.stats?.questGoldEarned || 0) + questToRemove.goldReward
    }
  };
  
  // Add quest rewards
  updatedUser = addExperience(updatedUser, questToRemove.xpReward, `Completed Quest: ${questToRemove.title}`);
  updatedUser.gold = (updatedUser.gold || 0) + questToRemove.goldReward;
  
  // Show toast for quest completion
  if (awardToast) {
    toast.success(`Quest Completed: ${questToRemove.title}`, {
      description: questToRemove.description
    });
  }
  
  updateUser(updatedUser);
  return updatedUser;
};

// Add a new achievement to the user's achievements
export const addAchievement = (user: User, achievement: Achievement): User => {
  const updatedUser = {
    ...user,
    achievements: [...user.achievements, achievement],
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
  return user.completedQuests.some(quest => quest.id === questId);
};

// Check if a user has unlocked a specific achievement
export const hasUnlockedAchievement = (user: User, achievementId: string): boolean => {
  return user.achievements.some(achievement => achievement.achievementId === achievementId);
};

// Generate daily quests for the user
export const generateDailyQuests = (user: User): User => {
  // Define possible daily quests
  const possibleQuests: Quest[] = [
    {
      id: "daily-quest-1",
      title: "Explore Local Areas",
      description: "Discover 3 new locations in your vicinity.",
      xpReward: 150,
      goldReward: 75,
      type: "daily",
      requiredLevel: 1,
      tasks: ["Discover 3 new locations"]
    },
    {
      id: "daily-quest-2",
      title: "Take a Morning Stroll",
      description: "Walk a distance of 2km before noon.",
      xpReward: 120,
      goldReward: 60,
      type: "daily",
      requiredLevel: 1,
      tasks: ["Walk 2km before noon"]
    },
    {
      id: "daily-quest-3",
      title: "Visit a Landmark",
      description: "Visit a historical landmark or monument.",
      xpReward: 180,
      goldReward: 90,
      type: "daily",
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
      title: "Explore Different Realms",
      description: "Discover locations in 3 different realms (countries).",
      xpReward: 500,
      goldReward: 250,
      type: "weekly",
      requiredLevel: 5,
      tasks: ["Discover locations in 3 different realms"]
    },
    {
      id: "weekly-quest-2",
      title: "Long Distance Journey",
      description: "Travel a total distance of 20km in a week.",
      xpReward: 400,
      goldReward: 200,
      type: "weekly",
      requiredLevel: 5,
      tasks: ["Travel 20km in a week"]
    },
    {
      id: "weekly-quest-3",
      title: "Visit Multiple Landmarks",
      description: "Visit 5 different historical landmarks or monuments.",
      xpReward: 600,
      goldReward: 300,
      type: "weekly",
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
  const possibleQuests: Quest[] = [
    {
      id: "monthly-quest-1",
      title: "Grand Explorer",
      description: "Discover 15 new locations this month.",
      xpReward: 1500,
      goldReward: 750,
      type: "monthly",
      requiredLevel: 10,
      tasks: ["Discover 15 new locations"]
    },
    {
      id: "monthly-quest-2",
      title: "Marathon Walker",
      description: "Walk a total distance of 100km this month.",
      xpReward: 1200,
      goldReward: 600,
      type: "monthly",
      requiredLevel: 10,
      tasks: ["Walk 100km this month"]
    },
    {
      id: "monthly-quest-3",
      title: "Historical Enthusiast",
      description: "Visit 20 different historical landmarks or monuments this month.",
      xpReward: 1800,
      goldReward: 900,
      type: "monthly",
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
  const verificationQuest: Quest = {
    id: "email-verification-quest",
    title: "Verify Your Email",
    description: "Verify your email address to unlock exclusive rewards.",
    xpReward: 250,
    goldReward: 100,
    type: "verification",
    requiredLevel: 1,
    tasks: ["Verify your email address"]
  };
  
  // Define verification achievement
  const verificationAchievement: Achievement = {
    achievementId: "email-verification",
    title: "Email Verified",
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
