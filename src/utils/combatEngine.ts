import { User } from '../types';
import { toast } from '@/components/ui/sonner';

export const useItem = (user: User, itemId: string): User => {
  if (!user) return user;
  
  // Find the item in inventory
  const item = user.inventory.find(i => i.id === itemId);
  if (!item) return user;
  
  let updatedUser = { ...user };
  let itemUsed = false;
  
  // Handle based on item effect
  if (item.useEffect === 'health' && item.value) {
    // Apply health restoration
    const healthToRestore = item.value < 1 
      ? Math.floor(user.maxHealth * item.value) // Percentage-based (e.g., 0.5 = 50%)
      : item.value; // Fixed amount
    
    const newHealth = Math.min(user.maxHealth, user.health + healthToRestore);
    updatedUser.health = newHealth;
    
    toast.success(`Used ${item.name}`, {
      description: `Restored ${healthToRestore} health points.`
    });
    
    itemUsed = true;
  } else if (item.useEffect === 'mana' && item.value) {
    // Apply mana restoration
    const manaToRestore = item.value < 1 
      ? Math.floor(user.maxMana * item.value) // Percentage-based
      : item.value; // Fixed amount
    
    const newMana = Math.min(user.maxMana, user.mana + manaToRestore);
    updatedUser.mana = newMana;
    
    toast.success(`Used ${item.name}`, {
      description: `Restored ${manaToRestore} mana points.`
    });
    
    itemUsed = true;
  } else if (item.useEffect === 'stamina' && item.value) {
    // Apply stamina restoration
    const staminaToRestore = item.value < 1 
      ? Math.floor(user.maxStamina * item.value) // Percentage-based
      : item.value; // Fixed amount
    
    const newStamina = Math.min(user.maxStamina, user.stamina + staminaToRestore);
    updatedUser.stamina = newStamina;
    
    toast.success(`Used ${item.name}`, {
      description: `Restored ${staminaToRestore} stamina points.`
    });
    
    itemUsed = true;
  } else if (item.useEffect === 'energy' && item.value) {
    // Apply energy restoration
    let energyToRestore = item.value;
    const newEnergy = Math.min(user.maxEnergy, user.energy + energyToRestore);
    updatedUser.energy = newEnergy;
    
    toast.success(`Used ${item.name}`, {
      description: `Restored ${energyToRestore} energy points.`
    });
    
    itemUsed = true;
  } else if (item.useEffect === 'revival') {
    // Revival elixirs are used automatically when the player dies
    toast.error(`${item.name} will be used automatically when you die.`);
    return user; // Return original user without consuming the item
  }
  
  // If item was used, remove it from inventory
  if (itemUsed) {
    const updatedInventory = [...updatedUser.inventory];
    const itemIndex = updatedInventory.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
      if (updatedInventory[itemIndex].quantity > 1) {
        // Decrease quantity
        updatedInventory[itemIndex] = {
          ...updatedInventory[itemIndex],
          quantity: updatedInventory[itemIndex].quantity - 1
        };
      } else {
        // Remove item
        updatedInventory.splice(itemIndex, 1);
      }
      
      updatedUser.inventory = updatedInventory;
    }
  }
  
  return updatedUser;
};

// Check if user has a revival elixir
export const hasRevivalElixir = (user: User): boolean => {
  return user.inventory.some(item => item.useEffect === 'revival');
};

// Use revival elixir automatically when player dies
export const useRevivalElixir = (user: User): User => {
  if (!user.isDead) return user;
  
  // Find revival elixir in inventory
  const revivalElixir = user.inventory.find(item => item.useEffect === 'revival');
  if (!revivalElixir) return user;
  
  // Create updated user
  let updatedUser = { ...user };
  
  // Revive player with percentage of stats based on elixir value
  const revivePercentage = revivalElixir.value || 0.5; // Default to 50% if not specified
  
  updatedUser.health = Math.floor(user.maxHealth * revivePercentage);
  updatedUser.mana = Math.floor(user.maxMana * revivePercentage);
  updatedUser.stamina = Math.floor(user.maxStamina * revivePercentage);
  updatedUser.isDead = false;
  
  // Remove elixir from inventory
  const updatedInventory = [...updatedUser.inventory];
  const itemIndex = updatedInventory.findIndex(i => i.id === revivalElixir.id);
  
  if (itemIndex !== -1) {
    if (updatedInventory[itemIndex].quantity > 1) {
      // Decrease quantity
      updatedInventory[itemIndex] = {
        ...updatedInventory[itemIndex],
        quantity: updatedInventory[itemIndex].quantity - 1
      };
    } else {
      // Remove item
      updatedInventory.splice(itemIndex, 1);
    }
    
    updatedUser.inventory = updatedInventory;
  }
  
  toast.success(`${revivalElixir.name} used automatically!`, {
    description: `You have been revived with ${revivePercentage * 100}% of your stats.`
  });
  
  return updatedUser;
};

// Calculate damage based on attacker and defender stats
export const calculateDamage = (
  attackerStrength: number,
  attackerIntelligence: number,
  attackerDexterity: number,
  attackType: 'Melee' | 'Magic' | 'Ranged',
  defenderArmor: number
): number => {
  let baseDamage = 0;
  
  // Calculate base damage based on attack type and relevant stat
  switch (attackType) {
    case 'Melee':
      baseDamage = 5 + Math.floor(attackerStrength * 1.5);
      break;
    case 'Magic':
      baseDamage = 5 + Math.floor(attackerIntelligence * 1.5);
      break;
    case 'Ranged':
      baseDamage = 5 + Math.floor(attackerDexterity * 1.5);
      break;
  }
  
  // Apply armor reduction (minimum damage is 1)
  const damageAfterArmor = Math.max(1, baseDamage - defenderArmor);
  
  // Add some randomness (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4; // Between 0.8 and 1.2
  const finalDamage = Math.floor(damageAfterArmor * randomFactor);
  
  return finalDamage;
};

// Check if attack is critical or weak
export const checkAttackEffectiveness = (
  attackerType: 'Melee' | 'Magic' | 'Ranged',
  defenderType: 'Melee' | 'Magic' | 'Ranged'
): 'critical' | 'weak' | 'normal' => {
  // Rock-paper-scissors style effectiveness
  if (
    (attackerType === 'Melee' && defenderType === 'Magic') ||
    (attackerType === 'Magic' && defenderType === 'Ranged') ||
    (attackerType === 'Ranged' && defenderType === 'Melee')
  ) {
    return 'critical';
  } else if (
    (attackerType === 'Melee' && defenderType === 'Ranged') ||
    (attackerType === 'Magic' && defenderType === 'Melee') ||
    (attackerType === 'Ranged' && defenderType === 'Magic')
  ) {
    return 'weak';
  } else {
    return 'normal';
  }
};
