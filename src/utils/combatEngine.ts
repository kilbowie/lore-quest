
import { User, AttackType, COMBAT_EFFECTIVENESS, COMBAT_CONSTANTS, InventoryItem, Enemy, CombatAction, CombatLogEntry } from '../types';
import { toast } from '@/components/ui/sonner';
import { updateUser } from './authUtils';
import { v4 as uuidv4 } from 'uuid';

// Calculate damage based on attack type and defender's stats
export const calculateDamage = (
  attacker: User | Enemy, 
  defender: User | Enemy, 
  attackType: AttackType,
  isDefending: boolean = false
): { 
  damage: number; 
  isCritical: boolean; 
  isWeak: boolean;
  attackerStatValue: number;
} => {
  // Get attacker's relevant stat based on attack type
  let attackerStat = 0;
  const effectiveness = COMBAT_EFFECTIVENESS[attackType];
  
  if (effectiveness) {
    const statAttribute = effectiveness.damageAttribute;
    
    // Handle different object structures between User and Enemy
    if ('stats' in attacker && attacker.stats) {
      attackerStat = attacker.stats[statAttribute] || 1;
    } else if (statAttribute === 'strength' && 'strength' in attacker) {
      attackerStat = attacker.strength;
    } else if (statAttribute === 'intelligence' && 'intelligence' in attacker) {
      attackerStat = attacker.intelligence;
    } else if (statAttribute === 'dexterity' && 'dexterity' in attacker) {
      attackerStat = attacker.dexterity;
    }
  }
  
  // Determine defender's primary attack type
  let defenderAttackType: AttackType = 'Melee';
  
  if ('playerClass' in defender) {
    // This is a User object
    if (defender.playerClass === 'Wizard') {
      defenderAttackType = 'Magic';
    } else if (defender.playerClass === 'Ranger') {
      defenderAttackType = 'Ranged';
    }
  } else if ('type' in defender) {
    // This is an Enemy object
    if (defender.type === 'magic') {
      defenderAttackType = 'Magic';
    } else if (defender.type === 'ranged') {
      defenderAttackType = 'Ranged';
    }
  }
  
  // Determine if this is a critical or weak attack
  const isCritical = effectiveness?.criticalAgainst === defenderAttackType;
  const isWeak = effectiveness?.weakAgainst === defenderAttackType;
  
  // Calculate base damage
  let damage = attackerStat * 2; // Base damage formula
  
  // Apply critical or weak multipliers
  if (isCritical) {
    damage *= COMBAT_CONSTANTS.CRITICAL_MULTIPLIER;
  } else if (isWeak) {
    damage *= COMBAT_CONSTANTS.WEAK_MULTIPLIER;
  }
  
  // Apply defender's armor reduction (only for non-critical hits)
  if (!isCritical && 'armor' in defender && defender.armor > 0) {
    // Armor reduces damage by a percentage
    const armorValue = defender.armor || 0;
    const damageReduction = Math.min(0.75, armorValue / 100); // Max 75% reduction
    damage *= (1 - damageReduction);
  }
  
  // Apply defend action reduction (50% less damage)
  if (isDefending) {
    damage *= 0.5;
  }
  
  // Ensure damage is at least 1
  damage = Math.max(1, Math.floor(damage));
  
  return { 
    damage, 
    isCritical, 
    isWeak,
    attackerStatValue: attackerStat
  };
};

// Apply damage to a user
export const applyDamage = (user: User, damage: number): User => {
  const updatedUser = { ...user };
  
  // Apply damage to health
  updatedUser.health -= damage;
  
  // Check if user is dead
  if (updatedUser.health <= 0) {
    updatedUser.health = 0;
    updatedUser.isDead = true;
    
    // Check for revival items
    const revivalItem = updatedUser.inventory.find(
      item => item.type === 'elixir' && item.useEffect === 'revival' && item.quantity > 0
    );
    
    if (revivalItem) {
      // Use revival item
      useItem(updatedUser, revivalItem.id);
    }
  }
  
  // Reset defending status after taking damage
  updatedUser.defending = false;
  
  return updatedUser;
};

// Apply damage to an enemy
export const applyDamageToEnemy = (enemy: Enemy, damage: number): Enemy => {
  return {
    ...enemy,
    health: Math.max(0, enemy.health - damage)
  };
};

// Use an item from inventory
export const useItem = (user: User, itemId: string): User => {
  const updatedUser = { ...user };
  const itemIndex = updatedUser.inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    toast.error('Item not found in inventory');
    return updatedUser;
  }
  
  const item = updatedUser.inventory[itemIndex];
  
  // Check if item can be used
  if (item.quantity <= 0) {
    toast.error('You do not have any of this item');
    return updatedUser;
  }
  
  // Apply item effect
  switch (item.useEffect) {
    case 'health':
      if (!updatedUser.isDead) {
        updatedUser.health = Math.min(updatedUser.maxHealth, updatedUser.health + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} health points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'mana':
      if (!updatedUser.isDead) {
        updatedUser.mana = Math.min(updatedUser.maxMana, updatedUser.mana + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} mana points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'stamina':
      if (!updatedUser.isDead) {
        updatedUser.stamina = Math.min(updatedUser.maxStamina, updatedUser.stamina + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} stamina points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
    
    case 'energy':
      if (!updatedUser.isDead) {
        updatedUser.energy = Math.min(updatedUser.maxEnergy, updatedUser.energy + (item.value || 0));
        toast.success(`Used ${item.name}`, {
          description: `Restored ${item.value} energy points.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while dead`);
        return updatedUser;
      }
      break;
      
    case 'revival':
      if (updatedUser.isDead) {
        // Revive user
        updatedUser.isDead = false;
        updatedUser.health = Math.floor(updatedUser.maxHealth * 0.3); // Revive with 30% health
        
        toast.success(`Used ${item.name}`, {
          description: `You have been revived with ${updatedUser.health} health.`
        });
      } else {
        toast.error(`Cannot use ${item.name} while alive`);
        return updatedUser;
      }
      break;
    
    default:
      toast.info(`Used ${item.name}`);
      break;
  }
  
  // Decrease quantity
  updatedUser.inventory[itemIndex].quantity -= 1;
  
  // Remove item from inventory if quantity is 0
  if (updatedUser.inventory[itemIndex].quantity <= 0) {
    updatedUser.inventory = updatedUser.inventory.filter(i => i.id !== itemId);
  }
  
  // Save user changes
  updateUser(updatedUser);
  
  return updatedUser;
};

// Get best attack type for a user based on class and equipped items
export const getBestAttackType = (user: User): AttackType => {
  if (!user.playerClass) return 'Melee';
  
  // Default attack type based on class
  let attackType: AttackType = 'Melee';
  
  if (user.playerClass === 'Wizard') {
    attackType = 'Magic';
  } else if (user.playerClass === 'Ranger') {
    attackType = 'Ranged';
  }
  
  // Check if user has a main weapon equipped that might override this
  const mainWeapon = user.equipment?.mainWeapon;
  if (mainWeapon && mainWeapon.equipmentStats && mainWeapon.equipmentStats.attackType) {
    attackType = mainWeapon.equipmentStats.attackType;
  }
  
  return attackType;
};

// Get damage modifier text based on attack effectiveness
export const getDamageModifierText = (isCritical: boolean, isWeak: boolean): string => {
  if (isCritical) return 'Critical Hit!';
  if (isWeak) return 'Weak Hit';
  return 'Hit';
};

// Get all potential items that can be used in combat
export const getCombatUsableItems = (user: User): InventoryItem[] => {
  return user.inventory.filter(
    item => (
      item.quantity > 0 && 
      (item.useEffect === 'health' || item.useEffect === 'mana' || item.useEffect === 'stamina')
    )
  );
};

// Execute player turn
export const executePlayerAction = (
  user: User,
  enemy: Enemy,
  action: CombatAction,
  itemId?: string,
  attackType?: AttackType
): {
  updatedUser: User;
  updatedEnemy: Enemy;
  logEntry: CombatLogEntry;
  combatEnded: boolean;
  playerWon: boolean;
} => {
  let updatedUser = { ...user };
  let updatedEnemy = { ...enemy };
  let logEntry: CombatLogEntry;
  let combatEnded = false;
  let playerWon = false;
  
  switch (action) {
    case 'attack':
      if (!attackType) attackType = getBestAttackType(user);
      
      const damageResult = calculateDamage(user, enemy, attackType);
      updatedEnemy = applyDamageToEnemy(enemy, damageResult.damage);
      
      // Create log entry
      logEntry = {
        message: `You attack with ${attackType}: ${getDamageModifierText(damageResult.isCritical, damageResult.isWeak)} for ${damageResult.damage} damage!`,
        timestamp: new Date(),
        type: damageResult.isCritical ? 'critical' : 'player-action'
      };
      
      // Check if enemy is defeated
      if (updatedEnemy.health <= 0) {
        combatEnded = true;
        playerWon = true;
      }
      break;
      
    case 'defend':
      updatedUser.defending = true;
      
      // Create log entry
      logEntry = {
        message: 'You take a defensive stance, reducing incoming damage by 50%!',
        timestamp: new Date(),
        type: 'player-action'
      };
      break;
      
    case 'item':
      if (!itemId) {
        // If no item is selected, treat as a pass
        logEntry = {
          message: 'You fumble with your inventory but decide not to use anything.',
          timestamp: new Date(),
          type: 'player-action'
        };
      } else {
        // Use the selected item
        const itemBeforeUse = updatedUser.inventory.find(item => item.id === itemId);
        const itemName = itemBeforeUse ? itemBeforeUse.name : 'item';
        
        updatedUser = useItem(updatedUser, itemId);
        
        // Create log entry
        logEntry = {
          message: `You used ${itemName}!`,
          timestamp: new Date(),
          type: 'heal'
        };
      }
      break;
      
    case 'flee':
      // 50% chance to flee
      const fleeSuccess = Math.random() >= 0.5;
      
      if (fleeSuccess) {
        combatEnded = true;
        
        // Create log entry
        logEntry = {
          message: 'You successfully fled from battle!',
          timestamp: new Date(),
          type: 'system'
        };
      } else {
        // Create log entry
        logEntry = {
          message: 'You failed to escape!',
          timestamp: new Date(),
          type: 'system'
        };
      }
      break;
      
    default:
      // Default to a "pass" action
      logEntry = {
        message: 'You hesitate and take no action.',
        timestamp: new Date(),
        type: 'player-action'
      };
  }
  
  return {
    updatedUser,
    updatedEnemy,
    logEntry,
    combatEnded,
    playerWon
  };
};

// Execute enemy turn
export const executeEnemyAction = (
  user: User,
  enemy: Enemy
): {
  updatedUser: User;
  logEntry: CombatLogEntry;
  combatEnded: boolean;
} => {
  // Enemy always attacks
  const damageResult = calculateDamage(enemy, user, enemy.attackType, user.defending || false);
  const updatedUser = applyDamage(user, damageResult.damage);
  
  // Create log entry
  const logEntry: CombatLogEntry = {
    message: `${enemy.name} attacks with ${enemy.attackType}: ${getDamageModifierText(damageResult.isCritical, damageResult.isWeak)} for ${damageResult.damage} damage!`,
    timestamp: new Date(),
    type: damageResult.isCritical ? 'critical' : 'enemy-action'
  };
  
  // Check if player is defeated
  const combatEnded = updatedUser.health <= 0;
  
  return {
    updatedUser,
    logEntry,
    combatEnded
  };
};

// Process end of combat
export const processCombatEnd = (
  user: User,
  enemy: Enemy,
  playerWon: boolean
): {
  updatedUser: User;
  logEntries: CombatLogEntry[];
} => {
  let updatedUser = { ...user };
  const logEntries: CombatLogEntry[] = [];
  
  if (playerWon && !user.isDead) {
    // Award XP and gold
    updatedUser.experience += enemy.xpReward;
    updatedUser.gold += enemy.goldReward;
    
    // Update user stats
    if (updatedUser.stats) {
      updatedUser.stats.totalXpEarned += enemy.xpReward;
      updatedUser.stats.totalGoldEarned += enemy.goldReward;
    }
    
    // Create reward log entry
    logEntries.push({
      message: `You defeated the ${enemy.name}!`,
      timestamp: new Date(),
      type: 'reward'
    });
    
    logEntries.push({
      message: `Gained ${enemy.xpReward} XP and ${enemy.goldReward} gold!`,
      timestamp: new Date(),
      type: 'reward'
    });
    
    // Show toast
    toast.success(`Victory! You defeated the ${enemy.name}`, {
      description: `Earned ${enemy.xpReward} XP and ${enemy.goldReward} gold!`
    });
  } else if (updatedUser.health <= 0) {
    // Player defeated
    updatedUser.isDead = true;
    updatedUser.health = 0;
    
    // Create defeat log entry
    logEntries.push({
      message: `You were defeated by the ${enemy.name}!`,
      timestamp: new Date(),
      type: 'system'
    });
    
    // Show toast
    toast.error(`Defeat! You were beaten by the ${enemy.name}`, {
      description: "You'll need to recover before fighting again."
    });
  } else {
    // Player fled
    logEntries.push({
      message: `Combat with ${enemy.name} has ended.`,
      timestamp: new Date(),
      type: 'system'
    });
  }
  
  // Reset combat state
  updatedUser.inCombat = false;
  updatedUser.defending = false;
  
  // Update user in storage
  updateUser(updatedUser);
  
  return {
    updatedUser,
    logEntries
  };
};
