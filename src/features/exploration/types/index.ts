
export interface ExplorationStats {
  discoveredContinents: number;
  totalContinents: number;
  discoveredRealms: number;
  totalRealms: number;
  discoveredLocations: number;
  totalLocations: number;
  percentExplored: number;
}

export interface Location {
  id: string;
  name: string;
  type: 'city' | 'dungeon' | 'landmark' | 'quest' | 'shop';
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  discovered: boolean;
  realm?: string;
  continent?: string;
  icon?: string;
}
