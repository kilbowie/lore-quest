
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
  inventory: InventoryItem[];
  discoveredLocations: string[]; // IDs of discovered locations
  achievements: UserAchievement[];
  activeQuests: string[]; // IDs of quests being tracked
  completedQuests: string[]; // IDs of completed quests
  emailVerified?: boolean;
  tutorialCompleted?: boolean;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  type: 'rune' | 'map' | 'compass' | 'weapon' | 'other';
  name: string;
  description?: string;
  quantity: number;
}

export interface Achievement {
  id: string;
  type: 'territory' | 'realm' | 'continent' | 'meta' | 'tutorial';
  name: string;
  description: string;
  targetId?: string; // ID of the location, realm or continent
  targetCount?: number; // For meta achievements (e.g. discover all territories in a realm)
  xpReward: number;
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
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'discovery' | 'collection' | 'exploration' | 'tutorial';
  targetId?: string;
  targetCount?: number;
  xpReward: number;
  completed: boolean;
  progress: number;
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
