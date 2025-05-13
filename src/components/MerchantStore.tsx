
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { ItemType, StoreItem } from '../types';
import { addItemToInventory, spendGold } from '../utils/xpUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Minus, Plus, BaggageClaim, Info, Sparkles } from 'lucide-react';

// Define updated store items with 50% and 100% recovery
const UPDATED_STORE_ITEMS: StoreItem[] = [
  {
    id: 'health-potion',
    name: 'Health Potion',
    description: 'Restores 50% of your maximum health',
    goldCost: 50,
    type: 'potion',
    useEffect: 'health',
    value: 0.5, // 50% of max
    icon: '❤️'
  },
  {
    id: 'mana-potion',
    name: 'Mana Potion',
    description: 'Restores 50% of your maximum mana',
    goldCost: 50,
    type: 'potion',
    useEffect: 'mana',
    value: 0.5, // 50% of max
    icon: '🔵'
  },
  {
    id: 'stamina-potion',
    name: 'Stamina Potion',
    description: 'Restores 50% of your maximum stamina',
    goldCost: 50,
    type: 'potion',
    useEffect: 'stamina',
    value: 0.5, // 50% of max
    icon: '⚡'
  },
  {
    id: 'revival-elixir',
    name: 'Revival Elixir',
    description: 'Automatically revives you with 50% of all stats if you fall in battle',
    goldCost: 200,
    type: 'elixir',
    useEffect: 'revival',
    value: 0.5, // 50% of max
    icon: '✨'
  },
  // Ultra versions (100% recovery)
  {
    id: 'ultra-health-potion',
    name: 'Ultra Health Potion',
    description: 'Restores 100% of your maximum health',
    goldCost: 150,
    type: 'potion',
    useEffect: 'health',
    value: 1.0, // 100% of max
    icon: '❤️+'
  },
  {
    id: 'ultra-mana-potion',
    name: 'Ultra Mana Potion',
    description: 'Restores 100% of your maximum mana',
    goldCost: 150,
    type: 'potion',
    useEffect: 'mana',
    value: 1.0, // 100% of max
    icon: '🔵+'
  },
  {
    id: 'ultra-stamina-potion',
    name: 'Ultra Stamina Potion',
    description: 'Restores 100% of your maximum stamina',
    goldCost: 150,
    type: 'potion',
    useEffect: 'stamina',
    value: 1.0, // 100% of max
    icon: '⚡+'
  },
  {
    id: 'ultra-revival-elixir',
    name: 'Ultra Revival Elixir',
    description: 'Automatically revives you with 100% of all stats if you fall in battle',
    goldCost: 500,
    type: 'elixir',
    useEffect: 'revival',
    value: 1.0, // 100% of max
    icon: '✨+'
  }
];

interface MerchantStoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MerchantStore: React.FC<MerchantStoreProps> = ({ open, onOpenChange }) => {
  const { user, updateCurrentUser } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    UPDATED_STORE_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );
  
  if (!user) return null;
  
  const handleBuy = (item: StoreItem) => {
    const quantity = quantities[item.id] || 1;
    const totalCost = item.goldCost * quantity;
    
    const updatedUser = spendGold(user, totalCost, `Purchased ${quantity} ${item.name}(s)`);
    const success = updatedUser !== user;
    
    if (success) {
      // Add item to inventory
      const userWithItem = addItemToInventory(
        updatedUser,
        item.type,
        item.name,
        item.description,
        quantity,
        item.icon,
        item.useEffect,
        item.value
      );
      
      updateCurrentUser(userWithItem);
      
      // Reset quantity
      setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    }
  };
  
  const updateQuantity = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const currentQty = prev[itemId] || 1;
      const newQty = Math.max(1, Math.min(99, currentQty + delta));
      return { ...prev, [itemId]: newQty };
    });
  };
  
  const getItemTotal = (item: StoreItem) => {
    const quantity = quantities[item.id] || 1;
    return item.goldCost * quantity;
  };
  
  const canAfford = (item: StoreItem) => {
    const totalCost = getItemTotal(item);
    return (user.gold || 0) >= totalCost;
  };
  
  // Group items by type (regular vs ultra)
  const regularItems = UPDATED_STORE_ITEMS.filter(item => !item.id.startsWith('ultra'));
  const ultraItems = UPDATED_STORE_ITEMS.filter(item => item.id.startsWith('ultra'));
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-lorequest-dark border-lorequest-gold/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lorequest-gold flex items-center gap-2">
            <BaggageClaim className="text-lorequest-gold" />
            Merchant Shop
          </DialogTitle>
          <DialogDescription className="text-lorequest-parchment flex items-center justify-between">
            <span>Purchase items to aid you on your journey</span>
            <span className="text-lorequest-gold font-medium">Gold: {user.gold || 0}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Regular Items Section */}
          <div>
            <h3 className="text-lorequest-gold text-lg font-medium mb-3">Standard Items</h3>
            <div className="grid grid-cols-1 gap-4">
              {regularItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-lorequest-gold/10 rounded-lg p-4 border ${
                    canAfford(item) ? 'border-lorequest-gold/30' : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{item.icon}</div>
                      <div>
                        <h3 className="text-lg font-medium text-lorequest-gold">{item.name}</h3>
                        <p className="text-sm text-lorequest-parchment">{item.description}</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full"
                          >
                            <Info size={15} className="text-lorequest-parchment/70" />
                            <span className="sr-only">Item info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">
                            {item.type === 'potion' && (
                              `Restores ${item.value * 100}% of your maximum ${item.useEffect} when used.`
                            )}
                            {item.type === 'elixir' && item.useEffect === 'revival' && (
                              `Used automatically when you die to resurrect you with ${item.value * 100}% of all stats.`
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-lorequest-gold/30"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-lorequest-gold">{quantities[item.id] || 1}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-lorequest-gold/30"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-lorequest-gold text-sm font-medium">
                        {getItemTotal(item)} Gold
                      </span>
                      <Button
                        variant={canAfford(item) ? "default" : "outline"}
                        className={
                          canAfford(item) 
                            ? "bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark"
                            : "border-red-500/50 text-red-400"
                        }
                        size="sm"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford(item)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ultra Items Section */}
          <div>
            <h3 className="text-lorequest-gold text-lg font-medium mb-3 flex items-center gap-1">
              <Sparkles size={16} className="text-amber-400" />
              Ultra Items
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {ultraItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-lorequest-highlight/10 rounded-lg p-4 border ${
                    canAfford(item) ? 'border-amber-500/30' : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{item.icon}</div>
                      <div>
                        <h3 className="text-lg font-medium text-amber-400">{item.name}</h3>
                        <p className="text-sm text-lorequest-parchment">{item.description}</p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full"
                          >
                            <Info size={15} className="text-lorequest-parchment/70" />
                            <span className="sr-only">Item info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">
                            {item.type === 'potion' && (
                              `Restores ${item.value * 100}% of your maximum ${item.useEffect} when used.`
                            )}
                            {item.type === 'elixir' && item.useEffect === 'revival' && (
                              `Used automatically when you die to resurrect you with ${item.value * 100}% of all stats.`
                            )}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-amber-500/30"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-amber-400">{quantities[item.id] || 1}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-amber-500/30"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-amber-400 text-sm font-medium">
                        {getItemTotal(item)} Gold
                      </span>
                      <Button
                        variant={canAfford(item) ? "default" : "outline"}
                        className={
                          canAfford(item) 
                            ? "bg-amber-500 hover:bg-amber-600 text-black"
                            : "border-red-500/50 text-red-400"
                        }
                        size="sm"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford(item)}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              className="border-lorequest-gold/30 text-lorequest-parchment"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantStore;
