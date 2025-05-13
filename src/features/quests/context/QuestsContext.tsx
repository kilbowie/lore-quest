import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Quest, QuestType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { generateTimeBasedQuests, getTimeBasedQuests, addExperience } from '@/utils/xpUtils';
import { toast } from '@/components/ui/sonner';

interface QuestsContextType {
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  monthlyQuests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  trackQuest: (questId: string) => void;
  untrackQuest: (questId: string) => void;
  refreshQuests: () => void;
  isLoading: boolean;
}

const defaultQuestsContext: QuestsContextType = {
  dailyQuests: [],
  weeklyQuests: [],
  monthlyQuests: [],
  activeQuests: [],
  completedQuests: [],
  updateQuestProgress: () => {},
  completeQuest: () => {},
  trackQuest: () => {},
  untrackQuest: () => {},
  refreshQuests: () => {},
  isLoading: true
};

export const QuestsContext = createContext<QuestsContextType>(defaultQuestsContext);

export const useQuests = (): QuestsContextType => useContext(QuestsContext);

export const QuestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [monthlyQuests, setMonthlyQuests] = useState<Quest[]>([]);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);

  // Initialize quests from user data and time-based quests
  useEffect(() => {
    if (user) {
      // First ensure user has the latest time-based quests
      const updatedUser = generateTimeBasedQuests(user);
      if (updatedUser !== user) {
        updateCurrentUser(updatedUser);
        return; // This will trigger another useEffect call with updated user
      }

      // Get time-based quests
      const timeBasedQuests = getTimeBasedQuests(user.id);
      setDailyQuests(timeBasedQuests.daily);
      setWeeklyQuests(timeBasedQuests.weekly);
      setMonthlyQuests(timeBasedQuests.monthly);
      
      // Set active and completed quests from user data
      const allActiveQuestIds = user.activeQuests || [];
      const allCompletedQuestIds = user.completedQuests || [];
      
      // We'll need to fetch actual quest data from some source
      // For now, we're just using empty arrays as placeholders
      setActiveQuests([]);
      setCompletedQuests([]);
      
      setIsLoading(false);
    }
  }, [user]);

  // Update quest progress
  const updateQuestProgress = (questId: string, progress: number) => {
    if (!user) return;
    
    // Find the quest in all possible quest categories
    let questToUpdate: Quest | undefined;
    let questCategory: 'daily' | 'weekly' | 'monthly' | 'active' | null = null;
    
    if (dailyQuests.some(q => q.id === questId)) {
      questToUpdate = dailyQuests.find(q => q.id === questId);
      questCategory = 'daily';
    } else if (weeklyQuests.some(q => q.id === questId)) {
      questToUpdate = weeklyQuests.find(q => q.id === questId);
      questCategory = 'weekly';
    } else if (monthlyQuests.some(q => q.id === questId)) {
      questToUpdate = monthlyQuests.find(q => q.id === questId);
      questCategory = 'monthly';
    } else if (activeQuests.some(q => q.id === questId)) {
      questToUpdate = activeQuests.find(q => q.id === questId);
      questCategory = 'active';
    }
    
    if (!questToUpdate || !questCategory) return;
    
    // Update the progress
    const updatedQuest = { ...questToUpdate, progress: Math.min(1, progress) };
    
    // Check if the quest is now completed
    if (updatedQuest.progress >= 1 && !updatedQuest.completed) {
      updatedQuest.completed = true;
      
      // Award quest rewards
      let updatedUserWithRewards = user;
      
      if (updatedQuest.xpReward) {
        updatedUserWithRewards = addExperience(
          updatedUserWithRewards, 
          updatedQuest.xpReward, 
          `Completed ${updatedQuest.name}`
        );
      }
      
      if (updatedQuest.goldReward) {
        updatedUserWithRewards = {
          ...updatedUserWithRewards,
          gold: (updatedUserWithRewards.gold || 0) + updatedQuest.goldReward
        };
      }
      
      // Update user stats based on quest type
      if (questCategory === 'daily') {
        updatedUserWithRewards = {
          ...updatedUserWithRewards,
          stats: {
            ...updatedUserWithRewards.stats,
            dailyQuestsCompleted: (updatedUserWithRewards.stats.dailyQuestsCompleted || 0) + 1,
            questsCompleted: (updatedUserWithRewards.stats.questsCompleted || 0) + 1,
            questXpEarned: (updatedUserWithRewards.stats.questXpEarned || 0) + updatedQuest.xpReward,
            questGoldEarned: (updatedUserWithRewards.stats.questGoldEarned || 0) + (updatedQuest.goldReward || 0),
            totalXpEarned: (updatedUserWithRewards.stats.totalXpEarned || 0) + updatedQuest.xpReward,
            totalGoldEarned: (updatedUserWithRewards.stats.totalGoldEarned || 0) + (updatedQuest.goldReward || 0)
          }
        };
      } else if (questCategory === 'weekly') {
        updatedUserWithRewards = {
          ...updatedUserWithRewards,
          stats: {
            ...updatedUserWithRewards.stats,
            weeklyQuestsCompleted: (updatedUserWithRewards.stats.weeklyQuestsCompleted || 0) + 1,
            questsCompleted: (updatedUserWithRewards.stats.questsCompleted || 0) + 1,
            questXpEarned: (updatedUserWithRewards.stats.questXpEarned || 0) + updatedQuest.xpReward,
            questGoldEarned: (updatedUserWithRewards.stats.questGoldEarned || 0) + (updatedQuest.goldReward || 0),
            totalXpEarned: (updatedUserWithRewards.stats.totalXpEarned || 0) + updatedQuest.xpReward,
            totalGoldEarned: (updatedUserWithRewards.stats.totalGoldEarned || 0) + (updatedQuest.goldReward || 0)
          }
        };
      } else if (questCategory === 'monthly') {
        updatedUserWithRewards = {
          ...updatedUserWithRewards,
          stats: {
            ...updatedUserWithRewards.stats,
            monthlyQuestsCompleted: (updatedUserWithRewards.stats.monthlyQuestsCompleted || 0) + 1,
            questsCompleted: (updatedUserWithRewards.stats.questsCompleted || 0) + 1,
            questXpEarned: (updatedUserWithRewards.stats.questXpEarned || 0) + updatedQuest.xpReward,
            questGoldEarned: (updatedUserWithRewards.stats.questGoldEarned || 0) + (updatedQuest.goldReward || 0),
            totalXpEarned: (updatedUserWithRewards.stats.totalXpEarned || 0) + updatedQuest.xpReward,
            totalGoldEarned: (updatedUserWithRewards.stats.totalGoldEarned || 0) + (updatedQuest.goldReward || 0)
          }
        };
      }
      
      // Update completed quests in user data
      const updatedCompletedQuests = [
        ...(updatedUserWithRewards.completedQuests || []),
        questId
      ];
      
      // Remove from active quests if it was there
      const updatedActiveQuests = (updatedUserWithRewards.activeQuests || [])
        .filter(id => id !== questId);
      
      // Update user
      updateCurrentUser({
        ...updatedUserWithRewards,
        completedQuests: updatedCompletedQuests,
        activeQuests: updatedActiveQuests
      });
      
      // Show notification
      toast.success(`Quest Completed: ${updatedQuest.name}`, {
        description: `Rewards: ${updatedQuest.xpReward} XP${updatedQuest.goldReward ? `, ${updatedQuest.goldReward} Gold` : ''}`
      });
    }
    
    // Update the quest in the appropriate state
    switch (questCategory) {
      case 'daily':
        setDailyQuests(prevQuests => 
          prevQuests.map(q => q.id === questId ? updatedQuest : q)
        );
        break;
      case 'weekly':
        setWeeklyQuests(prevQuests => 
          prevQuests.map(q => q.id === questId ? updatedQuest : q)
        );
        break;
      case 'monthly':
        setMonthlyQuests(prevQuests => 
          prevQuests.map(q => q.id === questId ? updatedQuest : q)
        );
        break;
      case 'active':
        setActiveQuests(prevQuests => 
          prevQuests.map(q => q.id === questId ? updatedQuest : q)
        );
        break;
    }
  };

  // Complete a quest directly
  const completeQuest = (questId: string) => {
    updateQuestProgress(questId, 1);
  };

  // Start tracking a quest
  const trackQuest = (questId: string) => {
    if (!user) return;
    
    // Make sure we're not already tracking this quest
    if (user.activeQuests?.includes(questId)) return;
    
    const updatedActiveQuests = [
      ...(user.activeQuests || []),
      questId
    ];
    
    updateCurrentUser({
      ...user,
      activeQuests: updatedActiveQuests
    });
  };

  // Stop tracking a quest
  const untrackQuest = (questId: string) => {
    if (!user) return;
    
    const updatedActiveQuests = (user.activeQuests || [])
      .filter(id => id !== questId);
    
    updateCurrentUser({
      ...user,
      activeQuests: updatedActiveQuests
    });
  };

  // Refresh all quests
  const refreshQuests = () => {
    if (!user) return;
    
    // Generate fresh time-based quests
    const updatedUser = generateTimeBasedQuests(user, true);
    updateCurrentUser(updatedUser);
    
    // This will trigger the useEffect to reload all quests
  };

  return (
    <QuestsContext.Provider
      value={{
        dailyQuests,
        weeklyQuests,
        monthlyQuests,
        activeQuests,
        completedQuests,
        updateQuestProgress,
        completeQuest,
        trackQuest,
        untrackQuest,
        refreshQuests,
        isLoading
      }}
    >
      {children}
    </QuestsContext.Provider>
  );
};
