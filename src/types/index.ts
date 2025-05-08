
export interface Location {
  id: string;
  name: string;           // City name (Territory)
  latitude: number;
  longitude: number;
  radius: number;         // in miles
  discovered: boolean;
  realm: string;          // Country in UK (England, Scotland, Wales, Northern Ireland)
  territory: string;      // City/town name
  description?: string;   // Optional description of the location
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
  // New fields for tracking continents and realms
  totalContinents: number;
  discoveredContinents: number;
  totalRealms: number;
  discoveredRealms: number;
}
