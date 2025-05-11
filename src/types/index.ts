
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
  gold: number; // Added gold currency
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
  isDead: boolean; // Is player dead
  lastRegenerationTime?: Date; // Last time health/mana/stamina regenerated
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

// Class descriptions and base stats
export const CLASS_DESCRIPTIONS: Record<PlayerClass, { 
  description: string; 
  baseStats: { strength: number; intelligence: number; dexterity: number };
  primaryAttribute: 'strength' | 'intelligence' | 'dexterity';
}> = {
  Knight: {
    description: 'A stalwart defender with high health. Specializes in physical combat.',
    baseStats: { strength: 5, intelligence: 2, dexterity: 3 },
    primaryAttribute: 'strength'
  },
  Wizard: {
    description: 'A master of arcane arts with high mana. Specializes in magical abilities.',
    baseStats: { strength: 2, intelligence: 5, dexterity: 3 },
    primaryAttribute: 'intelligence'
  },
  Ranger: {
    description: 'A nimble explorer with high stamina. Specializes in ranged combat and mobility.',
    baseStats: { strength: 3, intelligence: 2, dexterity: 5 },
    primaryAttribute: 'dexterity'
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
  CHECK_INTERVAL_MS: 60 * 1000 // Check every minute
};

export interface InventoryItem {
  id: string;
  type: 'rune' | 'map' | 'compass' | 'weapon' | 'potion' | 'elixir' | 'other' | 'gold';
  name: string;
  description?: string;
  quantity: number;
  icon?: string;
  useEffect?: 'health' | 'mana' | 'stamina' | 'revival' | 'none';
  value?: number; // How much it heals/restores or costs in gold
}

export interface Achievement {
  id: string;
  type: 'territory' | 'realm' | 'continent' | 'meta' | 'tutorial' | 'verification';
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

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'discovery' | 'collection' | 'exploration' | 'tutorial' | 'daily' | 'weekly' | 'monthly' | 'verification';
  targetId?: string;
  targetCount?: number;
  xpReward: number;
  goldReward?: number; // Gold reward for completing the quest
  itemReward?: {
    type: 'potion' | 'elixir' | 'other';
    name: string;
    quantity: number;
  };
  completed: boolean;
  progress: number;
  expiresAt?: Date; // For time-limited quests (daily, weekly, monthly)
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
  type: 'potion' | 'elixir' | 'other';
  description: string;
  goldCost: number;
  useEffect: 'health' | 'mana' | 'stamina' | 'revival' | 'none';
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
  }
];

// Quest schedule types
export interface QuestSchedule {
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
}

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
  }
};
