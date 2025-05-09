
import React, { useEffect, useState } from 'react';
import { Location, UserLocation, ExplorationStats as StatsType } from '../types';
import MapComponent from '../components/MapComponent';
import ApiKeyInput from '../components/ApiKeyInput';
import ExplorationStats from '../components/ExplorationStats';
import DiscoveredLocationItem from '../components/DiscoveredLocationItem';
import { getCurrentPosition, watchPosition, clearPositionWatch } from '../utils/geoUtils';
import { loadDiscoveredLocations, addDiscoveredLocation } from '../utils/storageUtils';
import { Button } from '@/components/ui/button';
import { Compass, Map, Scroll } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const API_KEY_STORAGE_KEY = 'mapbox_api_key';

const MapExplorer: React.FC = () => {
  const [mapboxApiKey, setMapboxApiKey] = useState<string>('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [discoveredLocations, setDiscoveredLocations] = useState<Location[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Total number of locations (updated to include Ireland)
  const totalLocations = 90; // Updated to include all 76 UK locations plus 14 Irish locations
  const totalRealms = 5;    // England, Scotland, Wales, Northern Ireland, and Ireland
  const totalContinents = 2; // UK and Ireland
  
  // Calculate all discovered realms
  const discoveredRealms = discoveredLocations.length > 0 
    ? [...new Set(discoveredLocations.map(loc => loc.realm))].length 
    : 0;
  
  // Calculate discovered continents (UK and/or Ireland)
  const discoveredContinents = discoveredLocations.length > 0 
    ? [...new Set(discoveredLocations.map(loc => loc.continent || 'UK'))].length 
    : 0;
  
  // Calculate exploration stats
  const stats: StatsType = {
    totalLocations,
    discoveredLocations: discoveredLocations.length,
    percentExplored: (discoveredLocations.length / totalLocations) * 100,
    totalRealms,
    discoveredRealms,
    totalContinents,
    discoveredContinents
  };
  
  // Group locations by realm (UK countries and Ireland)
  const locationsByRealm = discoveredLocations.reduce((acc, location) => {
    if (!acc[location.realm]) {
      acc[location.realm] = [];
    }
    acc[location.realm].push(location);
    return acc;
  }, {} as Record<string, Location[]>);
  
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
    return (
      <div className="flex h-screen items-center justify-center bg-lorequest-dark">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-lorequest-dark border-2 border-t-lorequest-gold animate-spin mx-auto mb-4"></div>
          <p className="text-lorequest-gold font-bold">Loading your quest map...</p>
        </div>
      </div>
    );
  }
  
  // If no API key is set, show the input form with fantasy styling
  if (!mapboxApiKey) {
    return (
      <div className="h-screen flex items-center justify-center bg-lorequest-dark bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMTguNiAzMGgzLjJ2MmgtMy4yek0yMiAxM2EyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6bTAgMTZhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzJhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzBhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMCAxNmEyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6IiBmaWxsPSJyZ2JhKDIxMiwxNzUsNTUsMC4xKSIvPjwvc3ZnPg==')] p-4">
        <div className="max-w-md w-full p-6 bg-lorequest-dark/90 backdrop-blur-md border border-lorequest-gold/30 rounded-lg shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-lorequest-gold mb-2">LORE QUEST</h1>
            <div className="fantasy-divider mb-4"></div>
            <p className="text-lorequest-parchment">Begin your exploration of the realm</p>
          </div>
          <ApiKeyInput onSubmit={handleApiKeySubmit} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-lorequest-dark">
      {/* Header with fantasy styling */}
      <header className="flex items-center justify-between p-4 bg-lorequest-dark/80 backdrop-blur-sm z-10 border-b border-lorequest-gold/30">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-lorequest-gold">
          <Map className="text-lorequest-gold" size={24} />
          LORE QUEST UK & IRELAND
        </h1>
        
        <Button
          variant={isTracking ? "destructive" : "default"}
          onClick={toggleTracking}
          size="sm"
          className={isTracking ? "bg-red-700 hover:bg-red-800" : "bg-lorequest-gold text-lorequest-dark hover:bg-lorequest-highlight"}
        >
          <Compass className="mr-1" size={16} />
          {isTracking ? 'End Journey' : 'Begin Journey'}
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
        
        {/* Sidebar with fantasy styling */}
        <div className="w-72 bg-lorequest-dark/80 backdrop-blur-md border-l border-lorequest-gold/30 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Stats panel */}
          <ExplorationStats stats={stats} />
          
          {/* Discovered locations by realm */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-3 text-lorequest-gold flex items-center gap-2">
              <Scroll size={18} />
              Discovered Territories
            </h2>
            
            {discoveredLocations.length === 0 ? (
              <div className="bg-lorequest-dark/50 border border-dashed border-lorequest-gold/30 rounded-lg p-4 text-center">
                <p className="text-sm text-lorequest-parchment">
                  No territories discovered yet. Begin your journey to uncover the mysteries of the United Kingdom and Ireland!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(locationsByRealm).map(([realm, locations]) => (
                  <div key={realm} className="space-y-2">
                    <h3 className="text-sm text-lorequest-gold font-medium border-b border-lorequest-gold/20 pb-1">
                      Realm of {realm}
                    </h3>
                    <div className="grid gap-2">
                      {locations.map((location) => (
                        <DiscoveredLocationItem
                          key={location.id}
                          location={location}
                          onClick={() => centerOnLocation(location)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Help text with fantasy styling */}
          <div className="text-xs text-lorequest-muted mt-auto pt-4 border-t border-lorequest-gold/20">
            <p className="mb-2 text-lorequest-gold"><strong>How to Quest:</strong></p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Venture forth in the UK and Ireland to discover new territories</li>
              <li>Each country is a Realm containing mystical Territories</li>
              <li>Journey within 0.5 miles of a location to claim it</li>
              <li>Complete your map to become a legendary explorer</li>
            </ul>
            <div className="fantasy-divider my-3"></div>
            <p className="text-center text-lorequest-gold/60 text-[10px]">REAL-WORLD ADVENTURES. LEGENDARY REWARDS.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
