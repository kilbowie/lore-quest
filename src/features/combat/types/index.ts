
import { User } from '@/types';

export interface CombatAction {
  type: 'attack' | 'defend' | 'use-item' | 'flee';
  itemId?: string;
}

export interface CombatLogEntry {
  id: string;
  message: string;
  type: 'player-action' | 'enemy-action' | 'system';
  timestamp: number;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  maxHealth: number;
  currentHealth: number;
  attack: number;
  defense: number;
  imageUrl?: string;
  loot?: any[];
  xpReward: number;
  goldReward: number;
}

export interface BattleEncounterProps {
  onClose?: () => void;
  onComplete?: () => void;
}
