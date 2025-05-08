
import React from 'react';
import { Location } from '../types';
import { cn } from '@/lib/utils';
import { Castle } from 'lucide-react';

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
        "p-3 rounded-lg transition-all relative",
        "bg-lorequest-dark/50 hover:bg-lorequest-dark/80",
        "border border-lorequest-gold/30 hover:border-lorequest-gold/60",
        "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-lorequest-gold/20 flex items-center justify-center">
          <Castle size={14} className="text-lorequest-gold" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-lorequest-gold">{location.territory}</h3>
          <div className="flex flex-col">
            <p className="text-xs text-lorequest-muted">
              {location.name}
            </p>
            <p className="text-xs italic text-lorequest-parchment/70">
              Realm of {location.realm}
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-lorequest-gold/40"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-lorequest-gold/40"></div>
    </div>
  );
};

export default DiscoveredLocationItem;
