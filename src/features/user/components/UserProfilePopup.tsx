
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CharacterStats from '@/components/CharacterStats';
import Inventory from '@/features/inventory/components/Inventory';
import EquipItems from '@/features/inventory/components/EquipItems';
import { useItem } from '@/utils/combatEngine';

interface UserProfilePopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ isOpen, onOpenChange }) => {
  const { user, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  
  if (!user) return null;
  
  const handleItemUse = (itemId: string) => {
    if (!user) return;
    
    const item = user.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const updatedUser = useItem(user, itemId);
    updateCurrentUser(updatedUser);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-950/90 border border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost" 
            size="icon" 
            className="absolute right-0 top-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-lorequest-gold/50">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-lorequest-gold/20 text-lorequest-gold text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <DialogTitle className="text-xl text-lorequest-gold">{user.username}</DialogTitle>
              <p className="text-sm text-lorequest-parchment">Level {user.level} {user.playerClass}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-zinc-900/50">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="pt-4">
            <CharacterStats />
          </TabsContent>
          
          <TabsContent value="inventory" className="pt-4">
            <Inventory onUseItem={handleItemUse} />
          </TabsContent>
          
          <TabsContent value="equipment" className="pt-4">
            <EquipItems />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfilePopup;
