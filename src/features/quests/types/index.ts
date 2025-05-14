
// Import shared types when needed
import { InventoryItem } from '@/types';

export enum QuestType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  STORY = 'story',
  ACHIEVEMENT = 'achievement',
  TUTORIAL = 'tutorial'
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  completed: boolean;
  progress: number;
  xpReward: number;
  goldReward?: number;
  itemReward?: InventoryItem;
  targetCount?: number;
  expiresAt?: Date;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requirement?: {
    type: 'class' | 'walk' | 'discover';
    value: string | number;
  };
}

export interface TutorialQuest {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  xpReward: number;
  goldReward: number;
}

export interface TutorialQuestProps {
  onComplete?: () => void;
}

export interface UserDashboardProps {
  onClose?: () => void;
}
