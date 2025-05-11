
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
import { STORE_ITEMS, StoreItem } from '../types';
import { addItemToInventory, spendGold } from '../utils/xpUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Minus, Plus, BaggageClaim, Info } from 'lucide-react';

interface MerchantStoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MerchantStore: React.FC<MerchantStoreProps> = ({ open, onOpenChange }) => {
  const { user, updateCurrentUser } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    STORE_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );
  
  if (!user) return null;
  
  const handleBuy = (item: StoreItem) => {
    const quantity = quantities[item.id] || 1;
    const totalCost = item.goldCost * quantity;
    
    const [updatedUser, success] = spendGold(user, totalCost, `Purchased ${quantity} ${item.name}(s)`);
    
    if (success) {
      // Add item to inventory
      addItemToInventory(
        updatedUser,
        item.type,
        item.name,
        item.description,
        quantity,
        item.icon,
        item.useEffect,
        item.value
      );
      
      updateCurrentUser(updatedUser);
      
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
        
        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-4">
            {STORE_ITEMS.map((item) => (
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
                            `Restores ${item.value} ${item.useEffect} points when used.`
                          )}
                          {item.type === 'elixir' && item.useEffect === 'revival' && (
                            'Used automatically when you die to resurrect you immediately.'
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
