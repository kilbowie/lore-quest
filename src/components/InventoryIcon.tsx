
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Backpack, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { InventoryItem } from '../types';

const InventoryIcon: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  if (!user) return null;
  
  const inventory = user.inventory || [];
  const itemCount = inventory.reduce((sum, item) => sum + item.quantity, 0);
  
  // Group items by type
  const potions = inventory.filter(item => item.type === 'potion');
  const elixirs = inventory.filter(item => item.type === 'elixir');
  const equipment = inventory.filter(item => item.isEquippable);
  const other = inventory.filter(item => !item.isEquippable && item.type !== 'potion' && item.type !== 'elixir');
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Backpack className="h-5 w-5 text-lorequest-gold" />
          {itemCount > 0 && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-xs">
              {itemCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-lorequest-dark border-lorequest-gold/30 p-0">
        <div className="flex items-center justify-between border-b border-lorequest-gold/20 p-2">
          <h3 className="text-sm font-medium text-lorequest-gold">Inventory ({itemCount} items)</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
            <X size={14} />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        <Tabs defaultValue="potions" className="w-full">
          <TabsList className="grid grid-cols-4 h-9 bg-lorequest-dark border-b border-lorequest-gold/20">
            <TabsTrigger value="potions" className="text-xs h-full data-[state=active]:bg-lorequest-gold/20">
              Potions{potions.length > 0 && <span className="ml-1 text-xs">({potions.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="elixirs" className="text-xs h-full data-[state=active]:bg-lorequest-gold/20">
              Elixirs{elixirs.length > 0 && <span className="ml-1 text-xs">({elixirs.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-xs h-full data-[state=active]:bg-lorequest-gold/20">
              Equip{equipment.length > 0 && <span className="ml-1 text-xs">({equipment.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs h-full data-[state=active]:bg-lorequest-gold/20">
              Other{other.length > 0 && <span className="ml-1 text-xs">({other.length})</span>}
            </TabsTrigger>
          </TabsList>
          
          {['potions', 'elixirs', 'equipment', 'other'].map((tab) => (
            <TabsContent key={tab} value={tab} className="p-0 m-0">
              <ScrollArea className="h-60">
                <div className="p-2">
                  {inventory.length === 0 ? (
                    <p className="text-sm text-lorequest-parchment/70 text-center py-4">Your inventory is empty</p>
                  ) : (
                    <div className="space-y-2">
                      {(tab === 'potions' ? potions : 
                        tab === 'elixirs' ? elixirs :
                        tab === 'equipment' ? equipment : other).map((item: InventoryItem) => (
                        <TooltipProvider key={item.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-1.5 rounded-md bg-lorequest-gold/10 hover:bg-lorequest-gold/20 cursor-pointer transition-colors">
                                <div className="flex items-center">
                                  <div className="text-xl mr-2">{item.icon || '📦'}</div>
                                  <div>
                                    <h4 className="text-xs font-medium text-lorequest-gold">{item.name}</h4>
                                    <p className="text-xs text-lorequest-parchment/80 truncate max-w-[160px]">{item.description}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-lorequest-parchment/70">x{item.quantity}</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{item.description}</p>
                              {item.useEffect && (
                                <p className="text-xs mt-1">
                                  Effect: {item.useEffect.charAt(0).toUpperCase() + item.useEffect.slice(1)}
                                  {item.value && ` (${item.value * 100}%)`}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      
                      {(tab === 'potions' && potions.length === 0) && (
                        <p className="text-sm text-lorequest-parchment/70 text-center py-4">No potions</p>
                      )}
                      {(tab === 'elixirs' && elixirs.length === 0) && (
                        <p className="text-sm text-lorequest-parchment/70 text-center py-4">No elixirs</p>
                      )}
                      {(tab === 'equipment' && equipment.length === 0) && (
                        <p className="text-sm text-lorequest-parchment/70 text-center py-4">No equipment</p>
                      )}
                      {(tab === 'other' && other.length === 0) && (
                        <p className="text-sm text-lorequest-parchment/70 text-center py-4">No other items</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-2 border-t border-lorequest-gold/20 text-xs text-right">
                <Button 
                  variant="link" 
                  className="text-xs text-lorequest-gold hover:text-lorequest-highlight"
                  onClick={() => setOpen(false)}
                >
                  Open Full Inventory
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default InventoryIcon;
