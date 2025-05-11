
import { User, AttackType, COMBAT_EFFECTIVENESS, COMBAT_CONSTANTS, InventoryItem } from '../types';
import { toast } from '@/components/ui/sonner';
import { updateUser } from './authUtils';

// Calculate damage based on attack type and defender's stats
export const calculateDamage = (
  attacker: User, 
  defender: User, 
  attackType: AttackType
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
    attackerStat = attacker.stats?.[statAttribute] || 1;
  }
  
  // Determine defender's primary attack type based on class
  let defenderAttackType: AttackType = 'Melee';
  if (defender.playerClass === 'Wizard') {
    defenderAttackType = 'Magic';
  } else if (defender.playerClass === 'Ranger') {
    defenderAttackType = 'Ranged';
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
  if (!isCritical && defender.armor > 0) {
    // Armor reduces damage by a percentage
    const armorValue = defender.armor || 0;
    const damageReduction = Math.min(0.75, armorValue / 100); // Max 75% reduction
    damage *= (1 - damageReduction);
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
  
  return updatedUser;
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
