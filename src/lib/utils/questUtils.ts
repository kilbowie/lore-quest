
import { v4 as uuidv4 } from 'uuid';
import { Quest, QuestType } from '@/features/quests/types';

/**
 * Creates a new quest with default properties
 */
export const createQuest = (
  name: string,
  description: string,
  type: QuestType,
  xpReward: number,
  goldReward: number = 0,
  targetCount: number = 1,
  expiresAt?: Date
): Quest => {
  return {
    id: uuidv4(),
    name,
    description,
    type,
    completed: false,
    progress: 0,
    xpReward,
    goldReward,
    targetCount,
    expiresAt,
  };
};

/**
 * Creates daily quests for the user
 */
export const generateDailyQuests = (): Quest[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return [
    createQuest(
      'Daily Steps',
      'Walk 5,000 steps today',
      QuestType.DAILY,
      100,
      50,
      5000,
      tomorrow
    ),
    createQuest(
      'Daily Combat',
      'Win 3 battles today',
      QuestType.DAILY,
      150,
      75,
      3,
      tomorrow
    ),
    createQuest(
      'Daily Explorer',
      'Discover a new location',
      QuestType.DAILY,
      200,
      100,
      1,
      tomorrow
    )
  ];
};

/**
 * Creates weekly quests for the user
 */
export const generateWeeklyQuests = (): Quest[] => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);
  
  return [
    createQuest(
      'Weekly Walker',
      'Walk 25,000 steps this week',
      QuestType.WEEKLY,
      500,
      250,
      25000,
      nextWeek
    ),
    createQuest(
      'Weekly Warrior',
      'Win 15 battles this week',
      QuestType.WEEKLY,
      600,
      300,
      15,
      nextWeek
    ),
    createQuest(
      'Weekly Explorer',
      'Discover 5 new locations',
      QuestType.WEEKLY,
      700,
      350,
      5,
      nextWeek
    )
  ];
};

/**
 * Checks if any quests are expired and returns only valid ones
 */
export const filterExpiredQuests = (quests: Quest[]): Quest[] => {
  const now = new Date();
  return quests.filter(quest => {
    if (!quest.expiresAt) return true;
    return new Date(quest.expiresAt) > now;
  });
};
