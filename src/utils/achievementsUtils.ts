
import { Achievement } from '../types';

// Collection of all achievements in the game
const ACHIEVEMENTS: Achievement[] = [
  // Email verification achievement
  {
    id: 'email-verification',
    type: 'verification',
    name: 'Email Verified',
    description: 'Verify your email address to confirm your account and earn rewards.',
    xpReward: 100,
    goldReward: 50,
    icon: '✉️'
  },
  
  // Tutorial achievement
  {
    id: 'tutorial-complete',
    type: 'tutorial',
    name: 'Tutorial Complete',
    description: 'Complete the tutorial and learn how to play the game.',
    xpReward: 150,
    goldReward: 50,
    icon: '📚'
  },
  
  // Territory achievements will be dynamically generated based on discovered locations
  
  // Realm achievements
  {
    id: 'realm-england',
    type: 'realm',
    name: 'England Explorer',
    description: 'Discover all territories in England.',
    targetId: 'England',
    xpReward: 200,
    goldReward: 100,
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  },
  {
    id: 'realm-scotland',
    type: 'realm',
    name: 'Scotland Explorer',
    description: 'Discover all territories in Scotland.',
    targetId: 'Scotland',
    xpReward: 200,
    goldReward: 100,
    icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  },
  {
    id: 'realm-wales',
    type: 'realm',
    name: 'Wales Explorer',
    description: 'Discover all territories in Wales.',
    targetId: 'Wales',
    xpReward: 200,
    goldReward: 100,
    icon: '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
  },
  {
    id: 'realm-northern-ireland',
    type: 'realm',
    name: 'Northern Ireland Explorer',
    description: 'Discover all territories in Northern Ireland.',
    targetId: 'Northern Ireland',
    xpReward: 200,
    goldReward: 100,
    icon: '🇬🇧'
  },
  {
    id: 'realm-ireland',
    type: 'realm',
    name: 'Ireland Explorer',
    description: 'Discover all territories in Ireland.',
    targetId: 'Ireland',
    xpReward: 200,
    goldReward: 100,
    icon: '🇮🇪'
  },
  
  // Continent achievements
  {
    id: 'continent-uk',
    type: 'continent',
    name: 'United Kingdom Master',
    description: 'Discover all territories in the United Kingdom.',
    targetId: 'UK',
    xpReward: 500,
    goldReward: 250,
    icon: '🇬🇧'
  },
  {
    id: 'continent-ireland',
    type: 'continent',
    name: 'Ireland Master',
    description: 'Discover all territories in Ireland.',
    targetId: 'Ireland',
    xpReward: 500,
    goldReward: 250,
    icon: '🇮🇪'
  },
  
  // Meta achievements
  {
    id: 'meta-all-territories',
    type: 'meta',
    name: 'Lore Keeper',
    description: 'Discover all territories across the UK & Ireland.',
    xpReward: 1000,
    goldReward: 500,
    icon: '👑'
  },
  {
    id: 'meta-all-quests',
    type: 'meta',
    name: 'Quest Master',
    description: 'Complete all quests in the game.',
    xpReward: 1000,
    goldReward: 500,
    icon: '🏆'
  }
];

// Get achievement by ID
export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
};

// Get all achievements
export const getAllAchievements = (): Achievement[] => {
  return [...ACHIEVEMENTS];
};

// Get achievements by type
export const getAchievementsByType = (type: Achievement['type']): Achievement[] => {
  return ACHIEVEMENTS.filter(achievement => achievement.type === type);
};

// Create a territory achievement
export const createTerritoryAchievement = (
  territoryId: string, 
  territoryName: string, 
  realm: string
): Achievement => {
  return {
    id: `territory-${territoryId}`,
    type: 'territory',
    name: `Discover ${territoryName}`,
    description: `Explore and discover ${territoryName} in ${realm}.`,
    targetId: territoryId,
    xpReward: 50,
    goldReward: 25,
    icon: '🗺️'
  };
};

export default ACHIEVEMENTS;
