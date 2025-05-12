
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Brain, SkipForward } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const CharacterStats: React.FC = () => {
  const { user } = useAuth();
  
  if (!user || !user.stats) return null;
  
  return (
    <div className="flex items-center justify-between gap-2 mt-1 text-xs px-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-red-400 gap-1">
              <Shield size={12} />
              <span>{user.stats.strength}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Strength: Increases max health and physical damage</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-blue-400 gap-1">
              <Brain size={12} />
              <span>{user.stats.intelligence}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Intelligence: Increases max mana and magical abilities</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-green-400 gap-1">
              <SkipForward size={12} />
              <span>{user.stats.dexterity}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dexterity: Increases max stamina and movement speed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CharacterStats;
