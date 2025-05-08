
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location, UserLocation } from '../types';
import { calculateDistance } from '../utils/geoUtils';
import { toast } from '@/components/ui/sonner';
import { Compass, Map } from 'lucide-react';

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
  
  // Fantasy realms and territories
  const cityLocations: Location[] = [
    // North America / Northreach
    {
      id: '1',
      name: 'Frostspire',  // New York
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 3,
      discovered: false,
      realm: 'Northreach',
      territory: 'Frosthold Kingdom'
    },
    {
      id: '2',
      name: 'Embergate',  // Los Angeles
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 3,
      discovered: false,
      realm: 'Northreach',
      territory: 'Sunfire Dominion'
    },
    
    // Europe / Eldoria
    {
      id: '3',
      name: 'Mistral Harbor',  // London
      latitude: 51.5074,
      longitude: -0.1278,
      radius: 2.5,
      discovered: false,
      realm: 'Eldoria',
      territory: 'Mistral Isles'
    },
    {
      id: '4',
      name: 'Luminara',  // Paris
      latitude: 48.8566,
      longitude: 2.3522,
      radius: 2,
      discovered: false,
      realm: 'Eldoria',
      territory: 'Lumina Principality'
    },
    
    // Asia / Dragonspine
    {
      id: '5',
      name: 'Jade Citadel',  // Beijing
      latitude: 39.9042,
      longitude: 116.4074,
      radius: 3,
      discovered: false,
      realm: 'Dragonspine',
      territory: 'Jade Empire'
    },
    {
      id: '6',
      name: 'Skyfall',  // Tokyo
      latitude: 35.6762,
      longitude: 139.6503,
      radius: 2.5,
      discovered: false,
      realm: 'Dragonspine',
      territory: 'Cloudspire Shogunate'
    },
    
    // Africa / Sunreach
    {
      id: '7',
      name: 'Desert Crown',  // Cairo
      latitude: 30.0444,
      longitude: 31.2357,
      radius: 2.8,
      discovered: false,
      realm: 'Sunreach',
      territory: 'Golden Sands Caliphate'
    },
    
    // Australia / Tideholm
    {
      id: '8',
      name: 'Coral Keep',  // Sydney
      latitude: -33.8688,
      longitude: 151.2093,
      radius: 2.3,
      discovered: false,
      realm: 'Tideholm',
      territory: 'Coral Kingdom'
    },
    
    // South America / Verdantia
    {
      id: '9',
      name: 'Emerald Haven',  // Rio de Janeiro
      latitude: -22.9068,
      longitude: -43.1729,
      radius: 2.6,
      discovered: false,
      realm: 'Verdantia',
      territory: 'Emerald Canopy'
    },
    {
      id: '10',
      name: 'Silverstream',  // Buenos Aires
      latitude: -34.6037,
      longitude: -58.3816,
      radius: 2.4,
      discovered: false,
      realm: 'Verdantia',
      territory: 'Silver Plains'
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
        style: 'mapbox://styles/mapbox/dark-v11', // Dark style for fantasy feel
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-98.5795, 39.8283], // US center
        zoom: userLocation ? 10 : 3,
        pitch: 45,
        attributionControl: false,
        antialias: true
      });

      // Apply custom fantasy styling
      map.current.on('load', () => {
        if (!map.current) return;
        
        // Add fog effect for more fantasy atmosphere
        map.current.setFog({
          'color': 'rgb(13, 17, 23)', // Dark blue from brand colors
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.2,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.8
        });

        // Custom styling for land and water
        if (map.current.getLayer('land')) {
          map.current.setPaintProperty('land', 'background-color', '#252D3A');
        }
        
        if (map.current.getLayer('water')) {
          map.current.setPaintProperty('water', 'fill-color', '#263A54');
        }
        
        // Add city markers for all locations
        cityLocations.forEach(city => {
          const isDiscovered = discoveredLocations.some(loc => loc.id === city.id);
          
          // Create fantasy-themed markers
          const el = document.createElement('div');
          el.className = `h-5 w-5 rounded-full flex items-center justify-center 
            ${isDiscovered 
              ? 'bg-lorequest-gold animate-pulse-glow border border-white'
              : 'bg-lorequest-dark border border-lorequest-gold opacity-50'}`;
          
          // Add tower icon inside marker for discovered locations
          if (isDiscovered) {
            const iconSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
                <path d="M19 6v14"></path><path d="M19 10h-7"></path><path d="M19 14h-8"></path><path d="M19 18H6"></path>
                <path d="M8 6h11"></path><path d="M5 10v8"></path><path d="M5 6a4 4 0 0 1 4-4c2 0 3 1 4 2 1-1 2-2 4-2a4 4 0 0 1 4 4"></path>
              </svg>
            `;
            el.innerHTML = iconSvg;
            el.classList.add('animate-float');
          }
          
          // Add the marker to the map with a custom popup
          new mapboxgl.Marker(el)
            .setLngLat([city.longitude, city.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'bg-lorequest-dark border border-lorequest-gold' })
                .setHTML(`
                  <div class="p-2 text-center">
                    <h3 class="font-bold text-lorequest-gold text-sm">${city.name}</h3>
                    <div class="fantasy-divider my-1"></div>
                    <p class="text-xs text-lorequest-parchment">${isDiscovered ? 'Discovered' : 'Undiscovered Territory'}</p>
                  </div>
                `)
            )
            .addTo(map.current);
        });
        
        // Add user position marker with a fantasy theme
        if (userLocation) {
          const el = document.createElement('div');
          el.className = 'h-6 w-6 rounded-full player-marker flex items-center justify-center';
          
          // Add compass icon inside marker
          el.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          `;
          
          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .addTo(map.current);
        }
        
        setIsMapInitialized(true);
      });

      // Add a fantasy-styled compass control
      const navControl = new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      });
      map.current.addControl(navControl, 'bottom-right');

      // Add a custom attribution
      map.current.addControl(
        new mapboxgl.AttributionControl({
          customAttribution: 'Lore Quest | Real-World Adventures'
        })
      );
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
      el.className = 'h-6 w-6 rounded-full player-marker flex items-center justify-center';
      
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      `;
      
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
        
        toast(`🏰 You discovered ${city.name}!`, {
          description: `Territory: ${city.territory} in the Realm of ${city.realm}`,
          duration: 5000,
          className: "bg-lorequest-dark border border-lorequest-gold text-lorequest-gold"
        });
      }
    });
  }, [userLocation, isMapInitialized, discoveredLocations, onLocationDiscovered]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-lorequest-gold/30">
      <div ref={mapContainer} className="map-container" />
      
      {/* Fantasy-themed fog of war overlay */}
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
                boxShadow: '0 0 0 100vmax rgba(13, 17, 23, 0.6)',
                clipPath: 'circle(50%)',
                border: '2px solid rgba(212, 175, 55, 0.3)'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-lorequest-dark/80 backdrop-blur-sm p-2 rounded border border-lorequest-gold/50 text-xs">
        <div className="flex items-center gap-2 text-lorequest-gold">
          <Map size={14} />
          <span>Lore Quest</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
