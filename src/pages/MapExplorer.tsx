
import React, { useEffect, useState } from 'react';
import { Location, UserLocation, ExplorationStats as StatsType } from '../types';
import MapComponent from '../components/MapComponent';
import ApiKeyInput from '../components/ApiKeyInput';
import ExplorationStats from '../components/ExplorationStats';
import DiscoveredLocationItem from '../components/DiscoveredLocationItem';
import { getCurrentPosition, watchPosition, clearPositionWatch } from '../utils/geoUtils';
import { loadDiscoveredLocations, addDiscoveredLocation } from '../utils/storageUtils';
import { Button } from '@/components/ui/button';
import { Compass, Scroll, Info, Sun, Moon } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// New imports for enhanced features
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthForms from '../components/AuthForms';
import UserProfile from '../components/UserProfile';
import UserDashboard from '../components/UserDashboard';
import { 
  getAllAchievements, 
  getAchievementById, 
  createTerritoryAchievement 
} from '../utils/achievementsUtils';
import { 
  updateAchievementsOnDiscovery,
  initializeAchievements 
} from '../utils/userAchievements';
import TutorialQuest from '../components/TutorialQuest';
import WalkingTracker from '../components/WalkingTracker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { addExperience } from '../utils/xpUtils';

const API_KEY_STORAGE_KEY = 'mapbox_api_key';
const DARK_MODE_STORAGE_KEY = 'lorequest_dark_mode';

const MapExplorerContent: React.FC = () => {
  const { isAuthenticated, user, updateCurrentUser } = useAuth();
  const [mapboxApiKey, setMapboxApiKey] = useState<string>('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [discoveredLocations, setDiscoveredLocations] = useState<Location[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
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
  
  // Load discovered locations, API key, and dark mode preference on mount
  useEffect(() => {
    const savedLocations = loadDiscoveredLocations();
    setDiscoveredLocations(savedLocations);
    
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
      setMapboxApiKey(savedApiKey);
    }
    
    const darkModePreference = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (darkModePreference) {
      setIsDarkMode(darkModePreference === 'true');
    }
    
    setIsLoading(false);
    
    // Fetch all locations from an API or local data source
    // This is a temporary solution, replace with actual location data source
    import('../utils/locationData').then(module => {
      if (module.locations) {
        setAllLocations(module.locations);
      }
    }).catch(error => {
      console.error('Failed to load location data:', error);
      setAllLocations([]);
    });
  }, []);
  
  // Show tutorial for new users
  useEffect(() => {
    if (isAuthenticated && user && !user.tutorialCompleted) {
      // Only show tutorial after a short delay to allow the UI to render
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  // Update user's discovered locations when they log in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize achievements if not already done
      let updatedUser = user;
      if (!user.achievements || user.achievements.length === 0) {
        updatedUser = initializeAchievements(user);
        updateCurrentUser(updatedUser);
      }
      
      // Sync discovered locations with user's discoveries
      if (discoveredLocations.length > 0) {
        const userDiscoveredIds = new Set(updatedUser.discoveredLocations);
        let hasNewDiscoveries = false;
        
        discoveredLocations.forEach(location => {
          if (!userDiscoveredIds.has(location.id)) {
            userDiscoveredIds.add(location.id);
            hasNewDiscoveries = true;
            
            // Update achievements for each newly discovered location
            updatedUser = updateAchievementsOnDiscovery(updatedUser, location, allLocations);
          }
        });
        
        if (hasNewDiscoveries) {
          updatedUser = {
            ...updatedUser,
            discoveredLocations: Array.from(userDiscoveredIds)
          };
          updateCurrentUser(updatedUser);
        }
      }
    }
  }, [isAuthenticated, user, discoveredLocations, allLocations]);
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    if (!user) return;
    
    setShowTutorial(false);
    
    // Start tracking location after tutorial completion
    if (mapboxApiKey) {
      startTracking();
    }
    
    toast.success('Tutorial completed! Begin your journey!');
  };
  
  // Handle API key submission
  const handleApiKeySubmit = (apiKey: string) => {
    setMapboxApiKey(apiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    
    // Start tracking location after API key is set
    startTracking();
    
    // Show tutorial for new users
    if (user && !user.tutorialCompleted) {
      setShowTutorial(true);
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, newDarkMode.toString());
  };
  
  // Handle location discovery
  const handleLocationDiscovered = (location: Location) => {
    const updatedLocations = addDiscoveredLocation(location);
    setDiscoveredLocations(updatedLocations);
    
    // Update user's discovered locations and achievements if logged in
    if (isAuthenticated && user) {
      // Check if location is already in user's discoveries
      if (!user.discoveredLocations.includes(location.id)) {
        const updatedUser = updateAchievementsOnDiscovery(
          {
            ...user,
            discoveredLocations: [...user.discoveredLocations, location.id]
          },
          location,
          allLocations
        );
        
        // Add extra XP for discovering a new location
        addExperience(updatedUser, 50, `Discovered ${location.name}`);
        
        updateCurrentUser(updatedUser);
      }
    }
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
  
  // Toggle dashboard
  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
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
  
  // If user is not authenticated, show login/signup form
  if (!isAuthenticated) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode 
        ? 'bg-lorequest-dark bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMTguNiAzMGgzLjJ2MmgtMy4yek0yMiAxM2EyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6bTAgMTZhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzJhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzBhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMCAxNmEyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6IiBmaWxsPSJyZ2JhKDIxMiwxNzUsNTUsMC4xKSIvPjwvc3ZnPg==\')]'
        : 'bg-parchment'} p-4`}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            {/* New logo and title */}
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/d8f21290-6154-4d2a-9768-6e62201ee8dd.png" 
                alt="Lore Quest Logo" 
                className="w-20 h-20"
              />
            </div>
            <h1 className="text-4xl font-bold text-lorequest-gold mb-2">LORE QUEST</h1>
            <div className="fantasy-divider mb-6"></div>
            <p className={`${isDarkMode ? 'text-lorequest-parchment' : 'text-gray-700'}`}>
              Create an account or sign in to begin your adventure
            </p>
          </div>
          <AuthForms />
          
          {/* Dark mode toggle for login screen */}
          <div className="mt-8 text-center">
            <button 
              onClick={toggleDarkMode}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isDarkMode 
                ? 'bg-lorequest-dark/50 text-lorequest-gold border border-lorequest-gold/30' 
                : 'bg-white/50 text-gray-700 border border-gray-300'}`}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // If no API key is set, show the input form with fantasy styling
  if (!mapboxApiKey) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode 
        ? 'bg-lorequest-dark bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMTguNiAzMGgzLjJ2MmgtMy4yek0yMiAxM2EyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6bTAgMTZhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzJhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMTQtMzBhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0em0wIDE2YTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNHptMCAxNmEyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDR6IiBmaWxsPSJyZ2JhKDIxMiwxNzUsNTUsMC4xKSIvPjwvc3ZnPg==\')]'
        : 'bg-parchment'} p-4`}>
        <div className={`max-w-md w-full p-6 ${isDarkMode 
          ? 'bg-lorequest-dark/90 backdrop-blur-md border border-lorequest-gold/30' 
          : 'bg-white/90 backdrop-blur-md border border-lorequest-gold/20'} rounded-lg shadow-2xl`}>
          <div className="text-center mb-6">
            {/* New logo and title */}
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/d8f21290-6154-4d2a-9768-6e62201ee8dd.png" 
                alt="Lore Quest Logo" 
                className="w-20 h-20"
              />
            </div>
            <h1 className="text-3xl font-bold text-lorequest-gold mb-2">LORE QUEST</h1>
            <div className="fantasy-divider mb-4"></div>
            <p className={`${isDarkMode ? 'text-lorequest-parchment' : 'text-gray-700'}`}>
              Welcome back, {user.name}! Begin your exploration of the realm
            </p>
          </div>
          <ApiKeyInput onSubmit={handleApiKeySubmit} />
          
          {/* Dark mode toggle for API key screen */}
          <div className="mt-8 text-center">
            <button 
              onClick={toggleDarkMode}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isDarkMode 
                ? 'bg-lorequest-dark/50 text-lorequest-gold border border-lorequest-gold/30' 
                : 'bg-white/50 text-gray-700 border border-gray-300'}`}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode 
      ? 'bg-lorequest-dark' 
      : 'bg-parchment'}`}>
      {/* Header with updated logo and styling */}
      <header className={`flex items-center justify-between p-4 ${isDarkMode 
        ? 'bg-lorequest-dark/80 backdrop-blur-sm border-b border-lorequest-gold/30' 
        : 'bg-white/80 backdrop-blur-sm border-b border-lorequest-gold/20'} z-10`}>
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/d8f21290-6154-4d2a-9768-6e62201ee8dd.png" 
            alt="Lore Quest Logo" 
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold text-lorequest-gold">LORE QUEST</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isTracking ? "destructive" : "default"}
                  onClick={toggleTracking}
                  size="sm"
                  className={isTracking 
                    ? "bg-red-700 hover:bg-red-800" 
                    : "bg-lorequest-gold text-lorequest-dark hover:bg-lorequest-highlight"}
                >
                  <Compass className="mr-1" size={16} />
                  {isTracking ? 'End Quest' : 'Begin Quest'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs max-w-xs">
                  {isTracking 
                    ? "Click to stop tracking your location" 
                    : "Click to start tracking your location and discover territories"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <UserProfile onToggleDashboard={toggleDashboard} />
        </div>
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
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>
        
        {/* Sidebar with fantasy styling */}
        <div className={`w-72 ${isDarkMode 
          ? 'bg-lorequest-dark/80 backdrop-blur-md border-l border-lorequest-gold/30' 
          : 'bg-white/80 backdrop-blur-md border-l border-lorequest-gold/20'} overflow-y-auto p-4 flex flex-col gap-4`}>
          {/* Stats panel */}
          <ExplorationStats stats={stats} />
          
          {/* Walking tracker */}
          <WalkingTracker />
          
          {/* Discovered locations by realm */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-lorequest-gold' : 'text-lorequest-gold'} flex items-center gap-2`}>
                <Scroll size={18} />
                Discovered Territories
              </h2>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-lorequest-gold hover:text-lorequest-highlight">
                      <Info size={16} />
                      <span className="sr-only">Info</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">
                      Territories are discovered when you venture within 0.5 miles of their location. Click on a territory to center the map on it.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {discoveredLocations.length === 0 ? (
              <div className={`${isDarkMode 
                ? 'bg-lorequest-dark/50 border border-dashed border-lorequest-gold/30' 
                : 'bg-white/50 border border-dashed border-lorequest-gold/20'} rounded-lg p-4 text-center`}>
                <p className={`text-sm ${isDarkMode ? 'text-lorequest-parchment' : 'text-gray-700'}`}>
                  No territories discovered yet. Begin your journey to uncover the mysteries of the United Kingdom and Ireland!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(locationsByRealm).map(([realm, locations]) => (
                  <div key={realm} className="space-y-2">
                    <h3 className={`text-sm ${isDarkMode 
                      ? 'text-lorequest-gold border-b border-lorequest-gold/20' 
                      : 'text-lorequest-gold border-b border-lorequest-gold/20'} font-medium pb-1`}>
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
          <div className={`text-xs ${isDarkMode 
            ? 'text-lorequest-muted border-t border-lorequest-gold/20' 
            : 'text-gray-500 border-t border-lorequest-gold/20'} mt-auto pt-4`}>
            <p className={`mb-2 ${isDarkMode ? 'text-lorequest-gold' : 'text-lorequest-gold'}`}><strong>How to Quest:</strong></p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Venture forth in the UK and Ireland to discover new territories</li>
              <li>Each country is a Realm containing mystical Territories</li>
              <li>Journey within 0.5 miles of a location to claim it</li>
              <li>Complete your map to become a legendary explorer</li>
            </ul>
            <div className="fantasy-divider my-3"></div>
            <p className={`text-center ${isDarkMode 
              ? 'text-lorequest-gold/60' 
              : 'text-lorequest-gold/70'} text-[10px]`}>REAL-WORLD ADVENTURES. LEGENDARY REWARDS.</p>
          </div>
        </div>
      </div>
      
      {/* User Dashboard (when open) */}
      {isDashboardOpen && <UserDashboard onClose={toggleDashboard} />}
      
      {/* Tutorial Quest */}
      {showTutorial && (
        <TutorialQuest onComplete={handleTutorialComplete} />
      )}
    </div>
  );
};

// Wrap the component with AuthProvider
const MapExplorer: React.FC = () => {
  return (
    <AuthProvider>
      <MapExplorerContent />
    </AuthProvider>
  );
};

export default MapExplorer;
