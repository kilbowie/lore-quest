
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { InventoryItem } from '@/types';
import { EquippableItem, InventoryContextType } from '../types';

const defaultInventoryContext: InventoryContextType = {
  inventory: [],
  addItem: () => {},
  removeItem: () => {},
  useItem: () => {},
  equipItem: () => {},
  unequipItem: () => {},
  isLoading: true,
};

export const InventoryContext = createContext<InventoryContextType>(defaultInventoryContext);

export const useInventory = (): InventoryContextType => useContext(InventoryContext);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUser } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize inventory from user data
  useEffect(() => {
    if (user) {
      setInventory(user.inventory || []);
      setIsLoading(false);
    }
  }, [user]);

  // Sync inventory changes back to user
  useEffect(() => {
    if (user && !isLoading && JSON.stringify(user.inventory) !== JSON.stringify(inventory)) {
      updateCurrentUser({ ...user, inventory });
    }
  }, [inventory, isLoading]);

  const addItem = (newItem: InventoryItem) => {
    if (!user) return;

    setInventory(prevInventory => {
      // Check if item already exists
      const existingItemIndex = prevInventory.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedInventory = [...prevInventory];
        updatedInventory[existingItemIndex] = {
          ...updatedInventory[existingItemIndex],
          quantity: updatedInventory[existingItemIndex].quantity + newItem.quantity
        };
        return updatedInventory;
      } else {
        // Add new item
        return [...prevInventory, newItem];
      }
    });
  };

  const removeItem = (itemId: string, quantity = 1) => {
    if (!user) return;
    
    setInventory(prevInventory => {
      const existingItemIndex = prevInventory.findIndex(item => item.id === itemId);
      
      if (existingItemIndex < 0) return prevInventory;
      
      const updatedInventory = [...prevInventory];
      const currentItem = updatedInventory[existingItemIndex];
      
      if (currentItem.quantity <= quantity) {
        // Remove item completely
        return updatedInventory.filter(item => item.id !== itemId);
      } else {
        // Reduce quantity
        updatedInventory[existingItemIndex] = {
          ...currentItem,
          quantity: currentItem.quantity - quantity
        };
        return updatedInventory;
      }
    });
  };

  const useItem = (itemId: string) => {
    if (!user) return;
    
    // Find the item
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    // Process item use based on its effect type
    if (item.useEffect === 'health') {
      const newHealth = Math.min(user.maxHealth, user.health + (item.value || 0));
      updateCurrentUser({ ...user, health: newHealth });
    } else if (item.useEffect === 'mana') {
      const newMana = Math.min(user.maxMana, user.mana + (item.value || 0));
      updateCurrentUser({ ...user, mana: newMana });
    } else if (item.useEffect === 'stamina') {
      const newStamina = Math.min(user.maxStamina, user.stamina + (item.value || 0));
      updateCurrentUser({ ...user, stamina: newStamina });
    } else if (item.useEffect === 'energy') {
      const newEnergy = Math.min(user.maxEnergy, user.energy + (item.value || 0));
      updateCurrentUser({ ...user, energy: newEnergy });
    }
    
    // Remove one of the used item
    removeItem(itemId, 1);
  };

  const equipItem = (itemId: string) => {
    if (!user) return;
    
    const item = inventory.find(i => i.id === itemId && i.isEquippable === true);
    
    if (!item || !item.equipmentStats) return;
    
    // Use type guard to ensure we have the right type
    const equippableItem = item as EquippableItem;
    
    // Get the slot this item goes into
    const slot = equippableItem.equipmentStats.slot;
    
    // Create a copy of the current equipment
    const updatedEquipment = { ...user.equipment };
    
    // If there's already an item in this slot, unequip it
    if (updatedEquipment[slot]) {
      // Add the previously equipped item back to inventory
      setInventory(prev => [...prev, updatedEquipment[slot]]);
    }
    
    // Put the new item in the equipment slot
    updatedEquipment[slot] = equippableItem;
    
    // Remove the equipped item from inventory
    removeItem(itemId);
    
    // Recalculate armor value
    let totalArmor = 0;
    Object.values(updatedEquipment).forEach(equippedItem => {
      if (equippedItem?.equipmentStats?.armor) {
        totalArmor += equippedItem.equipmentStats.armor;
      }
    });
    
    // Update user with new equipment and armor value
    updateCurrentUser({
      ...user,
      equipment: updatedEquipment,
      armor: totalArmor
    });
  };

  const unequipItem = (slot: string) => {
    if (!user || !user.equipment[slot]) return;
    
    // Get the item being unequipped
    const itemToUnequip = user.equipment[slot];
    
    // Create updated equipment without this item
    const updatedEquipment = { ...user.equipment };
    delete updatedEquipment[slot];
    
    // Recalculate armor
    let totalArmor = 0;
    Object.values(updatedEquipment).forEach(equippedItem => {
      if (equippedItem?.equipmentStats?.armor) {
        totalArmor += equippedItem.equipmentStats.armor;
      }
    });
    
    // Add the unequipped item back to inventory
    setInventory(prev => [...prev, itemToUnequip]);
    
    // Update user with new equipment and armor
    updateCurrentUser({
      ...user,
      equipment: updatedEquipment,
      armor: totalArmor
    });
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        addItem,
        removeItem,
        useItem,
        equipItem,
        unequipItem,
        isLoading
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
