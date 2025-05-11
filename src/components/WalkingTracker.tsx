
import React, { useEffect, useState } from 'react';
import { Walking } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../context/AuthContext';
import { getUserWalkingData, updateWalkingData, addExperience } from '../utils/xpUtils';
import { toast } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WalkingData } from '../types';

const WalkingTracker: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [walkingData, setWalkingData] = useState<WalkingData | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  useEffect(() => {
    if (user) {
      const data = getUserWalkingData(user.id);
      setWalkingData(data);
    }
  }, [user]);
  
  useEffect(() => {
    // Check if we have permission to access location
    if (navigator.geolocation && user) {
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
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (user) {
          const { walkingData: newData, xpGained } = updateWalkingData(user.id, latitude, longitude);
          setWalkingData(newData);
          
          // Award XP if earned
          if (xpGained > 0) {
            const updatedUser = addExperience(user, xpGained, 'Walking');
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
          toast.error('Location permission denied', {
            description: 'Please enable location services to track your walking progress.'
          });
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
  
  if (!user || !walkingData) return null;
  
  // Calculate progress to next kilometer
  const kmProgress = Math.min(100, Math.round(walkingData.totalDistanceKm * 100));
  
  return (
    <div className="bg-lorequest-gold/10 rounded-lg p-3 border border-lorequest-gold/30 mb-4">
      <div className="flex items-center justify-between mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="text-sm font-medium text-lorequest-gold flex items-center gap-1">
                <Walking size={16} className="text-lorequest-gold" />
                Walking XP
              </h3>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs max-w-xs">
                Earn 10 XP for each kilometer you walk. Your progress is tracked automatically.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span className="text-xs text-lorequest-gold">
          {walkingData.totalDistanceKm.toFixed(2)} / 1.00 km
        </span>
      </div>
      
      <Progress value={kmProgress} className="h-1.5" />
      
      <div className="mt-1 text-xs text-lorequest-parchment flex items-center justify-between">
        <span>Total XP earned: {walkingData.earnedXP}</span>
        {isTracking ? (
          <span className="text-green-400 flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span> 
            Tracking
          </span>
        ) : (
          <span className="text-yellow-400">Not tracking</span>
        )}
      </div>
    </div>
  );
};

export default WalkingTracker;
