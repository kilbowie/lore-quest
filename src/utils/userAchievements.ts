
import { User, Achievement, UserAchievement, Location } from '../types';
import { getAllAchievements, getAchievementById, createTerritoryAchievement } from './achievementsUtils';
import { addExperience } from './xpUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize achievements for a new user
 */
export const initializeAchievements = (user: User): User => {
  if (!user.achievements) {
    user.achievements = [];
  }
  
  // Add all achievements that should be available from the start
  const allAchievements = getAllAchievements();
  
  // Get all realm and continent achievements
  const realmAchievements = allAchievements.filter(a => a.type === 'realm');
  const continentAchievements = allAchievements.filter(a => a.type === 'continent');
  const metaAchievements = allAchievements.filter(a => a.type === 'meta');
  
  // Add realm achievements
  realmAchievements.forEach(achievement => {
    if (!user.achievements.some(a => a.achievementId === achievement.id)) {
      user.achievements.push({
        achievementId: achievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      });
    }
  });
  
  // Add continent achievements
  continentAchievements.forEach(achievement => {
    if (!user.achievements.some(a => a.achievementId === achievement.id)) {
      user.achievements.push({
        achievementId: achievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      });
    }
  });
  
  // Add meta achievements
  metaAchievements.forEach(achievement => {
    if (!user.achievements.some(a => a.achievementId === achievement.id)) {
      user.achievements.push({
        achievementId: achievement.id,
        completed: false,
        progress: 0,
        isTracked: false
      });
    }
  });
  
  return user;
};

/**
 * Update achievements when a new location is discovered
 */
export const updateAchievementsOnDiscovery = (
  user: User, 
  discoveredLocation: Location,
  allLocations: Location[]
): User => {
  let updatedUser = { ...user };
  
  // Create a territory achievement for this location
  const territoryAchievement = createTerritoryAchievement(
    discoveredLocation.id,
    discoveredLocation.name,
    discoveredLocation.realm
  );
  
  // Check if user already has this achievement
  if (!updatedUser.achievements.some(a => a.achievementId === territoryAchievement.id)) {
    // Add the achievement
    updatedUser.achievements.push({
      achievementId: territoryAchievement.id,
      completed: true,
      progress: 1,
      completedAt: new Date(),
      isTracked: false
    });
    
    // Award XP for territory discovery
    updatedUser = addExperience(updatedUser, territoryAchievement.xpReward, `Discovered ${discoveredLocation.name}`);
    
    // Award gold if applicable
    if (territoryAchievement.goldReward) {
      updatedUser.gold = (updatedUser.gold || 0) + territoryAchievement.goldReward;
    }
  }
  
  // Update realm achievements
  const realmAchievements = updatedUser.achievements.filter(a => {
    const achievement = getAchievementById(a.achievementId);
    return achievement && achievement.type === 'realm' && achievement.targetId === discoveredLocation.realm;
  });
  
  if (realmAchievements.length > 0) {
    const realmAchievement = realmAchievements[0];
    const locationsInRealm = allLocations.filter(l => l.realm === discoveredLocation.realm);
    const discoveredLocationsInRealm = locationsInRealm.filter(l => 
      updatedUser.discoveredLocations.includes(l.id)
    );
    
    // Calculate progress
    const progress = discoveredLocationsInRealm.length / locationsInRealm.length;
    
    // Update achievement progress
    realmAchievement.progress = progress;
    
    // Check if completed
    if (progress >= 1 && !realmAchievement.completed) {
      realmAchievement.completed = true;
      realmAchievement.completedAt = new Date();
      
      // Get achievement details
      const achievement = getAchievementById(realmAchievement.achievementId);
      if (achievement) {
        // Award XP
        updatedUser = addExperience(updatedUser, achievement.xpReward, `Completed ${achievement.name}`);
        
        // Award gold if applicable
        if (achievement.goldReward) {
          updatedUser.gold = (updatedUser.gold || 0) + achievement.goldReward;
        }
      }
    }
  }
  
  // Update continent achievements (similar to realms)
  if (discoveredLocation.continent) {
    const continentAchievements = updatedUser.achievements.filter(a => {
      const achievement = getAchievementById(a.achievementId);
      return achievement && achievement.type === 'continent' && achievement.targetId === discoveredLocation.continent;
    });
    
    if (continentAchievements.length > 0) {
      const continentAchievement = continentAchievements[0];
      const locationsInContinent = allLocations.filter(l => l.continent === discoveredLocation.continent);
      const discoveredLocationsInContinent = locationsInContinent.filter(l => 
        updatedUser.discoveredLocations.includes(l.id)
      );
      
      // Calculate progress
      const progress = discoveredLocationsInContinent.length / locationsInContinent.length;
      
      // Update achievement progress
      continentAchievement.progress = progress;
      
      // Check if completed
      if (progress >= 1 && !continentAchievement.completed) {
        continentAchievement.completed = true;
        continentAchievement.completedAt = new Date();
        
        // Get achievement details
        const achievement = getAchievementById(continentAchievement.achievementId);
        if (achievement) {
          // Award XP
          updatedUser = addExperience(updatedUser, achievement.xpReward, `Completed ${achievement.name}`);
          
          // Award gold if applicable
          if (achievement.goldReward) {
            updatedUser.gold = (updatedUser.gold || 0) + achievement.goldReward;
          }
        }
      }
    }
  }
  
  // Update meta achievements - all territories
  const allTerritoriesAchievements = updatedUser.achievements.filter(a => {
    const achievement = getAchievementById(a.achievementId);
    return achievement && achievement.type === 'meta' && achievement.id === 'meta-all-territories';
  });
  
  if (allTerritoriesAchievements.length > 0) {
    const allTerritoriesAchievement = allTerritoriesAchievements[0];
    
    // Calculate progress
    const progress = updatedUser.discoveredLocations.length / allLocations.length;
    
    // Update achievement progress
    allTerritoriesAchievement.progress = progress;
    
    // Check if completed
    if (progress >= 1 && !allTerritoriesAchievement.completed) {
      allTerritoriesAchievement.completed = true;
      allTerritoriesAchievement.completedAt = new Date();
      
      // Get achievement details
      const achievement = getAchievementById(allTerritoriesAchievement.achievementId);
      if (achievement) {
        // Award XP
        updatedUser = addExperience(updatedUser, achievement.xpReward, `Completed ${achievement.name}`);
        
        // Award gold if applicable
        if (achievement.goldReward) {
          updatedUser.gold = (updatedUser.gold || 0) + achievement.goldReward;
        }
      }
    }
  }
  
  return updatedUser;
};
