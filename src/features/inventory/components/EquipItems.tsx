
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/features/inventory/context/InventoryContext';
import { InventoryItem, EquippableItem, EquipmentSlot } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InventoryIcon from '@/components/InventoryIcon';
import { toast } from '@/components/ui/sonner';

const EquipItems: React.FC = () => {
  const { user } = useAuth();
  const { inventory, equipItem, unequipItem } = useInventory();
  
  if (!user) return null;
  
  const equipment = user.equipment || {};
  
  // Filter to get only equippable items
  const equippableItems = inventory.filter(
    item => item.isEquippable
  ) as EquippableItem[];
  
  // Group items by equipment slot
  const itemsBySlot: Record<string, EquippableItem[]> = {};
  
  equippableItems.forEach(item => {
    const slot = item.equipmentStats?.slot;
    if (slot) {
      if (!itemsBySlot[slot]) {
        itemsBySlot[slot] = [];
      }
      itemsBySlot[slot].push(item);
    }
  });
  
  const handleEquip = (item: EquippableItem) => {
    equipItem(item.id);
    toast.success(`Equipped: ${item.name}`);
  };
  
  const handleUnequip = (slot: string) => {
    unequipItem(slot);
    toast.success(`Unequipped item from ${slot} slot`);
  };
  
  // Equipment slot order with corrected types
  const slotOrder: EquipmentSlot[] = [
    'head', 
    'chest', 
    'legs', 
    'feet', 
    'hands', 
    'neck', 
    'ring', 
    'mainHand', 
    'offHand'
  ];
  
  return (
    <Tabs defaultValue="equipped" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="equipped">Currently Equipped</TabsTrigger>
        <TabsTrigger value="available">Available Gear</TabsTrigger>
      </TabsList>
      
      <TabsContent value="equipped" className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slotOrder.map(slot => {
            const equippedItem = equipment[slot] as EquippableItem | undefined;
            
            return (
              <Card key={slot} className={`bg-zinc-950/80 ${equippedItem ? 'border-amber-800/50' : 'border-zinc-800/30'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-900 mr-3">
                        {equippedItem ? (
                          <InventoryIcon item={equippedItem} />
                        ) : (
                          <span className="text-zinc-600 text-xs">{slot}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {equippedItem ? equippedItem.name : `Empty ${slot} slot`}
                        </p>
                        {equippedItem && (
                          <p className="text-xs text-zinc-400">{equippedItem.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {equippedItem && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUnequip(slot)}
                      >
                        Unequip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
      
      <TabsContent value="available" className="mt-4">
        {Object.entries(itemsBySlot).length === 0 ? (
          <Card className="bg-zinc-950/80 text-zinc-100">
            <CardContent className="p-4">
              <p className="text-center text-zinc-500">No equipment available to equip</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {slotOrder.map(slot => {
              const items = itemsBySlot[slot] || [];
              if (items.length === 0) return null;
              
              return (
                <Card key={slot} className="bg-zinc-950/80 text-zinc-100">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2 capitalize">{slot} Items</h3>
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
                              {item.equipmentStats?.armor && (
                                <p className="text-xs text-green-400">Armor: +{item.equipmentStats.armor}</p>
                              )}
                              {item.equipmentStats?.damage && (
                                <p className="text-xs text-red-400">Damage: +{item.equipmentStats.damage}</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleEquip(item)}
                            size="sm" 
                            variant="outline"
                          >
                            Equip
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default EquipItems;
