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
  const hasMovedMapRef = useRef<boolean>(false);
  
  // UK locations - Continent = UK, Realm = Countries, Territory = Cities
  const cityLocations: Location[] = [
    // England
    {
      id: '1',
      name: 'London',
      territory: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      radius: 2.5,
      discovered: false,
      realm: 'England',
      description: 'The capital city, home to ancient towers and mystical artifacts'
    },
    {
      id: '2',
      name: 'Manchester',
      territory: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      radius: 2,
      discovered: false,
      realm: 'England',
      description: 'A city of industry and innovation, where steam and magic meet'
    },
    {
      id: '3',
      name: 'Liverpool',
      territory: 'Liverpool',
      latitude: 53.4084,
      longitude: -2.9916,
      radius: 2,
      discovered: false,
      realm: 'England',
      description: 'A port city with tales of seafaring adventures and hidden treasures'
    },
    
    // Scotland
    {
      id: '4',
      name: 'Edinburgh',
      territory: 'Edinburgh',
      latitude: 55.9533,
      longitude: -3.1883,
      radius: 2,
      discovered: false,
      realm: 'Scotland',
      description: 'The ancient seat of Scottish kings, where legends echo through the cobbled streets'
    },
    {
      id: '5',
      name: 'Glasgow',
      territory: 'Glasgow',
      latitude: 55.8642,
      longitude: -4.2518,
      radius: 2,
      discovered: false,
      realm: 'Scotland',
      description: 'A city of resilience and magic, where ancient clans once gathered'
    },
    
    // Wales
    {
      id: '6',
      name: 'Cardiff',
      territory: 'Cardiff',
      latitude: 51.4816,
      longitude: -3.1791,
      radius: 1.8,
      discovered: false,
      realm: 'Wales',
      description: 'A coastal stronghold where dragons are said to still roam the mountains'
    },
    {
      id: '7',
      name: 'Swansea',
      territory: 'Swansea',
      latitude: 51.6214,
      longitude: -3.9436,
      radius: 1.8,
      discovered: false,
      realm: 'Wales',
      description: 'Where the sea brings both fortune and ancient curses'
    },
    
    // Northern Ireland
    {
      id: '8',
      name: 'Belfast',
      territory: 'Belfast',
      latitude: 54.5973,
      longitude: -5.9301,
      radius: 2,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'A city of walls and whispers, where the veil between worlds is thin'
    },
    {
      id: '9',
      name: 'Derry',
      territory: 'Derry',
      latitude: 54.9966,
      longitude: -7.3086,
      radius: 1.5,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'Ancient stone circles mark this land of myth and mystery'
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

    // Center map on user - Set a UK-centered view when first loaded
    if (!hasMovedMapRef.current) {
      map.current.flyTo({
        center: [-2.5, 54.0], // Centered on UK
        essential: true,
        zoom: 5.5
      });
      hasMovedMapRef.current = true;
    }

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
        
        toast(`🏰 You discovered ${city.territory}!`, {
          description: `${city.name} in the Realm of ${city.realm}`,
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
          <span>United Kingdom</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
