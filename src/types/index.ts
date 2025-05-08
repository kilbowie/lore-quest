
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in miles
  discovered: boolean;
  realm: string; // Continent
  territory: string; // Country
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ExplorationStats {
  totalLocations: number;
  discoveredLocations: number;
  percentExplored: number;
}
