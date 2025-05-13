
import React from 'react';
import { ExplorationStats as StatsType } from '../types';
import { Progress } from '@/components/ui/progress';
import { Map, Scroll, Layers, Flag } from 'lucide-react';

interface ExplorationStatsProps {
  stats: StatsType;
}

const ExplorationStats: React.FC<ExplorationStatsProps> = ({ stats }) => {
  return (
    <div className="bg-lorequest-dark/90 backdrop-blur-sm p-4 rounded-lg border border-lorequest-gold/30 shadow-lg">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-lorequest-gold">
        <Scroll size={18} className="text-lorequest-gold" />
        Exploration Progress
      </h3>
      
      <div className="grid gap-3">
        {/* Continent progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-lorequest-parchment flex items-center gap-1">
            <Map size={14} className="text-lorequest-gold" />
            Continents
          </span>
          <span className="font-medium text-lorequest-gold">{stats.discoveredContinents} of {stats.totalContinents}</span>
        </div>
        
        <Progress 
          value={(stats.discoveredContinents / stats.totalContinents) * 100} 
          className="h-1.5 bg-muted"
        />
        
        {/* Realm progress */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-lorequest-parchment flex items-center gap-1">
            <Flag size={14} className="text-lorequest-gold" />
            Realms
          </span>
          <span className="font-medium text-lorequest-gold">{stats.discoveredRealms} of {stats.totalRealms}</span>
        </div>
        
        <Progress 
          value={(stats.discoveredRealms / stats.totalRealms) * 100} 
          className="h-1.5 bg-muted"
        />
        
        {/* Territory progress */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-lorequest-parchment flex items-center gap-1">
            <Layers size={14} className="text-lorequest-gold" />
            Territories
          </span>
          <span className="font-medium text-lorequest-gold">{stats.discoveredLocations} of {stats.totalLocations}</span>
        </div>
        
        <Progress 
          value={stats.percentExplored} 
          className="h-1.5 bg-muted"
        />
        
        <div className="text-xs text-lorequest-gold text-right">
          {stats.percentExplored.toFixed(0)}% of the world explored
        </div>
      </div>
      
      {/* Fantasy decorative elements */}
      <div className="fantasy-divider mt-3"></div>
    </div>
  );
};

export default ExplorationStats;
