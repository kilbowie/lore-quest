
import { v4 as uuidv4 } from 'uuid';
import { BASE_ENEMIES, Enemy, User } from '../types';
import { toast } from "@/components/ui/sonner";
import { updateUser } from './authUtils';
import { REGENERATION_CONSTANTS } from '../types';

// Generate a scaled enemy based on player level
export const generateEnemy = (playerLevel: number): Enemy => {
  // Select a random enemy type from the base enemies
  const baseEnemyIndex = Math.floor(Math.random() * BASE_ENEMIES.length);
  const baseEnemy = BASE_ENEMIES[baseEnemyIndex];
  
  // Scale stats based on player level (easy mode scaling)
  const scaleFactor = 0.8; // Lower than player progression for "Easy Mode"
  const levelScaling = Math.max(1, playerLevel - 1) * scaleFactor;
  
  // Calculate scaled stats
  const health = Math.floor(baseEnemy.baseHealth + (levelScaling * 5));
  const strength = Math.floor(baseEnemy.baseStrength + levelScaling);
  const intelligence = Math.floor(baseEnemy.baseIntelligence + levelScaling);
  const dexterity = Math.floor(baseEnemy.baseDexterity + levelScaling);
  
  // Calculate rewards based on level
  const xpReward = Math.floor(baseEnemy.baseXp + (playerLevel * 2));
  const goldReward = Math.floor(baseEnemy.baseGold + playerLevel);
  
  // Create the enemy
  const enemy: Enemy = {
    id: uuidv4(),
    name: baseEnemy.name,
    type: baseEnemy.type,
    level: playerLevel,
    health: health,
    maxHealth: health,
    strength: strength,
    intelligence: intelligence,
    dexterity: dexterity,
    armor: baseEnemy.baseArmor,
    xpReward: xpReward,
    goldReward: goldReward,
    icon: baseEnemy.icon,
    attackType: baseEnemy.attackType,
    description: baseEnemy.description
  };
  
  return enemy;
};

// Check if the player has enough energy for combat
export const checkEnergy = (user: User): boolean => {
  return user.energy > 0;
};

// Use energy for combat
export const useEnergy = (user: User): User => {
  if (!checkEnergy(user)) {
    toast.error("Not enough energy!");
    return user;
  }
  
  const updatedUser = { ...user };
  updatedUser.energy = Math.max(0, user.energy - 1);
  
  // Update user in storage
  updateUser(updatedUser);
  
  return updatedUser;
};

// Regenerate energy
export const regenerateEnergy = (user: User): User => {
  const updatedUser = { ...user };
  const now = new Date();
  const lastRegen = new Date(user.lastEnergyRegenTime);
  
  // Calculate how many energy points to regenerate
  const timeDiff = now.getTime() - lastRegen.getTime();
  const energyToAdd = Math.floor(timeDiff / REGENERATION_CONSTANTS.ENERGY_REGEN_TIME_MS);
  
  if (energyToAdd > 0) {
    // Add energy but don't exceed max
    updatedUser.energy = Math.min(user.maxEnergy, user.energy + energyToAdd);
    
    // Update last regeneration time, but only for the energy that was actually regenerated
    const newRegenTime = new Date(lastRegen.getTime() + (energyToAdd * REGENERATION_CONSTANTS.ENERGY_REGEN_TIME_MS));
    updatedUser.lastEnergyRegenTime = newRegenTime;
    
    // Update user in storage
    updateUser(updatedUser);
    
    // Notify user if energy was regenerated
    if (energyToAdd === 1) {
      toast.success(`1 energy point has been regenerated!`);
    } else if (energyToAdd > 1) {
      toast.success(`${energyToAdd} energy points have been regenerated!`);
    }
  }
  
  return updatedUser;
};

// Calculate next energy regeneration time
export const getNextEnergyRegenTime = (user: User): Date => {
  if (user.energy >= user.maxEnergy) {
    return new Date(); // Already full
  }
  
  const lastRegen = new Date(user.lastEnergyRegenTime);
  return new Date(lastRegen.getTime() + REGENERATION_CONSTANTS.ENERGY_REGEN_TIME_MS);
};

// Format time until next energy regeneration
export const formatNextEnergyRegen = (user: User): string => {
  if (user.energy >= user.maxEnergy) {
    return "Full";
  }
  
  const nextRegen = getNextEnergyRegenTime(user);
  const now = new Date();
  const diffMs = nextRegen.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Ready";
  }
  
  const minutes = Math.floor((diffMs / 1000 / 60) % 60);
  const hours = Math.floor(diffMs / 1000 / 60 / 60);
  
  return `${hours}h ${minutes}m`;
};

// Check for random encounter based on distance
export const checkRandomEncounter = (distanceInMeters: number): boolean => {
  // Base chance: 10% per 500 meters
  const baseChance = 0.1;
  const distanceThreshold = 500;
  
  // Calculate encounter probability based on distance
  const encounterChance = baseChance * (distanceInMeters / distanceThreshold);
  
  // Cap the chance at 40% to avoid too frequent encounters
  const cappedChance = Math.min(0.4, encounterChance);
  
  // Random roll
  return Math.random() < cappedChance;
};
