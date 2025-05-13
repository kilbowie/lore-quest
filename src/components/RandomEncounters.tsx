
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sword } from 'lucide-react';
import BattleEncounter from './BattleEncounter';
import { checkRandomEncounter } from '../utils/enemyUtils';
import { Toast } from '@/components/ui/toast';
import { toast } from '@/components/ui/sonner';
import { regenerateEnergy } from '../utils/enemyUtils';

interface RandomEncountersProps {
  distanceTraveled: number;
}

const RandomEncounters: React.FC<RandomEncountersProps> = ({ distanceTraveled }) => {
  const { user, setUser } = useAuth();
  const [showEncounterAlert, setShowEncounterAlert] = useState(false);
  const [showBattleDialog, setShowBattleDialog] = useState(false);
  const [lastCheckedDistance, setLastCheckedDistance] = useState(0);
  const [encounterDistanceThreshold] = useState(500); // Check every 500 meters

  useEffect(() => {
    // Check for energy regeneration when component mounts
    if (user) {
      const updatedUser = regenerateEnergy(user);
      if (updatedUser !== user) {
        setUser(updatedUser);
      }
    }
  }, []);

  useEffect(() => {
    // Only check when we've traveled at least the threshold distance
    if (!user || !distanceTraveled || user.isDead) return;
    
    // Calculate distance since last check
    const distanceSinceLastCheck = distanceTraveled - lastCheckedDistance;
    
    if (distanceSinceLastCheck >= encounterDistanceThreshold) {
      // Reset the last checked distance
      setLastCheckedDistance(distanceTraveled);
      
      // Check for random encounter
      if (checkRandomEncounter(distanceSinceLastCheck) && user.energy > 0) {
        setShowEncounterAlert(true);
        
        // Auto-dismiss after 10 seconds if no action taken
        setTimeout(() => {
          setShowEncounterAlert(false);
        }, 10000);
      }
    }
  }, [distanceTraveled, user, lastCheckedDistance]);

  const handleEncounterAccept = () => {
    setShowEncounterAlert(false);
    setShowBattleDialog(true);
  };

  const handleEncounterDecline = () => {
    setShowEncounterAlert(false);
    toast.info("You avoided the encounter");
  };

  const handleBattleClose = () => {
    setShowBattleDialog(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Random Encounter Alert */}
      {showEncounterAlert && (
        <div className="fixed inset-x-0 bottom-0 mb-4 mx-auto max-w-sm px-4 z-50">
          <Alert className="bg-black/90 border-red-400 animate-bounce">
            <Sword className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-red-400">Encounter!</AlertTitle>
            <AlertDescription className="text-gray-300">
              A hostile creature appears in your path!
            </AlertDescription>
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                size="sm"
                variant="outline" 
                className="text-gray-300 border-gray-600 hover:bg-gray-800"
                onClick={handleEncounterDecline}
              >
                Avoid
              </Button>
              <Button 
                size="sm"
                onClick={handleEncounterAccept}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Fight!
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Battle Dialog */}
      <Dialog open={showBattleDialog} onOpenChange={setShowBattleDialog}>
        <DialogContent className="sm:max-w-md bg-black border-lorequest-gold/40 p-0">
          <BattleEncounter
            user={user}
            onUserUpdate={setUser}
            onClose={handleBattleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RandomEncounters;
