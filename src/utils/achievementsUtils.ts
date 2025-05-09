
import { Achievement, User, UserAchievement, Location } from "../types";
import { addExperience } from "./xpUtils";
import { updateUser } from "./authUtils";
import { toast } from "@/components/ui/sonner";

// Define all available achievements
export const getAchievements = (): Achievement[] => {
  return [
    // Territory discoveries (sample - in real app would be generated for all territories)
    {
      id: 'discovery-london',
      type: 'territory',
      name: 'London Explorer',
      description: 'Discover the mystical territory of London',
      targetId: '1', // London ID
      xpReward: 50,
      icon: 'map-pin'
    },
    // Realm completion achievements
    {
      id: 'realm-england',
      type: 'realm',
      name: 'England Wayfarer',
      description: 'Discover all territories in the realm of England',
      targetId: 'England',
      xpReward: 500,
      icon: 'crown'
    },
    {
      id: 'realm-scotland',
      type: 'realm',
      name: 'Scotland Wayfarer',
      description: 'Discover all territories in the realm of Scotland',
      targetId: 'Scotland',
      xpReward: 500,
      icon: 'crown'
    },
    {
      id: 'realm-wales',
      type: 'realm',
      name: 'Wales Wayfarer',
      description: 'Discover all territories in the realm of Wales',
      targetId: 'Wales',
      xpReward: 500,
      icon: 'crown'
    },
    {
      id: 'realm-northernireland',
      type: 'realm',
      name: 'Northern Ireland Wayfarer',
      description: 'Discover all territories in the realm of Northern Ireland',
      targetId: 'Northern Ireland',
      xpReward: 500,
      icon: 'crown'
    },
    {
      id: 'realm-ireland',
      type: 'realm',
      name: 'Ireland Wayfarer',
      description: 'Discover all territories in the realm of Ireland',
      targetId: 'Ireland',
      xpReward: 500,
      icon: 'crown'
    },
    // Continent completion achievements
    {
      id: 'continent-uk',
      type: 'continent',
      name: 'United Kingdom Legend',
      description: 'Discover all realms in the United Kingdom',
      targetId: 'UK',
      xpReward: 2000,
      icon: 'globe'
    },
    {
      id: 'continent-ireland',
      type: 'continent',
      name: 'Ireland Legend',
      description: 'Discover all realms in Ireland',
      targetId: 'Ireland',
      xpReward: 1000,
      icon: 'globe'
    },
    // Meta achievements
    {
      id: 'meta-grandmaster',
      type: 'meta',
      name: 'Grand Explorer',
      description: 'Discover all territories across all realms and continents',
      xpReward: 5000,
      icon: 'award'
    }
  ];
};

// Initialize achievements for a new user
export const initializeAchievements = (user: User): User => {
  const updatedUser = { ...user };
  const allAchievements = getAchievements();
  
  // Create user achievements with 0 progress
  updatedUser.achievements = allAchievements.map(achievement => ({
    achievementId: achievement.id,
    completed: false,
    progress: 0,
    isTracked: false
  }));
  
  return updatedUser;
};

// Check and update achievements after a location is discovered
export const updateAchievementsOnDiscovery = (user: User, location: Location, allLocations: Location[]): User => {
  let updatedUser = { ...user };
  const allAchievements = getAchievements();
  
  // Check territory achievement
  const territoryAchievement = allAchievements.find(
    a => a.type === 'territory' && a.targetId === location.id
  );
  
  if (territoryAchievement) {
    // Update or create territory achievement
    let userAchievement = updatedUser.achievements.find(
      ua => ua.achievementId === territoryAchievement.id
    );
    
    if (!userAchievement) {
      userAchievement = {
        achievementId: territoryAchievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      };
      updatedUser.achievements.push(userAchievement);
    }
    
    if (!userAchievement.completed) {
      userAchievement.completed = true;
      userAchievement.progress = 1;
      userAchievement.completedAt = new Date();
      
      // Award XP
      updatedUser = addExperience(updatedUser, territoryAchievement.xpReward);
      
      // Notify user
      toast.success(`Achievement Unlocked: ${territoryAchievement.name}`, {
        description: `+${territoryAchievement.xpReward} XP`
      });
    }
  }
  
  // Check realm achievements
  checkRealmAchievements(updatedUser, location, allLocations);
  
  // Check continent achievements
  checkContinentAchievements(updatedUser, allLocations);
  
  // Check meta achievements
  checkMetaAchievements(updatedUser, allLocations);
  
  // Update user
  updateUser(updatedUser);
  
  return updatedUser;
};

// Helper function to check realm achievements
const checkRealmAchievements = (user: User, location: Location, allLocations: Location[]): void => {
  const allAchievements = getAchievements();
  const realmAchievement = allAchievements.find(
    a => a.type === 'realm' && a.targetId === location.realm
  );
  
  if (realmAchievement) {
    // Get all territories in this realm
    const realmTerritories = allLocations.filter(loc => loc.realm === location.realm);
    
    // Count discovered territories in this realm
    const discoveredCount = realmTerritories.filter(
      loc => user.discoveredLocations.includes(loc.id)
    ).length;
    
    // Find or create user achievement
    let userAchievement = user.achievements.find(
      ua => ua.achievementId === realmAchievement.id
    );
    
    if (!userAchievement) {
      userAchievement = {
        achievementId: realmAchievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      };
      user.achievements.push(userAchievement);
    }
    
    // Update progress
    userAchievement.progress = discoveredCount / realmTerritories.length;
    
    // Check if completed
    if (userAchievement.progress >= 1 && !userAchievement.completed) {
      userAchievement.completed = true;
      userAchievement.completedAt = new Date();
      
      // Award XP
      addExperience(user, realmAchievement.xpReward);
      
      // Notify user
      toast.success(`Achievement Unlocked: ${realmAchievement.name}`, {
        description: `+${realmAchievement.xpReward} XP`
      });
    }
  }
};

// Helper function to check continent achievements
const checkContinentAchievements = (user: User, allLocations: Location[]): void => {
  const allAchievements = getAchievements();
  
  // Get unique continents
  const continents = [...new Set(allLocations.map(loc => loc.continent || 'UK'))];
  
  continents.forEach(continent => {
    const continentAchievement = allAchievements.find(
      a => a.type === 'continent' && a.targetId === continent
    );
    
    if (continentAchievement) {
      // Get all realms in this continent
      const realms = [...new Set(
        allLocations
          .filter(loc => (loc.continent || 'UK') === continent)
          .map(loc => loc.realm)
      )];
      
      // Check if all realms are completed
      const completedRealms = realms.filter(realm => {
        const realmTerritories = allLocations.filter(loc => loc.realm === realm);
        const discoveredCount = realmTerritories.filter(
          loc => user.discoveredLocations.includes(loc.id)
        ).length;
        
        return discoveredCount === realmTerritories.length;
      });
      
      // Find or create user achievement
      let userAchievement = user.achievements.find(
        ua => ua.achievementId === continentAchievement.id
      );
      
      if (!userAchievement) {
        userAchievement = {
          achievementId: continentAchievement.id,
          completed: false,
          progress: 0,
          isTracked: false
        };
        user.achievements.push(userAchievement);
      }
      
      // Update progress
      userAchievement.progress = completedRealms.length / realms.length;
      
      // Check if completed
      if (userAchievement.progress >= 1 && !userAchievement.completed) {
        userAchievement.completed = true;
        userAchievement.completedAt = new Date();
        
        // Award XP
        addExperience(user, continentAchievement.xpReward);
        
        // Notify user
        toast.success(`Achievement Unlocked: ${continentAchievement.name}`, {
          description: `+${continentAchievement.xpReward} XP`
        });
      }
    }
  });
};

// Helper function to check meta achievements
const checkMetaAchievements = (user: User, allLocations: Location[]): void => {
  const allAchievements = getAchievements();
  const metaAchievement = allAchievements.find(a => a.type === 'meta' && a.id === 'meta-grandmaster');
  
  if (metaAchievement) {
    // Check if all locations are discovered
    const totalLocationsCount = allLocations.length;
    const discoveredCount = user.discoveredLocations.length;
    
    // Find or create user achievement
    let userAchievement = user.achievements.find(
      ua => ua.achievementId === metaAchievement.id
    );
    
    if (!userAchievement) {
      userAchievement = {
        achievementId: metaAchievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      };
      user.achievements.push(userAchievement);
    }
    
    // Update progress
    userAchievement.progress = discoveredCount / totalLocationsCount;
    
    // Check if completed
    if (userAchievement.progress >= 1 && !userAchievement.completed) {
      userAchievement.completed = true;
      userAchievement.completedAt = new Date();
      
      // Award XP
      addExperience(user, metaAchievement.xpReward);
      
      // Notify user
      toast.success(`Achievement Unlocked: ${metaAchievement.name}`, {
        description: `+${metaAchievement.xpReward} XP`
      });
    }
  }
};

// Get achievement details by ID
export const getAchievementById = (achievementId: string): Achievement | undefined => {
  return getAchievements().find(a => a.id === achievementId);
};

// Get achievement progress for a user
export const getUserAchievementProgress = (
  user: User, 
  achievementId: string
): UserAchievement | undefined => {
  return user.achievements.find(ua => ua.achievementId === achievementId);
};
