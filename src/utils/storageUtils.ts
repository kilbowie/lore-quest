
import { Location } from '../types';

const STORAGE_KEY = 'explorer_discovered_locations';

// Save discovered locations to local storage
export function saveDiscoveredLocations(locations: Location[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error('Failed to save discovered locations:', error);
  }
}

// Load discovered locations from local storage
export function loadDiscoveredLocations(): Location[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load discovered locations:', error);
    return [];
  }
}

// Add a newly discovered location
export function addDiscoveredLocation(location: Location): Location[] {
  const locations = loadDiscoveredLocations();
  
  // Check if location is already discovered
  if (!locations.some(loc => loc.id === location.id)) {
    locations.push(location);
    saveDiscoveredLocations(locations);
  }
  
  return locations;
}

// Clear all discovered locations (for testing)
export function clearDiscoveredLocations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear discovered locations:', error);
  }
}
