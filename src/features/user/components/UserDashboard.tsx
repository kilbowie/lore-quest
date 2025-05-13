
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from '@/components/Progress';
import { calculateLevelProgress } from '@/utils/xpUtils';
import { WalkingData } from '@/types';
import WalkingTracker from '@/features/exploration/components/WalkingTracker';
import TimedQuests from '@/features/quests/components/TimedQuests';
import CharacterStats from '@/components/CharacterStats';
import Inventory from '@/features/inventory/components/Inventory';
import { useItem } from '@/utils/combatEngine';
import { toast } from '@/components/ui/sonner';

const UserDashboard: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [showInventory, setShowInventory] = useState(false);
  
  if (!user) return null;

  const levelProgress = calculateLevelProgress(user);
  
  // Function to handle item usage
  const handleItemUse = (itemId: string) => {
    if (!user) return;
    
    const item = user.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    // Call the useItem function with the correct number of arguments
    const updatedUser = useItem(user, itemId);
    updateCurrentUser(updatedUser);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column */}
      <div className="space-y-4">
        <Card className="bg-zinc-950/50 text-zinc-100">
          <CardHeader>
            <CardTitle>Welcome, {user.username}!</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={levelProgress} />
            <p>Level: {user.level}</p>
            <p>Experience: {user.experience}</p>
          </CardContent>
        </Card>
        
        <CharacterStats />
        
        <WalkingTracker />
        
        <TimedQuests />
      </div>
      
      {/* Right Column */}
      <div className="space-y-4">
        <Card className="bg-zinc-950/50 text-zinc-100">
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowInventory(true)}>
              View Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Inventory Dialog */}
      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950/80 border">
          <DialogHeader>
            <DialogTitle>Inventory</DialogTitle>
          </DialogHeader>
          <Inventory onUseItem={handleItemUse} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
