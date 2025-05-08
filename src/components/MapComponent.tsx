
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location, UserLocation } from '../types';
import { calculateDistance } from '../utils/geoUtils';
import { toast } from '@/components/ui/sonner';

interface MapComponentProps {
  userLocation: UserLocation | null;
  discoveredLocations: Location[];
  onLocationDiscovered: (location: Location) => void;
  apiKey: string;
}

const DISCOVERY_THRESHOLD = 0.5; // miles

const MapComponent: React.FC<MapComponentProps> = ({ 
  userLocation, 
  discoveredLocations, 
  onLocationDiscovered, 
  apiKey 
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  
  // Sample city locations for demonstration - normally would fetch from API
  const cityLocations: Location[] = [
    {
      id: '1',
      name: 'Boston',
      latitude: 42.3601,
      longitude: -71.0589,
      radius: 2,
      discovered: false
    },
    {
      id: '2',
      name: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 3,
      discovered: false
    },
    {
      id: '3',
      name: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 2,
      discovered: false
    },
    {
      id: '4',
      name: 'Chicago',
      latitude: 41.8781,
      longitude: -87.6298,
      radius: 2.5,
      discovered: false
    },
    {
      id: '5',
      name: 'Los Angeles',
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 3,
      discovered: false
    }
  ];

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      if (!apiKey) {
        console.error("Mapbox API key is required");
        return;
      }
      
      mapboxgl.accessToken = apiKey;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-98.5795, 39.8283], // US center
        zoom: userLocation ? 10 : 3,
        pitch: 45,
        attributionControl: false
      });

      map.current.on('load', () => {
        if (!map.current) return;
        
        // Add fog effect
        map.current.setFog({
          'color': 'rgb(186, 210, 235)', 
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
        
        // Add city markers for all locations
        cityLocations.forEach(city => {
          const isDiscovered = discoveredLocations.some(loc => loc.id === city.id);
          
          // Create a marker element
          const el = document.createElement('div');
          el.className = `h-4 w-4 rounded-full ${isDiscovered ? 'bg-explorer-discovered' : 'bg-explorer-accent opacity-50'}`;
          if (isDiscovered) {
            el.classList.add('animate-pulse-glow');
          }
          
          // Add the marker to the map
          new mapboxgl.Marker(el)
            .setLngLat([city.longitude, city.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <h3 class="font-bold text-sm">${city.name}</h3>
                  <p class="text-xs">${isDiscovered ? 'Discovered' : 'Undiscovered'}</p>
                `)
            )
            .addTo(map.current);
        });
        
        // Add user position marker if available
        if (userLocation) {
          const el = document.createElement('div');
          el.className = 'h-6 w-6 bg-explorer-primary rounded-full border-2 border-white shadow-lg';
          
          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .addTo(map.current);
        }
        
        setIsMapInitialized(true);
      });

      // Navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey]);

  // Update user position and check for discoveries
  useEffect(() => {
    if (!map.current || !isMapInitialized || !userLocation) return;

    // Update user marker position
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    } else {
      const el = document.createElement('div');
      el.className = 'h-6 w-6 bg-explorer-primary rounded-full border-2 border-white shadow-lg';
      
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }

    // Center map on user
    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      essential: true,
      zoom: 12
    });

    // Check for new discoveries
    cityLocations.forEach(city => {
      // Skip already discovered locations
      if (discoveredLocations.some(loc => loc.id === city.id)) {
        return;
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        city.latitude,
        city.longitude
      );
      
      if (distance <= DISCOVERY_THRESHOLD) {
        onLocationDiscovered({...city, discovered: true});
        
        toast(`🎉 Discovered ${city.name}!`, {
          description: "This area is now permanently unlocked.",
          duration: 5000
        });
      }
    });
  }, [userLocation, isMapInitialized, discoveredLocations, onLocationDiscovered]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div ref={mapContainer} className="map-container" />
      
      {/* Fog of War overlay with cutouts for discovered areas */}
      {isMapInitialized && (
        <div className="fog-of-war">
          {discoveredLocations.map(location => (
            <div 
              key={location.id} 
              className="absolute rounded-full discovered-area"
              style={{
                width: `${location.radius * 40}vw`,
                height: `${location.radius * 40}vw`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'transparent',
                boxShadow: '0 0 0 100vmax rgba(26, 31, 44, 0.6)',
                clipPath: 'circle(50%)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
