
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sword, Shield, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCombat } from '../context/CombatContext';
import { BattleEncounterProps, CombatAction } from '../types';

const BattleEncounter: React.FC<BattleEncounterProps> = ({
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const { state, performAction } = useCombat();
  const { currentEnemy, isPlayerTurn, combatLog } = state;
  
  if (!user) return null;
  
  const handleAction = (action: CombatAction) => {
    performAction(action);
  };
  
  return (
    <div className="p-4 bg-zinc-950/90 text-zinc-100 rounded-lg border border-zinc-800">
      <h2 className="text-2xl font-bold mb-4">Battle Encounter</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Player status */}
        <div className="border border-zinc-800 rounded p-2">
          <h3 className="font-medium">{user.username}</h3>
          <div className="h-2 bg-red-900 rounded">
            <div 
              className="h-full bg-red-600 rounded" 
              style={{ width: `${(user.health / user.maxHealth) * 100}%` }}
            />
          </div>
          <p className="text-sm">HP: {user.health}/{user.maxHealth}</p>
        </div>
        
        {/* Enemy status */}
        {currentEnemy && (
          <div className="border border-zinc-800 rounded p-2">
            <h3 className="font-medium">{currentEnemy.name}</h3>
            <div className="h-2 bg-red-900 rounded">
              <div 
                className="h-full bg-red-600 rounded" 
                style={{ width: `${(currentEnemy.currentHealth / currentEnemy.maxHealth) * 100}%` }}
              />
            </div>
            <p className="text-sm">HP: {currentEnemy.currentHealth}/{currentEnemy.maxHealth}</p>
          </div>
        )}
      </div>
      
      {/* Combat log */}
      <div className="h-32 overflow-y-auto border border-zinc-800 rounded mb-4 p-2">
        {combatLog.map((entry) => (
          <p key={entry.id} className={`text-sm ${entry.type === 'player-action' ? 'text-blue-400' : entry.type === 'enemy-action' ? 'text-red-400' : ''}`}>
            {entry.message}
          </p>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          className="border-red-800 hover:bg-red-900/50"
          onClick={() => handleAction({ type: 'attack' })}
          disabled={!isPlayerTurn}
        >
          <Sword className="mr-2 h-4 w-4" />
          Attack
        </Button>
        
        <Button 
          variant="outline" 
          className="border-blue-800 hover:bg-blue-900/50"
          onClick={() => handleAction({ type: 'defend' })}
          disabled={!isPlayerTurn}
        >
          <Shield className="mr-2 h-4 w-4" />
          Defend
        </Button>
        
        <Button 
          variant="outline" 
          className="border-green-800 hover:bg-green-900/50"
          onClick={() => handleAction({ type: 'use-item' })}
          disabled={!isPlayerTurn}
        >
          <Package className="mr-2 h-4 w-4" />
          Item
        </Button>
        
        <Button 
          variant="outline" 
          className="border-yellow-800 hover:bg-yellow-900/50"
          onClick={() => handleAction({ type: 'flee' })}
          disabled={!isPlayerTurn}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Flee
        </Button>
      </div>
      
      <div className="mt-4 flex gap-2">
        {onClose && <Button onClick={onClose} variant="destructive">Close</Button>}
        {onComplete && <Button onClick={onComplete} variant="default">Complete</Button>}
      </div>
    </div>
  );
};

export default BattleEncounter;
