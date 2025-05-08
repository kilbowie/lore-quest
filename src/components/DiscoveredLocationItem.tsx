
import React from 'react';
import { Location } from '../types';
import { cn } from '@/lib/utils';

interface DiscoveredLocationItemProps {
  location: Location;
  onClick?: () => void;
}

const DiscoveredLocationItem: React.FC<DiscoveredLocationItemProps> = ({ 
  location,
  onClick 
}) => {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg transition-all",
        "bg-gradient-to-r from-secondary/10 to-primary/10",
        "border border-explorer-accent/20 hover:border-explorer-accent/40",
        "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-explorer-discovered animate-pulse-glow" />
        <h3 className="text-sm font-medium">{location.name}</h3>
      </div>
    </div>
  );
};

export default DiscoveredLocationItem;
