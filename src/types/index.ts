export interface Location {
  id: string;
  name: string;           // City name (Territory)
  latitude: number;
  longitude: number;
  radius: number;         // in miles
  discovered: boolean;
  realm: string;          // Country in UK (England, Scotland, Wales, Northern Ireland) or Ireland
  continent?: string;     // Continent (UK or Ireland)
  territory: string;      // City/town name
  description?: string;   // Optional description of the location
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ExplorationStats {
  totalLocations: number;
  discoveredLocations: number;
  percentExplored: number;
  // New fields for tracking continents and realms
  totalContinents: number;
  discoveredContinents: number;
  totalRealms: number;
  discoveredRealms: number;
}

// User account types
export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  profilePicture?: string;
  level: number;
  experience: number;
  gold: number; 
  inventory: InventoryItem[];
  discoveredLocations: string[]; // IDs of discovered locations
  achievements: UserAchievement[];
  activeQuests: string[]; // IDs of quests being tracked
  completedQuests: string[]; // IDs of completed quests
  emailVerified?: boolean;
  tutorialCompleted?: boolean;
  createdAt: Date;
  stats: UserStats; // Added player stats
  playerClass?: PlayerClass; // Added player class
  health: number; // Current health points
  maxHealth: number; // Maximum health points
  mana: number; // Current mana points
  maxMana: number; // Maximum mana points
  stamina: number; // Current stamina points
  maxStamina: number; // Maximum stamina points
  energy: number; // Current energy points
  maxEnergy: number; // Maximum energy points
  lastEnergyRegenTime: Date; // Last time energy was regenerated
  isDead: boolean; // Is player dead
  lastRegenCheck?: string; // Last time health/mana/stamina regenerated
  lastRegenerationTime: Date; // Last regeneration time
  trackedAchievements: string[]; // IDs of achievements being tracked
  // New equipment slots
  equipment: Equipment;
  // New armor stat
  armor: number;
  // Combat state
  inCombat?: boolean;
  defending?: boolean;
  // Added properties for quests
  quests: Quest[];
  dailyQuests: DailyQuest[];
  lastDailyQuestReset?: string;
}

// Equipment slots
export interface Equipment {
  mainWeapon?: EquippableItem;
  secondaryWeapon?: EquippableItem;
  head?: EquippableItem;
  chest?: EquippableItem;
  legs?: EquippableItem;
  hands?: EquippableItem;
  feet?: EquippableItem;
  neck?: EquippableItem;
  ring?: EquippableItem;
  mainHand?: EquippableItem;
  offHand?: EquippableItem;
  body?: EquippableItem;
}

// Player statistics
export interface UserStats {
  strength: number;
  intelligence: number;
  dexterity: number;
  distanceTravelled: number;
  locationsDiscovered: number;
  totalXpEarned: number;
  questXpEarned: number;
  walkingXpEarned: number;
  totalGoldEarned: number;
  questGoldEarned: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  dailyQuestsCompleted: number;
  weeklyQuestsCompleted: number;
  monthlyQuestsCompleted: number;
}

// Player classes
export type PlayerClass = 'Knight' | 'Wizard' | 'Ranger';

// Attack types
export type AttackType = 'Melee' | 'Magic' | 'Ranged';

// Item types extended
export type ItemType = 'rune' | 'map' | 'compass' | 'weapon' | 'potion' | 'elixir' | 'other' | 'gold' | 'armor' | 'energy';

// Equipment slots type - updated to include all slots
export type EquipmentSlot = 'head' | 'chest' | 'legs' | 'feet' | 'hands' | 'neck' | 'ring' | 'mainHand' | 'offHand' | 'body' | 'mainWeapon' | 'secondaryWeapon';

// Class descriptions and base stats
export const CLASS_DESCRIPTIONS: Record<PlayerClass, { 
  description: string; 
  baseStats: { strength: number; intelligence: number; dexterity: number };
  primaryAttribute: 'strength' | 'intelligence' | 'dexterity';
  attackType: AttackType;
  initialWeapon: {
    name: string;
    attackType: AttackType;
    statBonus: { attribute: string; value: number };
  };
}> = {
  Knight: {
    description: 'A stalwart defender with high health. Specializes in physical combat.',
    baseStats: { strength: 5, intelligence: 2, dexterity: 3 },
    primaryAttribute: 'strength',
    attackType: 'Melee',
    initialWeapon: {
      name: 'Rusty Sword',
      attackType: 'Melee',
      statBonus: { attribute: 'strength', value: 1 }
    }
  },
  Wizard: {
    description: 'A master of arcane arts with high mana. Specializes in magical abilities.',
    baseStats: { strength: 2, intelligence: 5, dexterity: 3 },
    primaryAttribute: 'intelligence',
    attackType: 'Magic',
    initialWeapon: {
      name: 'Walking Staff',
      attackType: 'Magic',
      statBonus: { attribute: 'intelligence', value: 1 }
    }
  },
  Ranger: {
    description: 'A nimble explorer with high stamina. Specializes in ranged combat and mobility.',
    baseStats: { strength: 3, intelligence: 2, dexterity: 5 },
    primaryAttribute: 'dexterity',
    attackType: 'Ranged',
    initialWeapon: {
      name: 'Training Bow',
      attackType: 'Ranged',
      statBonus: { attribute: 'dexterity', value: 1 }
    }
  }
};

// Combat effectiveness relationships
export const COMBAT_EFFECTIVENESS: Record<AttackType, { 
  criticalAgainst: AttackType;
  weakAgainst: AttackType;
  damageAttribute: 'strength' | 'intelligence' | 'dexterity';
}> = {
  Melee: {
    criticalAgainst: 'Magic',
    weakAgainst: 'Ranged',
    damageAttribute: 'strength'
  },
  Magic: {
    criticalAgainst: 'Ranged',
    weakAgainst: 'Melee',
    damageAttribute: 'intelligence'
  },
  Ranged: {
    criticalAgainst: 'Melee',
    weakAgainst: 'Magic',
    damageAttribute: 'dexterity'
  }
};

// Stats multipliers
export const STAT_MULTIPLIERS = {
  HEALTH_PER_STRENGTH: 10,
  MANA_PER_INTELLIGENCE: 10,
  STAMINA_PER_DEXTERITY: 10
};

// Regeneration constants
export const REGENERATION_CONSTANTS = {
  FULL_REGEN_TIME_MS: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
  CHECK_INTERVAL_MS: 60 * 1000, // Check every minute
  ENERGY_REGEN_TIME_MS: 2 * 60 * 60 * 1000 // 2 hours for energy
};

// Combat constants
export const COMBAT_CONSTANTS = {
  CRITICAL_MULTIPLIER: 1.5,
  WEAK_MULTIPLIER: 0.75
};

// Extended InventoryItem to include equippable items
export interface InventoryItem {
  id: string;
  type: ItemType;
  name: string;
  description?: string;
  quantity: number;
  icon?: string;
  useEffect?: 'health' | 'mana' | 'stamina' | 'revival' | 'energy' | 'none';
  value?: number; // How much it heals/restores or costs in gold
  isEquippable?: boolean;
  equipmentStats?: EquipmentStats;
}

// Equipment stats - updated to include damage
export interface EquipmentStats {
  slot: EquipmentSlot;
  attackType?: AttackType;
  statBonuses?: { attribute: string; value: number }[];
  armor?: number;
  damage?: number; // Added damage property
  requiredClass?: PlayerClass | 'any';
  requiredLevel?: number;
}

// Equippable Item
export interface EquippableItem extends InventoryItem {
  isEquippable: true;
  equipmentStats: EquipmentStats;
}

export interface Achievement {
  id: string;
  type?: 'territory' | 'realm' | 'continent' | 'meta' | 'tutorial' | 'verification';
  name: string;
  description: string;
  targetId?: string; // ID of the location, realm or continent
  targetCount?: number; // For meta achievements (e.g. discover all territories in a realm)
  xpReward: number;
  goldReward?: number; // Gold reward for completing the achievement
  icon?: string;
}

export interface UserAchievement {
  achievementId: string;
  completed: boolean;
  progress: number;
  completedAt?: Date;
  isTracked: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requirement?: {
    type: 'walk' | 'discover' | 'class' | 'none';
    value: number | string;
  };
}

// Define QuestType separately to fix reference errors
export type QuestType = 'daily' | 'weekly' | 'monthly' | 'tutorial' | 'verification' | 'discovery' | 'collection' | 'exploration';

export interface Quest {
  id: string;
  title: string; // Added title property
  name: string;
  description: string;
  type: QuestType;
  targetId?: string;
  targetCount?: number;
  xpReward: number;
  goldReward?: number;
  itemReward?: {
    type: 'potion' | 'elixir' | 'other' | 'weapon' | 'armor';
    name: string;
    quantity: number;
    equipmentStats?: EquipmentStats;
  };
  completed?: boolean;
  progress?: number;
  expiresAt?: Date;
  requiredLevel?: number;
  tasks?: string[];
  completedDate?: string;
}

// Added DailyQuest interface
export interface DailyQuest extends Quest {
  type: 'daily';
  expiresAt: Date;
}

// Constants for leveling system
export const LEVEL_CONSTANTS = {
  BASE_XP: 100,
  SCALING_FACTOR: 1.5,
  MAX_LEVEL: 100
};

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// New interfaces for tutorial quest
export interface TutorialQuest {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  xpReward: number;
  goldReward?: number;
  itemReward?: InventoryItem;
}

// Walking data
export interface WalkingData {
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

// Store item definition
export interface StoreItem {
  id: string;
  name: string;
  type: 'potion' | 'elixir' | 'other' | 'energy';
  description: string;
  goldCost: number;
  useEffect: 'health' | 'mana' | 'stamina' | 'revival' | 'energy' | 'none';
  value: number; // How much it heals/restores
  icon?: string;
  maxPurchase?: number; // Maximum quantity a player can purchase at once
}

// Available store items
export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    type: 'potion',
    description: 'Restores 50 health points.',
    goldCost: 10,
    useEffect: 'health',
    value: 50,
    icon: '❤️'
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    type: 'potion',
    description: 'Restores 50 mana points.',
    goldCost: 10,
    useEffect: 'mana',
    value: 50,
    icon: '🔵'
  },
  {
    id: 'stamina_potion',
    name: 'Stamina Potion',
    type: 'potion',
    description: 'Restores 50 stamina points.',
    goldCost: 10,
    useEffect: 'stamina',
    value: 50,
    icon: '🟢'
  },
  {
    id: 'revival_elixir',
    name: 'Revival Elixir',
    type: 'elixir',
    description: 'Brings you back to life if you die. Used automatically.',
    goldCost: 50,
    useEffect: 'revival',
    value: 0,
    icon: '✨'
  },
  {
    id: 'energy_potion',
    name: 'Energy Potion',
    type: 'energy',
    description: 'Recovers 1 energy point.',
    goldCost: 15,
    useEffect: 'energy',
    value: 1,
    icon: '⚡'
  },
  {
    id: 'ultra_energy_potion',
    name: 'Ultra Energy Potion',
    type: 'energy',
    description: 'Recovers 3 energy points.',
    goldCost: 40,
    useEffect: 'energy',
    value: 3,
    icon: '⚡⚡⚡'
  }
];

// Quest schedule types
export interface QuestSchedule {
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
}

// Starter quest for each class
export const STARTER_QUEST_REWARDS: Record<PlayerClass, {
  armorSet: {
    head: Partial<EquippableItem>;
    body: Partial<EquippableItem>;
    legs: Partial<EquippableItem>;
    hands: Partial<EquippableItem>;
    feet: Partial<EquippableItem>;
  }
}> = {
  Knight: {
    armorSet: {
      head: {
        name: "Rusty Bronze Helm",
        type: "armor",
        description: "A basic bronze helmet showing signs of wear.",
        equipmentStats: {
          slot: "head",
          armor: 1,
          requiredClass: "Knight",
          requiredLevel: 1
        }
      },
      body: {
        name: "Rusty Bronze Armor",
        type: "armor",
        description: "A basic bronze chest piece showing signs of wear.",
        equipmentStats: {
          slot: "body",
          armor: 1,
          requiredClass: "Knight",
          requiredLevel: 1
        }
      },
      legs: {
        name: "Rusty Bronze Greaves",
        type: "armor",
        description: "Basic bronze leg armor showing signs of wear.",
        equipmentStats: {
          slot: "legs",
          armor: 1,
          requiredClass: "Knight",
          requiredLevel: 1
        }
      },
      hands: {
        name: "Rusty Bronze Gloves",
        type: "armor",
        description: "Basic bronze gauntlets showing signs of wear.",
        equipmentStats: {
          slot: "hands",
          armor: 1,
          requiredClass: "Knight",
          requiredLevel: 1
        }
      },
      feet: {
        name: "Rusty Bronze Boots",
        type: "armor",
        description: "Basic bronze boots showing signs of wear.",
        equipmentStats: {
          slot: "feet",
          armor: 1,
          requiredClass: "Knight",
          requiredLevel: 1
        }
      }
    }
  },
  Wizard: {
    armorSet: {
      head: {
        name: "Torn Cloth Hat",
        type: "armor",
        description: "A simple cloth hat with some tears.",
        equipmentStats: {
          slot: "head",
          armor: 1,
          requiredClass: "Wizard",
          requiredLevel: 1
        }
      },
      body: {
        name: "Torn Cloth Tunic",
        type: "armor",
        description: "A simple cloth tunic with some tears.",
        equipmentStats: {
          slot: "body",
          armor: 1,
          requiredClass: "Wizard",
          requiredLevel: 1
        }
      },
      legs: {
        name: "Torn Cloth Trousers",
        type: "armor",
        description: "Simple cloth trousers with some tears.",
        equipmentStats: {
          slot: "legs",
          armor: 1,
          requiredClass: "Wizard",
          requiredLevel: 1
        }
      },
      hands: {
        name: "Torn Cloth Gloves",
        type: "armor",
        description: "Simple cloth gloves with some tears.",
        equipmentStats: {
          slot: "hands",
          armor: 1,
          requiredClass: "Wizard",
          requiredLevel: 1
        }
      },
      feet: {
        name: "Torn Cloth Boots",
        type: "armor",
        description: "Simple cloth boots with some tears.",
        equipmentStats: {
          slot: "feet",
          armor: 1,
          requiredClass: "Wizard",
          requiredLevel: 1
        }
      }
    }
  },
  Ranger: {
    armorSet: {
      head: {
        name: "Worn Leather Cap",
        type: "armor",
        description: "A basic leather cap showing signs of wear.",
        equipmentStats: {
          slot: "head",
          armor: 1,
          requiredClass: "Ranger",
          requiredLevel: 1
        }
      },
      body: {
        name: "Worn Leather Armor",
        type: "armor",
        description: "Basic leather armor showing signs of wear.",
        equipmentStats: {
          slot: "body",
          armor: 1,
          requiredClass: "Ranger",
          requiredLevel: 1
        }
      },
      legs: {
        name: "Worn Leather Chausse",
        type: "armor",
        description: "Basic leather leg protection showing signs of wear.",
        equipmentStats: {
          slot: "legs",
          armor: 1,
          requiredClass: "Ranger",
          requiredLevel: 1
        }
      },
      hands: {
        name: "Worn Leather Gloves",
        type: "armor",
        description: "Basic leather gloves showing signs of wear.",
        equipmentStats: {
          slot: "hands",
          armor: 1,
          requiredClass: "Ranger",
          requiredLevel: 1
        }
      },
      feet: {
        name: "Worn Leather Boots",
        type: "armor",
        description: "Basic leather boots showing signs of wear.",
        equipmentStats: {
          slot: "feet",
          armor: 1,
          requiredClass: "Ranger",
          requiredLevel: 1
        }
      }
    }
  }
};

// Default quest generation
export const QUEST_TYPES = {
  DAILY: {
    WALKING_DISTANCE: {
      type: 'daily',
      name: 'Daily Walk',
      description: 'Walk 1 km today.',
      targetCount: 1,
      xpReward: 25,
      goldReward: 5
    }
  },
  WEEKLY: {
    WALKING_DISTANCE: {
      type: 'weekly',
      name: 'Weekly Explorer',
      description: 'Walk 5 km this week.',
      targetCount: 5,
      xpReward: 100,
      goldReward: 25
    }
  },
  MONTHLY: {
    WALKING_DISTANCE: {
      type: 'monthly',
      name: 'Monthly Voyager',
      description: 'Walk 20 km this month.',
      targetCount: 20,
      xpReward: 500,
      goldReward: 100,
      itemReward: {
        type: 'elixir',
        name: 'Revival Elixir',
        quantity: 1
      }
    }
  },
  STARTER: {
    WALKING_DISTANCE: {
      type: 'tutorial',
      name: 'First Steps',
      description: 'Walk 1 km to complete your basic training.',
      targetCount: 1,
      xpReward: 100,
      goldReward: 50
    }
  }
};

// Enemy types
export interface Enemy {
  id: string;
  name: string;
  type: 'melee' | 'ranged' | 'magic';
  level: number;
  health: number;
  maxHealth: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  armor: number;
  xpReward: number;
  goldReward: number;
  icon: string;
  attackType: AttackType;
  description?: string;
}

// Base enemy templates
export const BASE_ENEMIES = [
  {
    id: 'goblin_clubber',
    name: 'Goblin Clubber',
    type: 'melee' as const,
    baseHealth: 20,
    baseStrength: 3,
    baseIntelligence: 1,
    baseDexterity: 2,
    baseArmor: 1,
    baseXp: 10,
    baseGold: 5,
    icon: '👺🔨',
    attackType: 'Melee' as AttackType,
    description: 'A small goblin wielding a crude wooden club.',
  },
  {
    id: 'goblin_archer',
    name: 'Goblin Archer',
    type: 'ranged' as const,
    baseHealth: 15,
    baseStrength: 1,
    baseIntelligence: 2,
    baseDexterity: 4,
    baseArmor: 0,
    baseXp: 12,
    baseGold: 6,
    icon: '👺🏹',
    attackType: 'Ranged' as AttackType,
    description: 'A nimble goblin with a short bow and quiver of arrows.',
  },
  {
    id: 'goblin_acolyte',
    name: 'Goblin Acolyte',
    type: 'magic' as const,
    baseHealth: 12,
    baseStrength: 1,
    baseIntelligence: 4,
    baseDexterity: 2,
    baseArmor: 0,
    baseXp: 15,
    baseGold: 8,
    icon: '👺✨',
    attackType: 'Magic' as AttackType,
    description: 'A goblin wearing tattered robes and wielding a crude wand.',
  },
];

// Combat log entry type
export interface CombatLogEntry {
  message: string;
  timestamp: Date;
  type: 'player-action' | 'enemy-action' | 'system' | 'reward' | 'critical' | 'heal';
}

// Combat actions
export type CombatAction = 'attack' | 'defend' | 'item' | 'flee';
