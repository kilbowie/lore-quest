
import React, { useEffect, useState } from 'react';
import { Location, UserLocation, ExplorationStats as StatsType } from '../types';
import MapComponent from '../components/MapComponent';
import ApiKeyInput from '../components/ApiKeyInput';
import ExplorationStats from '../components/ExplorationStats';
import DiscoveredLocationItem from '../components/DiscoveredLocationItem';
import { getCurrentPosition, watchPosition, clearPositionWatch } from '../utils/geoUtils';
import { loadDiscoveredLocations, addDiscoveredLocation } from '../utils/storageUtils';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const API_KEY_STORAGE_KEY = 'mapbox_api_key';

const MapExplorer: React.FC = () => {
  const [mapboxApiKey, setMapboxApiKey] = useState<string>('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [discoveredLocations, setDiscoveredLocations] = useState<Location[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Total number of locations (in a real app would come from API)
  const totalLocations = 5;
  
  // Calculate exploration stats
  const stats: StatsType = {
    totalLocations,
    discoveredLocations: discoveredLocations.length,
    percentExplored: (discoveredLocations.length / totalLocations) * 100
  };
  
  // Load discovered locations and API key on mount
  useEffect(() => {
    const savedLocations = loadDiscoveredLocations();
    setDiscoveredLocations(savedLocations);
    
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      setMapboxApiKey(savedApiKey);
    }
    
    setIsLoading(false);
  }, []);
  
  // Handle API key submission
  const handleApiKeySubmit = (apiKey: string) => {
    setMapboxApiKey(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    
    // Start tracking location after API key is set
    startTracking();
  };
  
  // Handle location discovery
  const handleLocationDiscovered = (location: Location) => {
    const updatedLocations = addDiscoveredLocation(location);
    setDiscoveredLocations(updatedLocations);
  };
  
  // Start tracking user location
  const startTracking = async () => {
    if (isTracking) return;
    
    try {
      // Get initial position
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;
      
      setUserLocation({
        latitude,
        longitude,
        accuracy
      });
      
      // Start watching position
      const id = watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          setUserLocation({
            latitude,
            longitude,
            accuracy
          });
        },
        (error) => {
          console.error('Error watching position:', error);
          toast.error('Failed to track location', {
            description: error.message
          });
          setIsTracking(false);
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      
    } catch (error) {
      console.error('Error getting position:', error);
      toast.error('Failed to get your location', {
        description: 'Please ensure location permissions are granted'
      });
    }
  };
  
  // Stop tracking user location
  const stopTracking = () => {
    if (watchId) {
      clearPositionWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };
  
  // Toggle tracking
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        clearPositionWatch(watchId);
      }
    };
  }, [watchId]);
  
  // Center map on a specific location
  const centerOnLocation = (location: Location) => {
    if (!userLocation) return;
    
    setUserLocation({
      ...userLocation,
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    toast(`Centering map on ${location.name}`);
  };
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // If no API key is set, show the input form
  if (!mapboxApiKey) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-card/80 backdrop-blur-sm z-10 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Navigation className="text-explorer-primary" size={24} />
          Fog Explorer
        </h1>
        
        <Button
          variant={isTracking ? "destructive" : "default"}
          onClick={toggleTracking}
          size="sm"
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map container */}
        <div className="flex-1 relative">
          <MapComponent
            userLocation={userLocation}
            discoveredLocations={discoveredLocations}
            onLocationDiscovered={handleLocationDiscovered}
            apiKey={mapboxApiKey}
          />
        </div>
        
        {/* Sidebar */}
        <div className="w-72 bg-card/80 backdrop-blur-md border-l overflow-y-auto p-4 flex flex-col gap-4">
          {/* Stats panel */}
          <ExplorationStats stats={stats} />
          
          {/* Discovered locations */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-2">Discovered Areas</h2>
            {discoveredLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No locations discovered yet. Start exploring!
              </p>
            ) : (
              <div className="grid gap-2">
                {discoveredLocations.map((location) => (
                  <DiscoveredLocationItem
                    key={location.id}
                    location={location}
                    onClick={() => centerOnLocation(location)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Help text */}
          <div className="text-xs text-muted-foreground mt-auto pt-4 border-t">
            <p className="mb-2"><strong>How to play:</strong></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Visit locations in real life to unlock them on the map</li>
              <li>Discovered areas stay unlocked permanently</li>
              <li>Get within 0.5 miles of a city center to unlock it</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
