
import React from 'react';
import { ExplorationStats as StatsType } from '../types';
import { Progress } from '@/components/ui/progress';

interface ExplorationStatsProps {
  stats: StatsType;
}

const ExplorationStats: React.FC<ExplorationStatsProps> = ({ stats }) => {
  return (
    <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-2">Exploration Progress</h3>
      
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Discovered</span>
          <span className="font-medium">{stats.discoveredLocations} of {stats.totalLocations}</span>
        </div>
        
        <Progress 
          value={stats.percentExplored} 
          className="h-2 bg-muted"
          indicatorClassName="bg-gradient-to-r from-explorer-primary to-explorer-secondary"
        />
        
        <div className="text-xs text-muted-foreground text-right">
          {stats.percentExplored.toFixed(0)}% explored
        </div>
      </div>
    </div>
  );
};

export default ExplorationStats;
