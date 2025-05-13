
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Progress } from '@/components/Progress';
import { calculateLevelProgress } from '../utils/xpUtils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import CharacterStats from './CharacterStats';

const PlayerStatus: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const health = user.health || 0;
  const maxHealth = user.maxHealth || 100;
  const mana = user.mana || 0;
  const maxMana = user.maxMana || 100;
  const stamina = user.stamina || 0;
  const maxStamina = user.maxStamina || 100;
  const energy = user.energy || 0;
  const maxEnergy = user.maxEnergy || 5;
  
  const healthPercentage = (health / maxHealth) * 100;
  const manaPercentage = (mana / maxMana) * 100;
  const staminaPercentage = (stamina / maxStamina) * 100;
  const energyPercentage = (energy / maxEnergy) * 100;
  const xpProgress = calculateLevelProgress(user);
  
  return (
    <div className="flex-1 max-w-xs">
      <div className="flex items-center mb-1">
        <span className="text-amber-300 text-sm font-medium mr-1">
          {user.username || 'Adventurer'}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center bg-black/30 px-2 py-0.5 rounded-md text-xs">
                <span className="text-amber-300">Level {user.level}</span>
                <span className="mx-1 text-gray-400">|</span>
                <span className="text-lorequest-parchment">{user.experience || 0} XP</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your level and experience progress</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-1">
        <div className="h-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={healthPercentage} 
                  className="h-1.5 bg-red-950"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Health: {health}/{maxHealth}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={manaPercentage} 
                  className="h-1.5 bg-blue-950"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Mana: {mana}/{maxMana}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={staminaPercentage} 
                  className="h-1.5 bg-green-950"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Stamina: {stamina}/{maxStamina}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="h-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress 
                  value={energyPercentage} 
                  className="h-1.5 bg-yellow-950"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Energy: {energy}/{maxEnergy}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <CharacterStats />
    </div>
  );
};

export default PlayerStatus;
