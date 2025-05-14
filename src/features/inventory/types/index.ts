
import { InventoryItem, EquipmentSlot, EquippableItem as GlobalEquippableItem } from '@/types';

// Use the EquippableItem from the global types to ensure consistency
export type { GlobalEquippableItem as EquippableItem };

export interface InventoryContextType {
  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  useItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: string) => void;
  isLoading: boolean;
}
