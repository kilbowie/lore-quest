
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface WalkingTrackerProps {
  onClose?: () => void;
  onComplete?: () => void;
  showDetails?: boolean;
  tutorialMode?: boolean;
  tutorialTarget?: number;
  onWalkingProgress?: (distanceAdded: number) => void;
}

const WalkingTracker: React.FC<WalkingTrackerProps> = ({
  onClose,
  onComplete,
  showDetails = true,
  tutorialMode = false,
  tutorialTarget = 100,
  onWalkingProgress
}) => {
  const [distance, setDistance] = useState<number>(0);
  const { user } = useAuth();
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Simulate walking progress - for testing purposes
  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(() => {
      const distanceAdded = Math.random() * 5 + 1;
      setDistance(prev => {
        const newDistance = prev + distanceAdded;
        if (onWalkingProgress) {
          onWalkingProgress(distanceAdded);
        }
        return newDistance;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isSimulating, onWalkingProgress]);

  // Toggle simulation
  const toggleSimulation = () => {
    setIsSimulating(prev => !prev);
  };

  // Update the UI
  return (
    <Card className="bg-zinc-950 border border-zinc-800 text-zinc-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lorequest-gold">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Walking Quest
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Distance walked:</span>
          <span className="font-medium">{distance.toFixed(2)} meters</span>
        </div>
        
        <div className="w-full bg-zinc-800 rounded-full h-2.5">
          <div 
            className="bg-lorequest-gold h-2.5 rounded-full" 
            style={{ width: `${Math.min(distance / (tutorialMode ? tutorialTarget : 100) * 100, 100)}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-zinc-400">
          Walk at least {tutorialMode ? tutorialTarget : 100} meters to earn rewards
        </p>
        
        {/* Debug/Developer option to simulate walking */}
        <Button 
          variant={isSimulating ? "destructive" : "outline"} 
          size="sm" 
          onClick={toggleSimulation}
          className="w-full mt-2"
        >
          {isSimulating ? "Stop Simulation" : "Simulate Walking"}
        </Button>
        
        {showDetails && (
          <div className="flex gap-2 pt-2">
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
            
            {onComplete && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={onComplete} 
                disabled={distance < (tutorialMode ? tutorialTarget : 100)}
              >
                Claim Reward
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalkingTracker;
