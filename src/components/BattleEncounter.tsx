
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sword, Shield, Heart, Bolt, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  User,
  Enemy,
  CombatAction,
  AttackType,
  CombatLogEntry,
  InventoryItem
} from '../types';
import {
  getBestAttackType,
  getCombatUsableItems,
  executePlayerAction,
  executeEnemyAction,
  processCombatEnd
} from '../utils/combatEngine';
import { generateEnemy, useEnergy } from '../utils/enemyUtils';

interface BattleEncounterProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  onClose: () => void;
  initialEnemy?: Enemy; // Optional enemy to start with
}

const BattleEncounter: React.FC<BattleEncounterProps> = ({
  user,
  onUserUpdate,
  onClose,
  initialEnemy
}) => {
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType>(getBestAttackType(user));
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [usableItems, setUsableItems] = useState<InventoryItem[]>([]);

  // Initialize battle
  useEffect(() => {
    if (!enemy && !showEndScreen) {
      startBattle();
    }
  }, [enemy, showEndScreen]);

  // Update usable items when user changes
  useEffect(() => {
    setUsableItems(getCombatUsableItems(user));
  }, [user]);

  const startBattle = () => {
    // Check if user has energy
    if (user.energy <= 0) {
      toast.error("Not enough energy to start battle!");
      onClose();
      return;
    }

    // Use energy
    const updatedUser = useEnergy(user);
    onUserUpdate(updatedUser);

    // Generate or use provided enemy
    const battleEnemy = initialEnemy || generateEnemy(user.level);
    setEnemy(battleEnemy);

    // Initialize combat log
    setCombatLog([
      {
        message: `Battle started with ${battleEnemy.name} (Level ${battleEnemy.level})!`,
        timestamp: new Date(),
        type: 'system'
      },
      {
        message: battleEnemy.description || `A ${battleEnemy.name} ready for battle.`,
        timestamp: new Date(),
        type: 'system'
      }
    ]);

    // Set initial states
    setIsCombatActive(true);
    setIsPlayerTurn(true);
    setShowEndScreen(false);
  };

  const handlePlayerAction = (action: CombatAction, itemId?: string) => {
    if (!enemy || !isCombatActive || !isPlayerTurn) return;

    // Execute player action
    const { updatedUser, updatedEnemy, logEntry, combatEnded, playerWon: actionPlayerWon } = 
      executePlayerAction(user, enemy, action, itemId, selectedAttackType);

    // Update state
    setEnemy(updatedEnemy);
    onUserUpdate(updatedUser);
    setCombatLog(prev => [...prev, logEntry]);

    // Check if combat ended
    if (combatEnded) {
      endCombat(actionPlayerWon);
      return;
    }

    // Switch to enemy turn
    setIsPlayerTurn(false);

    // Enemy acts after a short delay
    setTimeout(() => {
      handleEnemyAction(updatedUser, updatedEnemy);
    }, 1000);
  };

  const handleEnemyAction = (currentUser: User, currentEnemy: Enemy) => {
    if (!isCombatActive) return;

    // Execute enemy action
    const { updatedUser, logEntry, combatEnded } = 
      executeEnemyAction(currentUser, currentEnemy);

    // Update state
    onUserUpdate(updatedUser);
    setCombatLog(prev => [...prev, logEntry]);

    // Check if combat ended
    if (combatEnded) {
      endCombat(false);
      return;
    }

    // Switch back to player turn
    setIsPlayerTurn(true);
  };

  const endCombat = (won: boolean) => {
    if (!enemy) return;

    // Process combat end
    const { updatedUser, logEntries } = processCombatEnd(user, enemy, won);

    // Update state
    onUserUpdate(updatedUser);
    setCombatLog(prev => [...prev, ...logEntries]);
    
    // Update end screen state
    setPlayerWon(won);
    setIsCombatActive(false);
    
    // Show end screen after a short delay
    setTimeout(() => {
      setShowEndScreen(true);
    }, 1500);
  };

  const handleContinue = () => {
    setEnemy(null);
    setCombatLog([]);
    setShowEndScreen(false);
    onClose();
  };

  // Calculate health percentages
  const playerHealthPercent = user ? (user.health / user.maxHealth) * 100 : 0;
  const enemyHealthPercent = enemy ? (enemy.health / enemy.maxHealth) * 100 : 0;

  if (showEndScreen) {
    return (
      <Card className="max-w-md mx-auto bg-black/80 border-lorequest-gold/40">
        <CardHeader className="text-center">
          <CardTitle className={playerWon ? "text-green-400" : "text-red-400"}>
            {playerWon ? "Victory!" : "Defeat!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-2xl mb-4">{playerWon ? "🎉" : "💀"}</div>
          <p className="text-lorequest-parchment">
            {playerWon 
              ? `You defeated the ${enemy?.name || 'enemy'}!` 
              : `You were defeated by the ${enemy?.name || 'enemy'}.`}
          </p>
          {playerWon && (
            <div className="mt-4 p-3 rounded-lg bg-lorequest-gold/10 border border-lorequest-gold/20">
              <p className="text-lorequest-gold mb-1">Rewards:</p>
              <div className="flex justify-between">
                <span>XP:</span>
                <span>+{enemy?.xpReward || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Gold:</span>
                <span>+{enemy?.goldReward || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-lorequest-gold text-lorequest-dark hover:bg-amber-400"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!enemy) {
    return <div className="p-4 text-center">Loading battle...</div>;
  }

  return (
    <Card className="max-w-md mx-auto bg-black/80 border-lorequest-gold/40">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lorequest-gold text-lg">
            Battle Encounter
          </CardTitle>
          <div className="flex items-center gap-1 text-sm">
            <Bolt className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400">{user.energy}</span>
            <span className="text-lorequest-parchment/50">/{user.maxEnergy}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enemy Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{enemy.icon}</span>
              <span className="text-lorequest-gold font-medium">{enemy.name}</span>
            </div>
            <span className="text-sm text-lorequest-parchment">Lv. {enemy.level}</span>
          </div>
          <Progress 
            value={enemyHealthPercent} 
            className="h-2 bg-red-950"
          />
          <div className="flex justify-between text-xs text-lorequest-parchment/70">
            <span>HP: {enemy.health}/{enemy.maxHealth}</span>
            <span>Type: {enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1)}</span>
          </div>
        </div>

        {/* Player Status */}
        <div className="space-y-1 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-lorequest-gold font-medium">{user.name}</span>
            <span className="text-sm text-lorequest-parchment">Lv. {user.level}</span>
          </div>
          <Progress 
            value={playerHealthPercent} 
            className="h-2 bg-red-950"
          />
          <div className="flex justify-between text-xs text-lorequest-parchment/70">
            <span>HP: {user.health}/{user.maxHealth}</span>
            <span>{user.defending ? "🛡️ Defending" : ""}</span>
          </div>
        </div>

        {/* Combat Log */}
        <div className="bg-black/30 p-2 rounded-md border border-lorequest-gold/20 h-32 overflow-y-auto">
          {combatLog.map((log, index) => (
            <div 
              key={index} 
              className={`text-sm mb-1 ${
                log.type === 'player-action' ? 'text-blue-300' :
                log.type === 'enemy-action' ? 'text-red-300' :
                log.type === 'system' ? 'text-lorequest-parchment/70' :
                log.type === 'reward' ? 'text-lorequest-gold' :
                log.type === 'critical' ? 'text-yellow-300 font-medium' :
                log.type === 'heal' ? 'text-green-300' : 'text-lorequest-parchment'
              }`}
            >
              {log.message}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-2">
          <Tabs defaultValue="attack">
            <TabsList className="grid grid-cols-3 mb-3 bg-lorequest-gold/10">
              <TabsTrigger value="attack" disabled={!isPlayerTurn || user.isDead}>
                Attack
              </TabsTrigger>
              <TabsTrigger value="items" disabled={!isPlayerTurn || user.isDead}>
                Items
              </TabsTrigger>
              <TabsTrigger value="actions" disabled={!isPlayerTurn || user.isDead}>
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attack" className="mt-0">
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  disabled={!isPlayerTurn || user.isDead}
                  onClick={() => {
                    setSelectedAttackType('Melee');
                    handlePlayerAction('attack');
                  }}
                  className={`flex flex-col items-center py-2 ${selectedAttackType === 'Melee' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant="outline"
                >
                  <Sword className="h-4 w-4 mb-1" />
                  <span className="text-sm">Melee</span>
                </Button>
                <Button 
                  disabled={!isPlayerTurn || user.isDead}
                  onClick={() => {
                    setSelectedAttackType('Magic');
                    handlePlayerAction('attack');
                  }}
                  className={`flex flex-col items-center py-2 ${selectedAttackType === 'Magic' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant="outline"
                >
                  <svg className="h-4 w-4 mb-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8L10.5 5.5M16 16L13.5 18.5M16 8L13.5 5.5M8 16L10.5 18.5M12 12L19 5M19 12L17 10M5 12L7 10M12 19V17M12 7V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">Magic</span>
                </Button>
                <Button 
                  disabled={!isPlayerTurn || user.isDead}
                  onClick={() => {
                    setSelectedAttackType('Ranged');
                    handlePlayerAction('attack');
                  }}
                  className={`flex flex-col items-center py-2 ${selectedAttackType === 'Ranged' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant="outline"
                >
                  <svg className="h-4 w-4 mb-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4L15 8M15 8L19 12M15 8L20 8M4 20L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">Ranged</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-0">
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {usableItems.length === 0 ? (
                  <div className="col-span-2 text-center py-3 text-lorequest-parchment/50">
                    No usable items
                  </div>
                ) : (
                  usableItems.map(item => (
                    <Button
                      key={item.id}
                      disabled={!isPlayerTurn || user.isDead}
                      onClick={() => handlePlayerAction('item', item.id)}
                      className="flex items-center justify-start"
                      variant="outline"
                      size="sm"
                    >
                      <Heart className="h-3 w-3 mr-2 text-green-500" />
                      <div className="text-left">
                        <div className="text-sm">{item.name}</div>
                        <div className="text-xs text-lorequest-parchment/70">
                          +{item.value} {item.useEffect}
                        </div>
                      </div>
                      <div className="ml-auto text-xs text-lorequest-gold">
                        x{item.quantity}
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-0">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  disabled={!isPlayerTurn || user.isDead}
                  onClick={() => handlePlayerAction('defend')}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Shield className="h-4 w-4" />
                  <span>Defend</span>
                </Button>
                <Button 
                  disabled={!isPlayerTurn || user.isDead}
                  onClick={() => handlePlayerAction('flee')}
                  className="flex items-center gap-2"
                  variant="outline"
                  title="50% chance to escape"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Flee</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-xs text-center text-lorequest-parchment/50 mt-2">
            {!isPlayerTurn && "Enemy is taking their turn..."}
            {user.isDead && "You have been defeated!"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleEncounter;
