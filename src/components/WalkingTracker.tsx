
import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../context/AuthContext';
import { getUserWalkingData, updateWalkingData, addExperience, updateUserStats, checkQuestProgress } from '../utils/xpUtils';
import { toast } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WalkingData } from '../types';
import { Button } from '@/components/ui/button';

interface WalkingTrackerProps {
  showDetails?: boolean;
  onWalkingProgress?: (distance: number) => void;
  tutorialMode?: boolean;
  tutorialTarget?: number;
}

const WalkingTracker: React.FC<WalkingTrackerProps> = ({ 
  showDetails = true, 
  onWalkingProgress, 
  tutorialMode = false,
  tutorialTarget = 1.0 
}) => {
  const { user, updateCurrentUser } = useAuth();
  const [walkingData, setWalkingData] = useState<WalkingData | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For tutorial mode, we might want a mock update button
  const [mockDistance, setMockDistance] = useState(0);
  
  useEffect(() => {
    if (user) {
      const data = getUserWalkingData(user.id);
      setWalkingData(data);
    }
  }, [user]);
  
  useEffect(() => {
    // Check if we have permission to access location
    if (navigator.geolocation && user && !tutorialMode) {
      // Start tracking automatically if the user is authenticated
      startTracking();
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);
  
  const startTracking = () => {
    if (!user || isTracking) return;
    
    // Clear any previous errors
    setError(null);
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (user) {
          const { walkingData: newData, xpGained, distanceAdded } = updateWalkingData(user.id, latitude, longitude);
          setWalkingData(newData);
          
          // Update progress for tutorial if needed
          if (onWalkingProgress) {
            onWalkingProgress(distanceAdded);
          }
          
          // Award XP if earned
          if (xpGained > 0) {
            const updatedUser = addExperience(user, xpGained, 'Walking');
            
            // Update walking stats
            updateUserStats(updatedUser, {
              distanceTravelled: distanceAdded,
              walkingXpEarned: xpGained
            });
            
            // Check if any quests were progressed by this walking
            checkQuestProgress(updatedUser, 'walk', distanceAdded);
            
            updateCurrentUser(updatedUser);
            
            toast.success(`Earned ${xpGained} XP from walking!`, {
              description: `You've walked enough to earn rewards.`
            });
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setError('Location permission denied. Please enable location services to track your walking progress.');
          toast.error('Location permission denied', {
            description: 'Please enable location services to track your walking progress.'
          });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setError('Location information is unavailable.');
        } else if (error.code === error.TIMEOUT) {
          setError('Location request timed out.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 27000 // 27 seconds
      }
    );
    
    setWatchId(id);
    setIsTracking(true);
  };
  
  // For tutorial mode, we can mock progress
  const mockWalkingProgress = () => {
    if (!user || !tutorialMode) return;
    
    const newMockDistance = Math.min(tutorialTarget, mockDistance + 0.1);
    setMockDistance(newMockDistance);
    
    if (onWalkingProgress) {
      onWalkingProgress(0.1);
    }
    
    if (newMockDistance >= tutorialTarget && !walkingData?.totalDistanceKm) {
      // Tutorial completed walking requirement
      toast.success('Walking goal reached!', {
        description: 'You have completed the walking requirement.'
      });
    }
  };
  
  if (!user) return null;
  
  // Use mock data for tutorial mode
  const displayData = tutorialMode ? {
    totalDistanceKm: mockDistance,
    earnedXP: Math.floor(mockDistance * 10)
  } : walkingData;
  
  if (!displayData) return null;
  
  // Calculate progress to next kilometer
  const kmProgress = Math.min(100, Math.round((tutorialMode ? mockDistance : displayData.totalDistanceKm) * 100 / tutorialTarget));
  
  return (
    <div className="bg-lorequest-gold/10 rounded-lg p-3 border border-lorequest-gold/30 mb-4">
      <div className="flex items-center justify-between mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-sm font-medium text-lorequest-gold flex items-center gap-1">
                <Activity size={16} className="text-lorequest-gold" />
                Walking XP
              </h3>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs max-w-xs">
                Earn 10 XP for each kilometer you walk. Your progress is tracked automatically.
                {tutorialMode && ' For the tutorial, you need to reach the target distance.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span className="text-xs text-lorequest-gold">
          {(tutorialMode ? mockDistance : displayData.totalDistanceKm).toFixed(2)} / {tutorialTarget.toFixed(2)} km
        </span>
      </div>
      
      <Progress value={kmProgress} className="h-1.5" />
      
      {showDetails && (
        <div className="mt-1 text-xs text-lorequest-parchment flex items-center justify-between">
          <span>Total XP earned: {tutorialMode ? Math.floor(mockDistance * 10) : displayData.earnedXP}</span>
          {tutorialMode ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={mockWalkingProgress}
              className="h-6 px-2 py-0 text-xs border-lorequest-gold/30 text-lorequest-gold bg-transparent"
            >
              Simulate Walking
            </Button>
          ) : isTracking ? (
            <span className="text-green-400 flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span> 
              Tracking
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startTracking}
              className="h-6 px-2 py-0 text-xs border-lorequest-gold/30 text-lorequest-gold bg-transparent"
            >
              Start Tracking
            </Button>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalkingTracker;
