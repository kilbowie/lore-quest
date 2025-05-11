import { User, ItemType, EquipmentStats, InventoryItem, EquippableItem, EquipmentSlot, AttackType, COMBAT_EFFECTIVENESS, COMBAT_CONSTANTS, PlayerClass, QUEST_TYPES, LEVEL_CONSTANTS, CLASS_DESCRIPTIONS, STAT_MULTIPLIERS, STARTER_QUEST_REWARDS } from '../types';
import { toast } from "@/components/ui/sonner";
import { updateUser } from './authUtils';

// Update the addItemToInventory function to support equippable items
export const addItemToInventory = (
  user: User,
  type: ItemType,
  name: string,
  description: string,
  quantity: number,
  icon?: string,
  useEffect?: 'health' | 'mana' | 'stamina' | 'revival' | 'none',
  value?: number,
  isEquippable?: boolean,
  equipmentStats?: EquipmentStats
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
    // Add new item, ensuring it matches the required type
    if (isEquippable && equipmentStats) {
      // Create an EquippableItem with explicit type casting to ensure isEquippable is always true
      const equippableItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        name,
        description,
        quantity,
        icon,
        useEffect,
        value,
        isEquippable: true as const, // Use const assertion to make TypeScript treat this as literal 'true'
        equipmentStats
      } as EquippableItem;
      
      item = equippableItem;
    } else {
      // Create a regular InventoryItem
      item = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        name,
        description,
        quantity,
        icon,
        useEffect,
        value,
        isEquippable,
        equipmentStats
      };
    }
    user.inventory.push(item);
  }
  
  return item;
};

// Add the equip item function
export const equipItem = (user: User, itemId: string): User => {
  const updatedUser = { ...user };
  
  // Find the item in inventory
  const itemIndex = updatedUser.inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    toast.error('Item not found in inventory');
    return updatedUser;
  }
  
  const item = updatedUser.inventory[itemIndex];
  
  // Check if item is equippable
  if (!item.isEquippable || !item.equipmentStats) {
    toast.error('This item cannot be equipped');
    return updatedUser;
  }
  
  // Check if player meets class requirements
  const requiredClass = item.equipmentStats.requiredClass;
  if (requiredClass && requiredClass !== 'any' && requiredClass !== updatedUser.playerClass) {
    toast.error(`Only ${requiredClass}s can equip this item`);
    return updatedUser;
  }
  
  // Check if player meets level requirements
  const requiredLevel = item.equipmentStats.requiredLevel || 1;
  if (updatedUser.level < requiredLevel) {
    toast.error(`You need to be level ${requiredLevel} to equip this item`);
    return updatedUser;
  }
  
  // Initialize equipment if not exists
  if (!updatedUser.equipment) {
    updatedUser.equipment = {};
  }
  
  // Get the slot the item goes in
  const slot = item.equipmentStats.slot;
  
  // Check if secondary weapon is unlocked
  if (slot === 'secondaryWeapon' && updatedUser.level < 5) {
    toast.error('Secondary weapon slot unlocks at level 5');
    return updatedUser;
  }
  
  // If an item is already equipped in this slot, unequip it first
  if (updatedUser.equipment[slot]) {
    // Put the currently equipped item back in inventory
    const equippedItem = updatedUser.equipment[slot];
    if (equippedItem) {
      // Add the item back to inventory
      const existingItemIndex = updatedUser.inventory.findIndex(
        invItem => invItem.id === equippedItem.id
      );
      
      if (existingItemIndex >= 0) {
        updatedUser.inventory[existingItemIndex].quantity += 1;
      } else {
        updatedUser.inventory.push({ ...equippedItem, quantity: 1 });
      }
    }
  }
  
  // Equip the new item
  updatedUser.equipment[slot] = { ...item, quantity: 1 };
  
  // Reduce quantity in inventory
  updatedUser.inventory[itemIndex].quantity -= 1;
  
  // Remove the item from inventory if quantity is 0
  if (updatedUser.inventory[itemIndex].quantity <= 0) {
    updatedUser.inventory = updatedUser.inventory.filter(i => i.id !== itemId);
  }
  
  // Recalculate player stats based on equipment
  recalculateEquipmentStats(updatedUser);
  
  toast.success(`Equipped ${item.name}`);
  
  return updatedUser;
};

// Function to unequip an item
export const unequipItem = (user: User, slot: EquipmentSlot): User => {
  const updatedUser = { ...user };
  
  // Check if there's an item in this slot
  if (!updatedUser.equipment || !updatedUser.equipment[slot]) {
    toast.error('No item equipped in this slot');
    return updatedUser;
  }
  
  // Get the equipped item
  const equippedItem = updatedUser.equipment[slot];
  
  // Add it back to inventory
  const existingItemIndex = updatedUser.inventory.findIndex(
    item => item.id === equippedItem!.id
  );
  
  if (existingItemIndex >= 0) {
    updatedUser.inventory[existingItemIndex].quantity += 1;
  } else {
    updatedUser.inventory.push({ ...equippedItem!, quantity: 1 });
  }
  
  // Remove from equipment
  updatedUser.equipment[slot] = undefined;
  
  // Recalculate player stats
  recalculateEquipmentStats(updatedUser);
  
  toast.success(`Unequipped ${equippedItem!.name}`);
  
  return updatedUser;
};

// Function to recalculate player stats based on equipment
export const recalculateEquipmentStats = (user: User): User => {
  const updatedUser = { ...user };
  
  // Initialize equipment if not exists
  if (!updatedUser.equipment) {
    updatedUser.equipment = {};
  }
  
  // Reset armor value
  updatedUser.armor = 0;
  
  // Get all equipped items
  const equippedItems = Object.values(updatedUser.equipment).filter(item => item) as EquippableItem[];
  
  // Calculate stat bonuses from all equipped items
  equippedItems.forEach(item => {
    if (item.equipmentStats) {
      // Add armor from item
      if (item.equipmentStats.armor) {
        updatedUser.armor += item.equipmentStats.armor;
      }
      
      // Apply stat bonuses
      if (item.equipmentStats.statBonuses) {
        item.equipmentStats.statBonuses.forEach(bonus => {
          switch (bonus.attribute) {
            case 'strength':
              updatedUser.stats.strength += bonus.value;
              break;
            case 'intelligence':
              updatedUser.stats.intelligence += bonus.value;
              break;
            case 'dexterity':
              updatedUser.stats.dexterity += bonus.value;
              break;
          }
        });
      }
    }
  });
  
  // Recalculate base stats
  return recalculatePlayerStats(updatedUser);
};

// Add combat calculation functions
export const calculateDamage = (
  attackerUser: User,
  defenderUser: User,
  attackType: AttackType
): { damage: number; isCritical: boolean; isWeak: boolean } => {
  // Get attacker's relevant stat based on attack type
  let attackerStat = 0;
  
  if (attackType === 'Melee') {
    attackerStat = attackerUser.stats.strength;
  } else if (attackType === 'Magic') {
    attackerStat = attackerUser.stats.intelligence;
  } else if (attackType === 'Ranged') {
    attackerStat = attackerUser.stats.dexterity;
  }
  
  // Determine defender's primary attack type based on class
  let defenderAttackType: AttackType = 'Melee';
  if (defenderUser.playerClass === 'Wizard') {
    defenderAttackType = 'Magic';
  } else if (defenderUser.playerClass === 'Ranger') {
    defenderAttackType = 'Ranged';
  }
  
  // Get combat effectiveness to determine multipliers
  const effectiveness = COMBAT_EFFECTIVENESS[attackType];
  
  // Determine if this is a critical or weak attack
  const isCritical = effectiveness.criticalAgainst === defenderAttackType;
  const isWeak = effectiveness.weakAgainst === defenderAttackType;
  
  // Calculate base damage
  let damage = attackerStat * 2; // Base damage formula
  
  // Apply critical or weak multipliers
  if (isCritical) {
    damage *= COMBAT_CONSTANTS.CRITICAL_MULTIPLIER;
  } else if (isWeak) {
    damage *= COMBAT_CONSTANTS.WEAK_MULTIPLIER;
  }
  
  // Apply defender's armor reduction (only for non-critical hits)
  if (!isCritical && defenderUser.armor > 0) {
    // Armor reduces damage by a percentage
    const damageReduction = Math.min(0.75, defenderUser.armor / 100); // Max 75% reduction
    damage *= (1 - damageReduction);
  }
  
  // Ensure damage is at least 1
  damage = Math.max(1, Math.floor(damage));
  
  return { damage, isCritical, isWeak };
};

// Function to initialize user stats
export const initializeUserStats = (user: User): User => {
  if (!user.stats) {
    user.stats = {
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
  
  return recalculatePlayerStats(user);
};

// Function to recalculate player stats
export const recalculatePlayerStats = (user: User): User => {
  const updatedUser = { ...user };
  
  // Initialize stats if they don't exist
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
  
  // Calculate max health based on strength
  updatedUser.maxHealth = updatedUser.stats.strength * STAT_MULTIPLIERS.HEALTH_PER_STRENGTH;
  
  // Calculate max mana based on intelligence
  updatedUser.maxMana = updatedUser.stats.intelligence * STAT_MULTIPLIERS.MANA_PER_INTELLIGENCE;
  
  // Calculate max stamina based on dexterity
  updatedUser.maxStamina = updatedUser.stats.dexterity * STAT_MULTIPLIERS.STAMINA_PER_DEXTERITY;
  
  return updatedUser;
};

// Function to handle level up and add stat point to primary attribute
export const handleLevelUp = (user: User, oldLevel: number): User => {
  const updatedUser = { ...user };
  
  // If level increased, add stat points to primary attribute
  if (updatedUser.level > oldLevel) {
    if (updatedUser.playerClass) {
      const primaryAttribute = CLASS_DESCRIPTIONS[updatedUser.playerClass].primaryAttribute;
      
      // Add stat point to primary attribute
      updatedUser.stats[primaryAttribute] += (updatedUser.level - oldLevel);
      
      // Add XP runes to inventory (one per level gained)
      for (let i = oldLevel + 1; i <= updatedUser.level; i++) {
        addItemToInventory(
          updatedUser,
          'rune',
          `Level ${i} XP Rune`,
          `A mystical rune that can be used to increase any stat by 1 point.`,
          1,
          '✨'
        );
      }
      
      // Recalculate player stats with new attributes
      recalculatePlayerStats(updatedUser);
    }
  }
  
  return updatedUser;
};

// Function to handle completing the starter quest - implement STARTER_QUEST_REWARDS
export const completeStarterQuest = (user: User, playerClass: PlayerClass): User => {
  const updatedUser = { ...user };
  
  // Get the armor set for the player's class
  const armorSet = STARTER_QUEST_REWARDS[playerClass].armorSet;
  
  // Add each armor piece to inventory
  // Head
  addItemToInventory(
    updatedUser,
    'armor',
    armorSet.head.name!,
    armorSet.head.description!,
    1,
    '🪖',
    'none',
    0,
    true,
    armorSet.head.equipmentStats
  );
  
  // Body
  addItemToInventory(
    updatedUser,
    'armor',
    armorSet.body.name!,
    armorSet.body.description!,
    1,
    '👕',
    'none',
    0,
    true,
    armorSet.body.equipmentStats
  );
  
  // Legs
  addItemToInventory(
    updatedUser,
    'armor',
    armorSet.legs.name!,
    armorSet.legs.description!,
    1,
    '👖',
    'none',
    0,
    true,
    armorSet.legs.equipmentStats
  );
  
  // Hands
  addItemToInventory(
    updatedUser,
    'armor',
    armorSet.hands.name!,
    armorSet.hands.description!,
    1,
    '🧤',
    'none',
    0,
    true,
    armorSet.hands.equipmentStats
  );
  
  // Feet
  addItemToInventory(
    updatedUser,
    'armor',
    armorSet.feet.name!,
    armorSet.feet.description!,
    1,
    '👢',
    'none',
    0,
    true,
    armorSet.feet.equipmentStats
  );
  
  toast.success(`Obtained ${playerClass} Starter Armor Set!`, {
    description: "Check your inventory to equip your new armor."
  });
  
  return updatedUser;
};

// Modified checkQuestProgress function to handle starter quest
export const checkQuestProgress = (user: User, activityType: 'walk' | 'discover' | 'other', amount: number): User => {
  let updatedUser = { ...user };
  const userId = updatedUser.id;
  const QUESTS_STORAGE_KEY = `lorequest_quests_${userId}`;
  
  try {
    const storedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);
    if (!storedQuests) return updatedUser;
    
    const questsData = JSON.parse(storedQuests);
    let questsUpdated = false;
    
    // Check for matching quests and update progress
    const updateQuestProgress = (quest: any) => {
      if (quest.completed) return quest;
      
      // Matching activity type for walking quests
      if (activityType === 'walk' && (
        quest.type === 'daily' || 
        quest.type === 'weekly' || 
        quest.type === 'monthly' ||
        quest.type === 'tutorial'
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
              updatedUser = initializeUserStats(updatedUser);
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
              updatedUser = initializeUserStats(updatedUser);
            }
            
            updatedUser.stats.totalGoldEarned += quest.goldReward;
            updatedUser.stats.questGoldEarned += quest.goldReward;
            
            toast.success(`Quest Complete: ${quest.name}`, {
              description: `Earned ${quest.goldReward} Gold!`
            });
          }
          
          // Add item reward if available
          if (quest.itemReward) {
            // Check if this is the starter quest
            if (quest.id === 'starter-walking-quest' && updatedUser.playerClass) {
              // Complete starter quest with armor set reward
              updatedUser = completeStarterQuest(updatedUser, updatedUser.playerClass);
            } else {
              // Cast the type to the correct union type
              const reward = { 
                type: quest.itemReward.type as "potion" | "elixir" | "other" | "weapon" | "armor",
                name: quest.itemReward.name, 
                quantity: quest.itemReward.quantity 
              };
              
              // Make sure to pass the correctly typed value
              addItemToInventory(
                updatedUser,
                reward.type as ItemType,
                reward.name,
                `Reward from ${quest.name} quest`,
                reward.quantity
              );
              
              toast.success(`Quest Complete: ${quest.name}`, {
                description: `Earned ${reward.quantity} ${reward.name}!`
              });
            }
          }
          
          // Update quest completion stats
          if (!updatedUser.stats) {
            updatedUser = initializeUserStats(updatedUser);
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
    
    // Check custom quests (including starter quest)
    if (questsData.custom) {
      questsData.custom = questsData.custom.map(updateQuestProgress);
    }
    
    // Save updated quests if there were changes
    if (questsUpdated) {
      localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(questsData));
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating quest progress:', error);
    return updatedUser;
  }
};

// Update addExperience function to handle automatic stat increases on level up
export const addExperience = (user: User, xpAmount: number, source?: string): User => {
  let updatedUser = { ...user };
  const oldLevel = updatedUser.level;
  
  // Add XP
  updatedUser.experience += xpAmount;
  
  // Update stats
  if (!updatedUser.stats) {
    updatedUser = initializeUserStats(updatedUser);
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
    
    // Handle automatic stat increases on level up
    updatedUser = handleLevelUp(updatedUser, oldLevel);
  }
  
  // Show level up notification
  if (updatedUser.level > oldLevel) {
    toast.success(`Level Up! You are now level ${updatedUser.level}`, {
      description: `You've gained a new rune in your inventory${updatedUser.playerClass ? ` and +1 to your ${CLASS_DESCRIPTIONS[updatedUser.playerClass].primaryAttribute} stat!` : '!'}`
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

// Calculate XP required for level
export const calculateXpForLevel = (level: number): number => {
  return Math.floor(LEVEL_CONSTANTS.BASE_XP * Math.pow(LEVEL_CONSTANTS.SCALING_FACTOR, level - 1));
};

// Calculate level progress percentage
export const calculateLevelProgress = (user: User): number => {
  if (user.level >= LEVEL_CONSTANTS.MAX_LEVEL) return 100;
  
  const currentLevelXp = calculateXpForLevel(user.level);
  const nextLevelXp = calculateXpForLevel(user.level + 1);
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const progress = (user.experience - currentLevelXp) / xpForNextLevel;
  
  return Math.min(100, Math.max(0, Math.round(progress * 100)));
};

// Calculate XP to next level
export const xpToNextLevel = (user: User): number => {
  if (user.level >= LEVEL_CONSTANTS.MAX_LEVEL) return 0;
  
  const nextLevelXp = calculateXpForLevel(user.level + 1);
  return Math.max(0, nextLevelXp - user.experience);
};

// Add verification quest to user
export const addVerificationQuest = (user: User): User => {
  const updatedUser = { ...user };
  
  // Check if user already has this achievement
  if (!updatedUser.achievements.some(a => a.achievementId === 'email-verification')) {
    // Add verification achievement
    const verificationAchievement = {
      achievementId: 'email-verification',
      completed: false,
      progress: 0,
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

// Fix the walking distance function to prevent reassignment of const
export const addWalkingDistance = (user: User, distanceKm: number): User => {
  let updatedUser = { ...user };
  
  // Initialize stats if they don't exist
  if (!updatedUser.stats) {
    updatedUser = initializeUserStats(updatedUser);
  }
  
  // Update distance travelled
  updatedUser.stats.distanceTravelled += distanceKm;
  
  // Check if we should update quests progress
  updatedUser = checkQuestProgress(updatedUser, 'walk', distanceKm);
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Add completion for verification quest
export const completeVerificationQuest = (user: User): User => {
  // Find the verification achievement
  const achievement = user.achievements.find(a => a.achievementId === 'email-verification');
  
  if (achievement && !achievement.completed) {
    // Mark as completed
    achievement.completed = true;
    achievement.progress = 1;
    achievement.completedAt = new Date();
    
    // Add XP (100 XP for verification)
    user.experience += 100;
    
    // Add gold (50 gold for verification)
    user.gold = (user.gold || 0) + 50;
    
    // Update stats if they exist
    if (user.stats) {
      user.stats.totalXpEarned += 100;
      user.stats.questXpEarned += 100;
      user.stats.totalGoldEarned += 50;
      user.stats.questGoldEarned += 50;
      user.stats.questsCompleted += 1;
    }
    
    toast.success('Email Verified!', {
      description: 'You earned 100 XP and 50 gold.'
    });
  }
  
  return user;
};

// Get walking data
export const getUserWalkingData = (userId: string): { totalDistanceKm: number; earnedXP: number } => {
  try {
    const key = `lorequest_walking_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const data = JSON.parse(stored);
      return {
        totalDistanceKm: data.totalDistanceKm || 0,
        earnedXP: data.earnedXP || 0
      };
    }
  } catch (error) {
    console.error('Error getting walking data:', error);
  }
  
  return { totalDistanceKm: 0, earnedXP: 0 };
};

// Update user stats
export const updateUserStats = (user: User, statsUpdate: Partial<User['stats']>): User => {
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
  
  // Update each stat that was provided
  Object.entries(statsUpdate).forEach(([key, value]) => {
    if (value !== undefined && key in updatedUser.stats) {
      (updatedUser.stats as any)[key] = value;
    }
  });
  
  return updatedUser;
};

// Function to generate time-based quests (daily, weekly, monthly)
export const generateTimeBasedQuests = (user: User): User => {
  // Implementation to be added
  return user;
};

// Get time-based quests
export const getTimeBasedQuests = (userId: string) => {
  // Implementation to be added
  return { daily: [], weekly: [], monthly: [] };
};

// Function for health/mana/stamina regeneration checks
export const checkRegeneration = (user: User): User => {
  // Implementation to be added
  return user;
};

// Function to spend gold
export const spendGold = (user: User, amount: number, reason?: string): User => {
  const updatedUser = { ...user };
  
  if (updatedUser.gold < amount) {
    toast.error('Not enough gold!');
    return updatedUser;
  }
  
  updatedUser.gold -= amount;
  
  if (reason) {
    toast.success(`Spent ${amount} gold`, {
      description: reason
    });
  }
  
  return updatedUser;
};

// Function to upgrade stat with rune
export const upgradeStatWithRune = (user: User, stat: 'strength' | 'intelligence' | 'dexterity', runeId: string): User => {
  // Implementation to be added
  return user;
};

// Function to track achievement
export const trackAchievement = (user: User, achievementId: string): User => {
  // Implementation to be added
  return user;
};

// Function to untrack achievement
export const untrackAchievement = (user: User, achievementId: string): User => {
  // Implementation to be added
  return user;
};
