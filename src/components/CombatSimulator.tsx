
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/Progress';
import { User, AttackType } from '../types';
import { calculateDamage, applyDamage, useItem, getBestAttackType, getDamageModifierText, getCombatUsableItems } from '../utils/combatEngine';
import { updateUser } from '../utils/authUtils';
import { Shield, Sword, Wand, Activity, Zap, Heart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CombatSimulatorProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const ENEMY_TYPES = [
  {
    name: 'Wild Boar',
    level: 1,
    icon: '🐗',
    health: 30,
    attackType: 'Melee' as AttackType,
    stats: { strength: 3, intelligence: 1, dexterity: 2 },
    armor: 1,
    xpReward: 20,
    goldReward: 5
  },
  {
    name: 'Bandit',
    level: 2,
    icon: '👤',
    health: 45,
    attackType: 'Melee' as AttackType,
    stats: { strength: 4, intelligence: 2, dexterity: 3 },
    armor: 2,
    xpReward: 35,
    goldReward: 10
  },
  {
    name: 'Woodland Spirit',
    level: 3,
    icon: '🧝',
    health: 60,
    attackType: 'Magic' as AttackType,
    stats: { strength: 2, intelligence: 5, dexterity: 3 },
    armor: 1,
    xpReward: 50,
    goldReward: 15
  },
  {
    name: 'Archer Scout',
    level: 4,
    icon: '🏹',
    health: 55,
    attackType: 'Ranged' as AttackType,
    stats: { strength: 3, intelligence: 2, dexterity: 5 },
    armor: 2,
    xpReward: 45,
    goldReward: 12
  }
];

const CombatSimulator: React.FC<CombatSimulatorProps> = ({ user, onUserUpdate }) => {
  const [enemy, setEnemy] = useState<any | null>(null);
  const [enemyHealth, setEnemyHealth] = useState(0);
  const [maxEnemyHealth, setMaxEnemyHealth] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType | null>(null);

  useEffect(() => {
    if (!selectedAttackType && user.playerClass) {
      // Set default attack type based on class
      if (user.playerClass === 'Knight') {
        setSelectedAttackType('Melee');
      } else if (user.playerClass === 'Wizard') {
        setSelectedAttackType('Magic');
      } else if (user.playerClass === 'Ranger') {
        setSelectedAttackType('Ranged');
      } else {
        setSelectedAttackType('Melee');
      }
    }
  }, [user, selectedAttackType]);
  
  const startCombat = (enemyType: typeof ENEMY_TYPES[0]) => {
    // Create a copy of the enemy type
    const newEnemy = { ...enemyType };
    
    // Set enemy health
    setEnemyHealth(newEnemy.health);
    setMaxEnemyHealth(newEnemy.health);
    
    // Set enemy
    setEnemy(newEnemy);
    
    // Reset combat log
    setCombatLog([`Combat started with ${newEnemy.name}!`]);
    
    // Player goes first
    setIsPlayerTurn(true);
    
    // Set combat as active
    setIsCombatActive(true);
  };
  
  const endCombat = (victory: boolean) => {
    if (victory && enemy) {
      // Award XP and gold
      let updatedUser = { ...user };
      
      // Add message to combat log
      setCombatLog(prev => [...prev, `You defeated the ${enemy.name}!`]);
      setCombatLog(prev => [...prev, `Earned ${enemy.xpReward} XP and ${enemy.goldReward} gold!`]);
      
      // Add XP
      updatedUser.experience += enemy.xpReward;
      
      // Add gold
      updatedUser.gold += enemy.goldReward;
      
      // Update user stats
      if (updatedUser.stats) {
        updatedUser.stats.totalXpEarned += enemy.xpReward;
        updatedUser.stats.totalGoldEarned += enemy.goldReward;
      }
      
      // Update user
      updateUser(updatedUser);
      onUserUpdate(updatedUser);
      
      // Show toast
      toast.success(`Victory! You defeated the ${enemy.name}`, {
        description: `Earned ${enemy.xpReward} XP and ${enemy.goldReward} gold!`
      });
    } else if (!victory) {
      // Add message to combat log
      setCombatLog(prev => [...prev, `You were defeated by the ${enemy.name}!`]);
      
      // Show toast
      toast.error(`Defeat! You were beaten by the ${enemy.name}`, {
        description: "You'll need to recover before fighting again."
      });
    }
    
    // Reset combat
    setIsCombatActive(false);
    setEnemy(null);
  };
  
  const handlePlayerAttack = (attackType: AttackType) => {
    if (!enemy || !isCombatActive || !isPlayerTurn) return;
    
    // Calculate damage
    const damageResult = calculateDamage(user, 
      { ...enemy, playerClass: undefined } as unknown as User, 
      attackType);
    
    // Apply damage to enemy
    const newEnemyHealth = Math.max(0, enemyHealth - damageResult.damage);
    setEnemyHealth(newEnemyHealth);
    
    // Add message to combat log
    setCombatLog(prev => [...prev, 
      `You attack with ${attackType}: ${getDamageModifierText(damageResult.isCritical, damageResult.isWeak)} for ${damageResult.damage} damage!`
    ]);
    
    // Check if enemy is defeated
    if (newEnemyHealth <= 0) {
      endCombat(true);
      return;
    }
    
    // Switch to enemy turn
    setIsPlayerTurn(false);
    
    // Enemy attacks after a short delay
    setTimeout(() => {
      handleEnemyAttack();
    }, 1000);
  };
  
  const handleEnemyAttack = () => {
    if (!enemy || !isCombatActive) return;
    
    // Calculate damage
    const damageResult = calculateDamage(
      { ...enemy, playerClass: undefined } as unknown as User,
      user,
      enemy.attackType
    );
    
    // Apply damage to player
    const updatedUser = applyDamage(user, damageResult.damage);
    
    // Add message to combat log
    setCombatLog(prev => [...prev, 
      `${enemy.name} attacks with ${enemy.attackType}: ${getDamageModifierText(damageResult.isCritical, damageResult.isWeak)} for ${damageResult.damage} damage!`
    ]);
    
    // Check if player is defeated
    if (updatedUser.health <= 0) {
      onUserUpdate(updatedUser);
      endCombat(false);
      return;
    }
    
    // Update player
    onUserUpdate(updatedUser);
    
    // Switch back to player turn
    setIsPlayerTurn(true);
  };
  
  const handleUseItem = (itemId: string) => {
    if (!isCombatActive || !isPlayerTurn) return;
    
    // Use item
    const updatedUser = useItem(user, itemId);
    
    // Update player
    onUserUpdate(updatedUser);
    
    // Add message to combat log
    setCombatLog(prev => [...prev, `You used a healing item!`]);
    
    // Switch to enemy turn
    setIsPlayerTurn(false);
    
    // Enemy attacks after a short delay
    setTimeout(() => {
      handleEnemyAttack();
    }, 1000);
  };
  
  const renderEnemySelection = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lorequest-gold font-medium">Choose an enemy to fight</h3>
        <div className="grid grid-cols-2 gap-3">
          {ENEMY_TYPES.map((enemyType, index) => (
            <Card 
              key={index} 
              className="bg-lorequest-gold/10 hover:bg-lorequest-gold/20 border-lorequest-gold/30 transition-colors cursor-pointer"
              onClick={() => startCombat(enemyType)}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-lorequest-gold">
                  <span className="text-xl">{enemyType.icon}</span>
                  {enemyType.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xs text-lorequest-parchment">Level {enemyType.level}</div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-lorequest-parchment/80">HP: {enemyType.health}</span>
                  <span className="text-lorequest-parchment/80">Armor: {enemyType.armor}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-lorequest-gold/80">XP: {enemyType.xpReward}</span>
                  <span className="text-lorequest-gold/80">Gold: {enemyType.goldReward}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  const renderCombat = () => {
    if (!enemy) return null;
    
    // Get usable items
    const usableItems = getCombatUsableItems(user);
    
    // Calculate health percentages
    const enemyHealthPercent = (enemyHealth / maxEnemyHealth) * 100;
    const playerHealthPercent = (user.health / user.maxHealth) * 100;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Enemy Status */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xl">{enemy.icon}</span>
                <span className="text-lorequest-gold font-medium">{enemy.name}</span>
              </div>
              <span className="text-sm text-lorequest-parchment">Lv. {enemy.level}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-lorequest-parchment">Health</span>
              <span className="text-xs text-lorequest-parchment">{enemyHealth}/{maxEnemyHealth}</span>
            </div>
            <Progress 
              value={enemyHealthPercent} 
              className="h-2"
              indicatorClassName={enemyHealthPercent > 50 ? "bg-green-500" : enemyHealthPercent > 20 ? "bg-yellow-500" : "bg-red-500"}
            />
          </div>
          
          {/* Player Status */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lorequest-gold font-medium">{user.name}</span>
              <span className="text-sm text-lorequest-parchment">Lv. {user.level}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-lorequest-parchment">Health</span>
              <span className="text-xs text-lorequest-parchment">{user.health}/{user.maxHealth}</span>
            </div>
            <Progress 
              value={playerHealthPercent} 
              className="h-2"
              indicatorClassName={playerHealthPercent > 50 ? "bg-green-500" : playerHealthPercent > 20 ? "bg-yellow-500" : "bg-red-500"}
            />
          </div>
        </div>
        
        {/* Combat log */}
        <div className="bg-lorequest-gold/5 p-3 rounded-lg border border-lorequest-gold/20 h-32 overflow-y-auto">
          {combatLog.map((log, index) => (
            <div key={index} className="text-sm text-lorequest-parchment mb-1">
              {log}
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="mt-4">
          <Tabs defaultValue="attack">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="attack" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
                Attack
              </TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
                Items ({usableItems.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="attack">
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  disabled={!isPlayerTurn || user.isDead} 
                  onClick={() => handlePlayerAttack('Melee')}
                  className={`flex flex-col items-center py-3 ${selectedAttackType === 'Melee' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant={selectedAttackType === 'Melee' ? "default" : "outline"}
                >
                  <Sword className="h-5 w-5 mb-1" />
                  <span>Melee</span>
                </Button>
                <Button 
                  disabled={!isPlayerTurn || user.isDead} 
                  onClick={() => handlePlayerAttack('Magic')}
                  className={`flex flex-col items-center py-3 ${selectedAttackType === 'Magic' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant={selectedAttackType === 'Magic' ? "default" : "outline"}
                >
                  <Wand className="h-5 w-5 mb-1" />
                  <span>Magic</span>
                </Button>
                <Button 
                  disabled={!isPlayerTurn || user.isDead} 
                  onClick={() => handlePlayerAttack('Ranged')}
                  className={`flex flex-col items-center py-3 ${selectedAttackType === 'Ranged' ? 'bg-lorequest-gold/80 hover:bg-lorequest-gold/90' : 'bg-lorequest-gold/20 hover:bg-lorequest-gold/30'}`}
                  variant={selectedAttackType === 'Ranged' ? "default" : "outline"}
                >
                  <Activity className="h-5 w-5 mb-1" />
                  <span>Ranged</span>
                </Button>
              </div>
              <div className="mt-3 text-xs text-center text-lorequest-parchment/70">
                {user.playerClass && (
                  <p>Your class ({user.playerClass}) specializes in {user.playerClass === 'Knight' ? 'Melee' : user.playerClass === 'Wizard' ? 'Magic' : 'Ranged'} attacks</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="items">
              {usableItems.length === 0 ? (
                <div className="text-center py-4 text-lorequest-parchment/70">
                  No usable items in inventory
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {usableItems.map((item) => (
                    <Button 
                      key={item.id}
                      disabled={!isPlayerTurn || user.isDead} 
                      onClick={() => handleUseItem(item.id)}
                      className="flex items-center justify-start"
                      variant="outline"
                    >
                      <Heart className="h-4 w-4 mr-2 text-green-500" />
                      <div className="text-left">
                        <div>{item.name}</div>
                        <div className="text-xs text-lorequest-parchment/70">
                          {item.useEffect === 'health' ? 'Health' : item.useEffect === 'mana' ? 'Mana' : 'Stamina'}: +{item.value}
                        </div>
                      </div>
                      <div className="ml-auto text-xs text-lorequest-gold">
                        x{item.quantity}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Flee button */}
        <div className="flex justify-center mt-4">
          <Button 
            variant="ghost" 
            className="text-lorequest-parchment/70 hover:text-lorequest-parchment hover:bg-lorequest-gold/10"
            onClick={() => endCombat(false)}
          >
            Retreat
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="bg-lorequest-dark border-lorequest-gold/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lorequest-gold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Combat Simulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCombatActive ? renderCombat() : renderEnemySelection()}
      </CardContent>
    </Card>
  );
};

export default CombatSimulator;
