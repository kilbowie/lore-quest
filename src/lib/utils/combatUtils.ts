import { Enemy } from '@/features/combat/types';
import { User } from '@/types';

/**
 * Calculates damage based on attacker stats and defender defense
 */
export const calculateDamage = (
  attacker: User | Enemy, 
  defender: User | Enemy, 
  isDefending: boolean = false,
  isCritical: boolean = false
): number => {
  // Base damage calculation
  let baseDamage = 'attack' in attacker ? attacker.attack : 0;
  
  // For users, calculate based on class and equipment
  if ('playerClass' in attacker) {
    if (attacker.playerClass === 'Knight') {
      baseDamage = attacker.stats.strength * 1.5;
    } else if (attacker.playerClass === 'Wizard') {
      baseDamage = attacker.stats.intelligence * 1.5;
    } else if (attacker.playerClass === 'Ranger') {
      baseDamage = attacker.stats.dexterity * 1.5;
    } else {
      baseDamage = Math.max(
        attacker.stats.strength, 
        attacker.stats.intelligence, 
        attacker.stats.dexterity
      );
    }
    
    // Add weapon damage if available
    if (attacker.equipment?.mainWeapon?.equipmentStats?.statBonuses) {
      attacker.equipment.mainWeapon.equipmentStats.statBonuses.forEach(bonus => {
        if (['strength', 'intelligence', 'dexterity'].includes(bonus.attribute)) {
          baseDamage += bonus.value;
        }
      });
    }
  }
  
  // Apply critical hit multiplier
  if (isCritical) {
    baseDamage *= 1.5;
  }
  
  // Reduce damage if defending
  if (isDefending) {
    baseDamage = Math.floor(baseDamage * 0.5);
  }
  
  // Apply defender's defense/armor reduction
  const defense = 'defense' in defender ? defender.defense : ('armor' in defender ? defender.armor : 0);
  const defenseMultiplier = 'defense' in defender ? 0.5 : 0.7; // Enemies use 0.5, players use 0.7
  
  const finalDamage = Math.max(1, Math.floor(baseDamage - (defense * defenseMultiplier)));
  
  return finalDamage;
};

/**
 * Determines if a critical hit occurred based on attacker stats
 */
export const isCriticalHit = (attacker: User | Enemy): boolean => {
  // Base critical chance
  let critChance = 0.05; // 5% base chance
  
  // User critical chance can be affected by stats
  if ('playerClass' in attacker) {
    // Increase crit chance based on dexterity
    critChance += attacker.stats.dexterity * 0.005; // +0.5% per point of dexterity
    
    // Cap at 25%
    critChance = Math.min(0.25, critChance);
  }
  
  return Math.random() < critChance;
};

/**
 * Determines if a flee attempt is successful
 */
export const isFleeSuccessful = (user: User, enemy: Enemy): boolean => {
  // Base 70% chance of fleeing
  let fleeChance = 0.7;
  
  // Adjust based on user's dexterity vs enemy level
  fleeChance += user.stats.dexterity * 0.01; // +1% per dexterity point
  fleeChance -= enemy.level * 0.02; // -2% per enemy level
  
  // Keep between 30% and 90%
  fleeChance = Math.max(0.3, Math.min(0.9, fleeChance));
  
  return Math.random() < fleeChance;
};
