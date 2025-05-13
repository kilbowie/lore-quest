
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Package, ArrowRight } from 'lucide-react';
import { User, Enemy, CombatAction, CombatLogEntry } from '../types';

interface BattleEncounterProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onClose?: () => void;
  onComplete?: () => void;
}

const BattleEncounter: React.FC<BattleEncounterProps> = ({ 
  user, 
  onUserUpdate,
  onClose,
  onComplete
}) => {
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isDefending, setIsDefending] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  
  // Handle battle actions
  const handleAction = (action: CombatAction) => {
    if (!isPlayerTurn || !enemy) return;
    
    switch (action) {
      case 'attack':
        // Attack logic
        break;
      case 'defend':
        setIsDefending(true);
        break;
      case 'item':
        setShowInventory(true);
        break;
      case 'flee':
        // Flee logic
        break;
    }
    
    setIsPlayerTurn(false);
  };
  
  // Handle battle end
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  // Handle battle victory
  const handleComplete = () => {
    if (onComplete) onComplete();
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
        {enemy && (
          <div className="border border-zinc-800 rounded p-2">
            <h3 className="font-medium">{enemy.name} {enemy.icon}</h3>
            <div className="h-2 bg-red-900 rounded">
              <div 
                className="h-full bg-red-600 rounded" 
                style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
              />
            </div>
            <p className="text-sm">HP: {enemy.health}/{enemy.maxHealth}</p>
          </div>
        )}
      </div>
      
      {/* Combat log */}
      <div className="h-32 overflow-y-auto border border-zinc-800 rounded mb-4 p-2">
        {combatLog.map((entry, index) => (
          <p key={index} className={`text-sm ${entry.type === 'critical' ? 'text-yellow-400' : entry.type === 'heal' ? 'text-green-400' : ''}`}>
            {entry.message}
          </p>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button 
          variant="outline" 
          className="border-red-800 hover:bg-red-900/50"
          onClick={() => handleAction('attack')}
          disabled={!isPlayerTurn}
        >
          <Sword className="mr-2 h-4 w-4" />
          Attack
        </Button>
        
        <Button 
          variant="outline" 
          className="border-blue-800 hover:bg-blue-900/50"
          onClick={() => handleAction('defend')}
          disabled={!isPlayerTurn}
        >
          <Shield className="mr-2 h-4 w-4" />
          Defend
        </Button>
        
        <Button 
          variant="outline" 
          className="border-green-800 hover:bg-green-900/50"
          onClick={() => handleAction('item')}
          disabled={!isPlayerTurn}
        >
          <Package className="mr-2 h-4 w-4" />
          Item
        </Button>
        
        <Button 
          variant="outline" 
          className="border-yellow-800 hover:bg-yellow-900/50"
          onClick={() => handleAction('flee')}
          disabled={!isPlayerTurn}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Flee
        </Button>
      </div>
      
      <div className="mt-4 flex gap-2">
        {onClose && <Button onClick={handleClose} variant="destructive">Close</Button>}
        {onComplete && <Button onClick={handleComplete} variant="default">Complete</Button>}
      </div>
    </div>
  );
};

export default BattleEncounter;
