import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Map } from 'lucide-react';
import { calculateDistance } from '../utils/geoUtils';
import { useAuth } from '../context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { WalkingData } from '../types';
import { Progress } from '@/components/ui/progress';
import { awardWalkingXp } from '../utils/xpUtils';
import RandomEncounters from './RandomEncounters';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  timestamp: number | null;
}

const WalkingTracker: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [walkingData, setWalkingData] = useState<WalkingData | null>(null);
  const [lastPosition, setLastPosition] = useState<LocationData>({
    latitude: null,
    longitude: null,
    timestamp: null,
  });
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [lastXpAwardDate, setLastXpAwardDate] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const walkingXpAwardInterval = 1; // Award XP every 1 km

  const startTracking = useCallback(() => {
    setIsTracking(true);
    setTotalDistanceKm(0);
    setEarnedXP(0);
    setLastXpAwardDate(walkingData?.lastXpAwardDate || null);

    if (navigator.geolocation) {
      const success = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        const timestamp = position.timestamp;

        if (lastPosition.latitude !== null && lastPosition.longitude !== null && lastPosition.timestamp !== null) {
          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            latitude,
            longitude
          );

          setTotalDistanceKm((prevDistance) => prevDistance + distance);

          // Award XP every 1 km
          if (Math.floor(totalDistanceKm) < Math.floor(totalDistanceKm + distance)) {
            if (user) {
              const { updatedUser, xpAwarded } = awardWalkingXp(user, walkingXpAwardInterval);
              updateUser(updatedUser);
              setEarnedXP(xpAwarded);
              setLastXpAwardDate(new Date().toISOString().split('T')[0]);
            }
          }
        }

        setLastPosition({ latitude, longitude, timestamp });
      };

      const error = () => {
        toast.error('Unable to retrieve your location.');
      };

      const options = {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000,
      };

      watchId.current = navigator.geolocation.watchPosition(success, error, options);
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  }, [lastPosition, totalDistanceKm, updateUser, user, walkingXpAwardInterval]);

  const stopTracking = () => {
    setIsTracking(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  };

  useEffect(() => {
    // Load walking data from local storage on component mount
    const storedWalkingData = localStorage.getItem('walkingData');
    if (storedWalkingData) {
      setWalkingData(JSON.parse(storedWalkingData));
    }
  }, []);

  useEffect(() => {
    // Save walking data to local storage whenever it changes
    localStorage.setItem('walkingData', JSON.stringify({
      totalDistanceKm,
      earnedXP,
      lastXpAwardDate,
    }));
  }, [totalDistanceKm, earnedXP, lastXpAwardDate]);

  return (
    <>
      <Card className="bg-zinc-950/50 text-zinc-100">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="mr-2 h-4 w-4" /> Walking Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {isTracking ? (
              <>
                <p className="text-sm">Tracking your walk...</p>
                <p className="text-sm">Distance: {totalDistanceKm.toFixed(2)} km</p>
                <p className="text-sm">XP Earned: {earnedXP}</p>
                {lastXpAwardDate && <p className="text-sm">Last XP Award: {lastXpAwardDate}</p>}
                <Progress value={(totalDistanceKm % 1) * 100} />
              </>
            ) : (
              <p className="text-sm">Start tracking your walk to earn rewards!</p>
            )}
          </div>
          <Button onClick={isTracking ? stopTracking : startTracking}>
            {isTracking ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Tracking
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Add random encounters component */}
      {isTracking && walkingData && (
        <RandomEncounters distanceTraveled={totalDistanceKm * 1000} />
      )}
    </>
  );
};

export default WalkingTracker;
