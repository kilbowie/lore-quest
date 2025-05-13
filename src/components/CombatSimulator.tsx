
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sword, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User } from '../types';
import { generateEnemy, checkEnergy, useEnergy, regenerateEnergy, formatNextEnergyRegen } from '../utils/enemyUtils';
import { toast } from '@/components/ui/sonner';
import BattleEncounter from './BattleEncounter';

interface CombatSimulatorProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const CombatSimulator: React.FC<CombatSimulatorProps> = ({ user, onUserUpdate }) => {
  const [showBattleDialog, setShowBattleDialog] = useState(false);

  // Check and regenerate energy when component loads
  React.useEffect(() => {
    const updatedUser = regenerateEnergy(user);
    if (updatedUser !== user) {
      onUserUpdate(updatedUser);
    }
  }, []);

  const startCombat = () => {
    // Check if player is dead
    if (user.isDead) {
      toast.error("You cannot enter combat while dead!");
      return;
    }
    
    // Check if player has energy
    if (!checkEnergy(user)) {
      toast.error("Not enough energy! Wait for regeneration or use energy potions.");
      return;
    }
    
    setShowBattleDialog(true);
  };

  const handleBattleClose = () => {
    setShowBattleDialog(false);
  };

  // Calculate time until next energy regeneration
  const nextEnergyRegen = formatNextEnergyRegen(user);

  return (
    <>
      <Card className="bg-lorequest-dark border-lorequest-gold/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lorequest-gold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="h-5 w-5" />
              Combat Arena
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400">{user.energy}</span>
              <span className="text-lorequest-parchment/50">/{user.maxEnergy}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lorequest-parchment text-sm">
              Test your combat skills against enemies. Each battle costs 1 energy.
            </p>
            
            {user.energy < user.maxEnergy && (
              <div className="text-xs text-lorequest-parchment/70 mb-2">
                Next energy in: {nextEnergyRegen}
              </div>
            )}
            
            <Button 
              onClick={startCombat} 
              disabled={user.energy <= 0 || user.isDead}
              className="w-full bg-lorequest-gold/80 hover:bg-lorequest-gold text-lorequest-dark"
            >
              Start Battle
            </Button>
            
            {user.isDead && (
              <div className="text-center text-red-500 text-sm mt-2">
                You are dead! Use a revival elixir to continue fighting.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Battle Dialog */}
      <Dialog open={showBattleDialog} onOpenChange={setShowBattleDialog}>
        <DialogContent className="sm:max-w-md bg-black border-lorequest-gold/40 p-0">
          <BattleEncounter
            user={user}
            onUserUpdate={onUserUpdate}
            onClose={handleBattleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CombatSimulator;
