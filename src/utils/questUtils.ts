
import { User, DailyQuest, Quest } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate time-based quests (daily, weekly, monthly)
export const generateTimeBasedQuests = (user: User): User => {
  // Generate new daily quests
  const dailyQuests: DailyQuest[] = [
    {
      id: uuidv4(),
      title: 'Daily Walk',
      name: 'Daily Walk',
      description: 'Walk 1 km today',
      type: 'daily',
      targetCount: 1,
      progress: 0,
      completed: false,
      xpReward: 25,
      goldReward: 5,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    },
    {
      id: uuidv4(),
      title: 'Territory Explorer',
      name: 'Territory Explorer',
      description: 'Discover a new territory today',
      type: 'daily',
      progress: 0,
      completed: false,
      xpReward: 35,
      goldReward: 10,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: uuidv4(),
      title: 'Energy Boost',
      name: 'Energy Boost',
      description: 'Use an energy potion',
      type: 'daily',
      progress: 0,
      completed: false,
      xpReward: 15,
      goldReward: 3,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  ];

  return {
    ...user,
    dailyQuests,
    lastDailyQuestReset: new Date().toISOString()
  };
};

// Track progress of a quest
export const updateQuestProgress = (user: User, questId: string, progress: number): User => {
  // Update daily quests
  const updatedDailyQuests = user.dailyQuests.map(quest => {
    if (quest.id === questId) {
      const newProgress = quest.progress ? quest.progress + progress : progress;
      const completed = quest.targetCount ? newProgress >= quest.targetCount : newProgress > 0;
      
      return {
        ...quest,
        progress: newProgress,
        completed,
        completedDate: completed ? new Date().toISOString() : undefined
      };
    }
    return quest;
  });

  // Update regular quests
  const updatedQuests = user.quests.map(quest => {
    if (quest.id === questId) {
      const newProgress = quest.progress ? quest.progress + progress : progress;
      const completed = quest.targetCount ? newProgress >= quest.targetCount : newProgress > 0;
      
      return {
        ...quest,
        progress: newProgress,
        completed,
        completedDate: completed ? new Date().toISOString() : undefined
      };
    }
    return quest;
  });

  return {
    ...user,
    dailyQuests: updatedDailyQuests,
    quests: updatedQuests
  };
};

// Check if a quest has expired
export const hasQuestExpired = (quest: Quest): boolean => {
  if (!quest.expiresAt) return false;
  
  const expirationDate = new Date(quest.expiresAt);
  const now = new Date();
  
  return now > expirationDate;
};
