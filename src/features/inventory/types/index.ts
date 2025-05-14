
import { InventoryItem, EquipmentSlot } from '@/types';

export interface EquippableItem extends InventoryItem {
  equipmentStats: {
    slot: EquipmentSlot;
    armor?: number;
    damage?: number;
    effects?: string[];
  };
}

export interface InventoryContextType {
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  useItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: string) => void;
  isLoading: boolean;
}
