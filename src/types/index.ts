
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in miles
  discovered: boolean;
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
