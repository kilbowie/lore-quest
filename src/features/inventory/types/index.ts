
import { InventoryItem } from '@/types';

export interface EquippableItem extends InventoryItem {
  isEquippable: true;
  equipmentStats: {
    slot: string;
    armor?: number;
    statBonuses?: {
      attribute: string;
      value: number;
    }[];
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
