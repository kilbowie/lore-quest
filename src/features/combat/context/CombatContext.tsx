
import React, { createContext, useContext, useState, useReducer } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Enemy, CombatAction, CombatLogEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useInventory } from '@/features/inventory/context/InventoryContext';
import { toast } from '@/components/ui/sonner';
import { addExperience } from '@/utils/xpUtils';

interface CombatState {
  inCombat: boolean;
  currentEnemy?: Enemy;
  isPlayerTurn: boolean;
  isDefending: boolean;
  combatLog: CombatLogEntry[];
}

interface CombatContextType {
  state: CombatState;
  startCombat: (enemy: Enemy) => void;
  endCombat: (playerWon: boolean) => void;
  performAction: (action: CombatAction) => void;
  isLoading: boolean;
}

const initialCombatState: CombatState = {
  inCombat: false,
  isPlayerTurn: true,
  isDefending: false,
  combatLog: []
};

type CombatReducerAction = 
  | { type: 'START_COMBAT', payload: Enemy }
  | { type: 'END_COMBAT' }
  | { type: 'TOGGLE_TURN' }
  | { type: 'SET_DEFENDING', payload: boolean }
  | { type: 'DAMAGE_ENEMY', payload: { amount: number, critical?: boolean } }
  | { type: 'DAMAGE_PLAYER', payload: { amount: number, critical?: boolean } }
  | { type: 'ADD_LOG', payload: CombatLogEntry };

function combatReducer(state: CombatState, action: CombatReducerAction): CombatState {
  switch (action.type) {
    case 'START_COMBAT':
      return {
        ...state,
        inCombat: true,
        currentEnemy: action.payload,
        isPlayerTurn: true,
        isDefending: false,
        combatLog: [{
          id: uuidv4(),
          message: `Combat started against ${action.payload.name}!`,
          type: 'system',
          timestamp: Date.now()
        }]
      };
    case 'END_COMBAT':
      return {
        ...state,
        inCombat: false,
        currentEnemy: undefined,
        isPlayerTurn: true,
        isDefending: false,
      };
    case 'TOGGLE_TURN':
      return {
        ...state,
        isPlayerTurn: !state.isPlayerTurn,
        isDefending: false
      };
    case 'SET_DEFENDING':
      return {
        ...state,
        isDefending: action.payload
      };
    case 'DAMAGE_ENEMY':
      if (!state.currentEnemy) return state;
      const newEnemyHealth = Math.max(0, state.currentEnemy.currentHealth - action.payload.amount);
      return {
        ...state,
        currentEnemy: {
          ...state.currentEnemy,
          currentHealth: newEnemyHealth
        }
      };
    case 'DAMAGE_PLAYER':
      // Player damage is handled by updating the user context
      return state;
    case 'ADD_LOG':
      return {
        ...state,
        combatLog: [...state.combatLog, action.payload]
      };
    default:
      return state;
  }
}

const defaultCombatContext: CombatContextType = {
  state: initialCombatState,
  startCombat: () => {},
  endCombat: () => {},
  performAction: () => {},
  isLoading: false
};

export const CombatContext = createContext<CombatContextType>(defaultCombatContext);

export const useCombat = (): CombatContextType => useContext(CombatContext);

export const CombatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUser } = useAuth();
  const { inventory, useItem } = useInventory();
  const [state, dispatch] = useReducer(combatReducer, initialCombatState);
  const [isLoading, setIsLoading] = useState(false);

  const addLogEntry = (message: string, type: 'player-action' | 'enemy-action' | 'system') => {
    dispatch({ 
      type: 'ADD_LOG', 
      payload: {
        id: uuidv4(),
        message,
        type,
        timestamp: Date.now()
      }
    });
  };

  const startCombat = (enemy: Enemy) => {
    if (!user) return;
    
    // Set user in combat state
    updateCurrentUser({
      ...user,
      inCombat: true
    });
    
    // Initialize combat state
    dispatch({ type: 'START_COMBAT', payload: enemy });
  };

  const endCombat = (playerWon: boolean) => {
    if (!user || !state.currentEnemy) return;
    
    if (playerWon) {
      // Award XP and gold
      const xpGained = state.currentEnemy.xpReward;
      const goldGained = state.currentEnemy.goldReward;
      
      let updatedUser = addExperience(user, xpGained, `Defeated ${state.currentEnemy.name}`);
      
      updatedUser = {
        ...updatedUser,
        gold: (updatedUser.gold || 0) + goldGained,
        inCombat: false
      };
      
      // Update user
      updateCurrentUser(updatedUser);
      
      // Show victory message
      toast.success(`Victory! Defeated ${state.currentEnemy.name}`, {
        description: `Rewards: ${xpGained} XP, ${goldGained} Gold`
      });
      
    } else {
      // Player lost
      // Handle death
      const hasSoulstone = inventory.some(item => 
        item.type === 'elixir' && item.useEffect === 'revival'
      );
      
      if (hasSoulstone) {
        // Use revival item
        const revivalItem = inventory.find(item => 
          item.type === 'elixir' && item.useEffect === 'revival'
        );
        
        if (revivalItem) {
          useItem(revivalItem.id);
          
          // Restore some health
          updateCurrentUser({
            ...user,
            health: Math.ceil(user.maxHealth * 0.25),
            inCombat: false
          });
          
          toast.warning(`You were defeated but revived!`, {
            description: `You used a ${revivalItem.name} and survived with some health.`
          });
        }
      } else {
        // Player died
        updateCurrentUser({
          ...user,
          health: 0,
          isDead: true,
          inCombat: false
        });
        
        toast.error(`Defeated by ${state.currentEnemy.name}`, {
          description: `You have been defeated! Visit a healer to restore your health.`
        });
      }
    }
    
    // End combat state
    dispatch({ type: 'END_COMBAT' });
  };

  const calculateDamage = (attacker: 'player' | 'enemy'): { damage: number, critical: boolean } => {
    if (!user || !state.currentEnemy) {
      return { damage: 0, critical: false };
    }
    
    if (attacker === 'player') {
      // Base player damage calculation
      let baseDamage = 0;
      let isCritical = false;
      
      // Calculate based on class and equipment
      if (user.playerClass === 'Knight') {
        baseDamage = user.stats.strength * 1.5;
      } else if (user.playerClass === 'Wizard') {
        baseDamage = user.stats.intelligence * 1.5;
      } else if (user.playerClass === 'Ranger') {
        baseDamage = user.stats.dexterity * 1.5;
      } else {
        // Default if no class
        baseDamage = Math.max(user.stats.strength, user.stats.intelligence, user.stats.dexterity);
      }
      
      // Add weapon damage
      if (user.equipment?.mainWeapon?.equipmentStats?.statBonuses) {
        user.equipment.mainWeapon.equipmentStats.statBonuses.forEach(bonus => {
          if (bonus.attribute === 'strength' || bonus.attribute === 'intelligence' || bonus.attribute === 'dexterity') {
            baseDamage += bonus.value;
          }
        });
      }
      
      // Critical hit chance (10%)
      if (Math.random() < 0.1) {
        baseDamage *= 1.5;
        isCritical = true;
      }
      
      // Apply enemy's defense reduction
      const finalDamage = Math.max(1, Math.floor(baseDamage - (state.currentEnemy.defense * 0.5)));
      
      return { damage: finalDamage, critical: isCritical };
    } else {
      // Enemy damage calculation
      let baseDamage = state.currentEnemy.attack;
      let isCritical = false;
      
      // Critical hit chance (5%)
      if (Math.random() < 0.05) {
        baseDamage *= 1.5;
        isCritical = true;
      }
      
      // Reduce damage if defending
      if (state.isDefending) {
        baseDamage = Math.floor(baseDamage * 0.5);
      }
      
      // Apply player's armor reduction
      const finalDamage = Math.max(1, Math.floor(baseDamage - (user.armor * 0.7)));
      
      return { damage: finalDamage, critical: isCritical };
    }
  };

  const performAction = (action: CombatAction) => {
    if (!user || !state.inCombat || !state.currentEnemy) return;
    
    if (!state.isPlayerTurn) {
      addLogEntry(`It's not your turn!`, 'system');
      return;
    }
    
    switch (action.type) {
      case 'attack':
        // Player attacks
        const { damage, critical } = calculateDamage('player');
        
        dispatch({ 
          type: 'DAMAGE_ENEMY', 
          payload: { amount: damage, critical } 
        });
        
        addLogEntry(
          critical 
            ? `You land a critical hit on ${state.currentEnemy.name} for ${damage} damage!` 
            : `You hit ${state.currentEnemy.name} for ${damage} damage.`,
          'player-action'
        );
        
        // Check if enemy is defeated
        if (state.currentEnemy.currentHealth - damage <= 0) {
          // End combat with victory
          endCombat(true);
          return;
        }
        
        // Switch to enemy turn
        dispatch({ type: 'TOGGLE_TURN' });
        
        // Enemy attacks after a short delay
        setTimeout(() => {
          if (!user || !state.currentEnemy) return;
          
          const enemyAttack = calculateDamage('enemy');
          const newHealth = Math.max(0, user.health - enemyAttack.damage);
          
          updateCurrentUser({
            ...user,
            health: newHealth
          });
          
          addLogEntry(
            enemyAttack.critical 
              ? `${state.currentEnemy.name} lands a critical hit on you for ${enemyAttack.damage} damage!` 
              : `${state.currentEnemy.name} hits you for ${enemyAttack.damage} damage.`,
            'enemy-action'
          );
          
          // Check if player is defeated
          if (newHealth <= 0) {
            // End combat with defeat
            endCombat(false);
            return;
          }
          
          // Switch back to player turn
          dispatch({ type: 'TOGGLE_TURN' });
        }, 1000);
        
        break;
        
      case 'defend':
        // Player defends
        dispatch({ type: 'SET_DEFENDING', payload: true });
        
        addLogEntry(`You prepare to defend against the next attack.`, 'player-action');
        
        // Switch to enemy turn
        dispatch({ type: 'TOGGLE_TURN' });
        
        // Enemy attacks after a short delay
        setTimeout(() => {
          if (!user || !state.currentEnemy) return;
          
          const enemyAttack = calculateDamage('enemy');
          const newHealth = Math.max(0, user.health - enemyAttack.damage);
          
          updateCurrentUser({
            ...user,
            health: newHealth
          });
          
          addLogEntry(
            `${state.currentEnemy.name} attacks, but you block some damage and only take ${enemyAttack.damage} damage.`,
            'enemy-action'
          );
          
          // Check if player is defeated
          if (newHealth <= 0) {
            // End combat with defeat
            endCombat(false);
            return;
          }
          
          // Switch back to player turn
          dispatch({ type: 'TOGGLE_TURN' });
        }, 1000);
        
        break;
        
      case 'use-item':
        if (!action.itemId) {
          addLogEntry(`No item selected.`, 'system');
          return;
        }
        
        // Use the selected item
        useItem(action.itemId);
        
        const item = inventory.find(i => i.id === action.itemId);
        if (item) {
          addLogEntry(`You used ${item.name}.`, 'player-action');
        }
        
        // End turn
        dispatch({ type: 'TOGGLE_TURN' });
        
        // Enemy turn
        setTimeout(() => {
          if (!user || !state.currentEnemy) return;
          
          const enemyAttack = calculateDamage('enemy');
          const newHealth = Math.max(0, user.health - enemyAttack.damage);
          
          updateCurrentUser({
            ...user,
            health: newHealth
          });
          
          addLogEntry(
            `${state.currentEnemy.name} hits you for ${enemyAttack.damage} damage.`,
            'enemy-action'
          );
          
          // Check if player is defeated
          if (newHealth <= 0) {
            // End combat with defeat
            endCombat(false);
            return;
          }
          
          // Switch back to player turn
          dispatch({ type: 'TOGGLE_TURN' });
        }, 1000);
        
        break;
        
      case 'flee':
        // Attempt to flee (70% chance)
        if (Math.random() < 0.7) {
          // Successful flee
          addLogEntry(`You successfully escaped from battle!`, 'system');
          endCombat(false);
        } else {
          // Failed flee attempt
          addLogEntry(`Failed to escape! ${state.currentEnemy.name} blocks your path.`, 'system');
          
          // Enemy gets a free attack
          const enemyAttack = calculateDamage('enemy');
          const newHealth = Math.max(0, user.health - enemyAttack.damage);
          
          updateCurrentUser({
            ...user,
            health: newHealth
          });
          
          addLogEntry(
            `${state.currentEnemy.name} strikes as you try to flee for ${enemyAttack.damage} damage!`,
            'enemy-action'
          );
          
          // Check if player is defeated
          if (newHealth <= 0) {
            // End combat with defeat
            endCombat(false);
            return;
          }
        }
        break;
    }
  };

  return (
    <CombatContext.Provider
      value={{
        state,
        startCombat,
        endCombat,
        performAction,
        isLoading
      }}
    >
      {children}
    </CombatContext.Provider>
  );
};
