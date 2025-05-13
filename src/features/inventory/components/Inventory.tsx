
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { InventoryItem } from '@/types';
import InventoryIcon from '@/components/InventoryIcon';

interface InventoryProps {
  onUseItem?: (itemId: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ onUseItem }) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const inventory = user.inventory || [];
  
  // Group items by type
  const groupedInventory = inventory.reduce<Record<string, InventoryItem[]>>(
    (groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    },
    {}
  );
  
  // Order of item types to display
  const itemOrder = ['potion', 'elixir', 'armor', 'weapon', 'gold', 'energy', 'other'];
  
  if (inventory.length === 0) {
    return (
      <Card className="bg-zinc-950/80 text-zinc-100">
        <CardContent className="p-4">
          <p className="text-center text-zinc-500">Your inventory is empty</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {itemOrder.map((itemType) => {
        const items = groupedInventory[itemType] || [];
        if (items.length === 0) return null;
        
        return (
          <Card key={itemType} className="bg-zinc-950/80 text-zinc-100">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 capitalize">{itemType}s</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border border-zinc-800 rounded">
                    <div className="flex items-center">
                      <div className="mr-2 text-xl">
                        <InventoryIcon item={item} />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.description}</p>
                        <p className="text-xs text-zinc-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    {onUseItem && item.useEffect && item.useEffect !== 'none' && (
                      <Button 
                        onClick={() => onUseItem(item.id)}
                        size="sm" 
                        variant="outline"
                      >
                        Use
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Inventory;
