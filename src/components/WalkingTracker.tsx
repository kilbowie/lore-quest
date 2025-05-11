
import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../context/AuthContext';
import { addWalkingDistance, getUserWalkingData } from '../utils/xpUtils';
import { Button } from '@/components/ui/button';

interface WalkingTrackerProps {
  showDetails?: boolean;
  onWalkingProgress?: (distance: number) => void;
  tutorialMode?: boolean;
  tutorialTarget?: number;
}

const WalkingTracker: React.FC<WalkingTrackerProps> = ({ showDetails, onWalkingProgress, tutorialMode, tutorialTarget }) => {
  const { user, updateCurrentUser } = useAuth();
  const [walkingData, setWalkingData] = useState({
    totalDistanceKm: 0,
    earnedXP: 0,
  });
  const [simulatedDistance, setSimulatedDistance] = useState(0);
  
  useEffect(() => {
    if (user) {
      const data = getUserWalkingData(user.id);
      setWalkingData(data);
    }
  }, [user]);
  
  const handleSimulateWalking = () => {
    if (!user) return;
    
    const distance = 0.1; // Simulate 100 meters
    setSimulatedDistance(prev => prev + distance);
    
    // Update walking distance and award XP
    const updatedUser = addWalkingDistance(user, distance);
    updateCurrentUser(updatedUser);
    
    // Update walking data
    const data = getUserWalkingData(user.id);
    setWalkingData(data);
    
    // Notify parent component
    if (onWalkingProgress) {
      onWalkingProgress(distance);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-lorequest-gold" />
          <h4 className="text-sm font-medium text-lorequest-gold">
            Walking Tracker
          </h4>
        </div>
        <span className="text-xs text-lorequest-parchment">
          {walkingData.totalDistanceKm.toFixed(2)} km today
        </span>
      </div>
      
      <Progress 
        value={Math.min(100, walkingData.totalDistanceKm * 10)} 
        className="h-1.5"
      />
      
      {showDetails && (
        <div className="text-xs text-lorequest-parchment">
          Total Distance: {walkingData.totalDistanceKm.toFixed(2)} km | XP Earned: {walkingData.earnedXP}
        </div>
      )}
      
      {tutorialMode && (
        <div className="text-center text-lorequest-parchment text-sm">
          Simulated progress: {simulatedDistance.toFixed(2)} / {tutorialTarget?.toFixed(1)} km
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          variant="outline"
          size="sm"
          onClick={handleSimulateWalking}
          className="border-lorequest-gold/30 text-lorequest-gold"
        >
          Simulate Walk (100m)
        </Button>
      </div>
    </div>
  );
};

export default WalkingTracker;
