
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Quest, DailyQuest } from '@/types';
import { toast } from '@/components/ui/sonner';
import { addExperience, addItemToInventory } from '@/utils/xpUtils';
import { generateTimeBasedQuests } from '@/utils/questUtils';

// Define the type for our context
interface QuestsContextType {
  quests: Quest[];
  dailyQuests: DailyQuest[];
  activeQuest: Quest | null;
  setActiveQuest: (quest: Quest | null) => void;
  completeQuest: (questId: string) => void;
  resetDailyQuests: () => void;
  completeDailyQuest: (questId: string) => void;
}

// Create context with default values
const QuestsContext = createContext<QuestsContextType>({
  quests: [],
  dailyQuests: [],
  activeQuest: null,
  setActiveQuest: () => {},
  completeQuest: () => {},
  resetDailyQuests: () => {},
  completeDailyQuest: () => {},
});

// Create a hook for easy context use
export const useQuests = () => useContext(QuestsContext);

// Create the provider component
export const QuestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateCurrentUser } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  // Initialize quests from user data
  useEffect(() => {
    if (user) {
      setQuests(user.quests || []);
      setDailyQuests(user.dailyQuests || []);
    }
  }, [user]);

  // Sync quests back to user when they change
  useEffect(() => {
    if (user && quests.length > 0) {
      updateCurrentUser({ ...user, quests });
    }
  }, [quests]);

  // Sync daily quests back to user when they change
  useEffect(() => {
    if (user && dailyQuests.length > 0) {
      updateCurrentUser({ ...user, dailyQuests });
    }
  }, [dailyQuests]);

  // Check if daily quests need to be reset (once per day)
  useEffect(() => {
    if (!user || !user.dailyQuests) return;

    const now = new Date();
    const lastReset = user.lastDailyQuestReset 
      ? new Date(user.lastDailyQuestReset) 
      : new Date(now.getTime() - 86400000); // Default to yesterday if no reset time

    const isNewDay = 
      now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      resetDailyQuests();
    }
  }, [user]);

  // Complete a quest
  const completeQuest = (questId: string) => {
    if (!user) return;

    // Find the quest
    const quest = quests.find(q => q.id === questId);
    if (!quest) {
      toast.error("Quest not found");
      return;
    }

    // Mark as completed
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, completed: true, completedDate: new Date().toISOString() } : q
    );
    setQuests(updatedQuests);

    // Award XP
    let updatedUser = addExperience(user, quest.xpReward, `Completed quest: ${quest.title}`);

    // Award items if any
    if (quest.itemRewards && quest.itemRewards.length > 0) {
      quest.itemRewards.forEach(reward => {
        updatedUser = addItemToInventory(
          updatedUser,
          reward.type,
          reward.name,
          reward.description || '',
          reward.quantity || 1,
          reward.icon,
          reward.useEffect,
          reward.value
        );
      });
    }

    // Award gold if any
    if (quest.goldReward && quest.goldReward > 0) {
      updatedUser = addItemToInventory(
        updatedUser, 
        'gold', 
        'Gold', 
        'Gold coins', 
        quest.goldReward
      );
    }

    // Update user
    updateCurrentUser(updatedUser);

    // Show completion message
    toast.success(`Quest Completed: ${quest.title}`, {
      description: `You earned ${quest.xpReward} XP${quest.goldReward ? ` and ${quest.goldReward} gold` : ''}!`
    });
  };

  // Reset daily quests
  const resetDailyQuests = () => {
    if (!user) return;

    // Generate new daily quests
    const updatedUser = generateTimeBasedQuests(user);
    
    // Update state
    setDailyQuests(updatedUser.dailyQuests || []);
    
    // Update user with timestamp
    updateCurrentUser({
      ...updatedUser,
      lastDailyQuestReset: new Date().toISOString()
    });

    toast.success("Daily quests have been refreshed!", {
      description: "Check out your new quests for today."
    });
  };

  // Complete a daily quest
  const completeDailyQuest = (questId: string) => {
    if (!user) return;

    // Find the quest
    const quest = dailyQuests.find(q => q.id === questId);
    if (!quest) {
      toast.error("Daily quest not found");
      return;
    }

    // Mark as completed
    const updatedDailyQuests = dailyQuests.map(q => 
      q.id === questId ? { ...q, completed: true, completedDate: new Date().toISOString() } : q
    );
    setDailyQuests(updatedDailyQuests);

    // Award XP
    let updatedUser = addExperience(user, quest.xpReward, `Completed daily quest: ${quest.title}`);

    // Award gold if any
    if (quest.goldReward && quest.goldReward > 0) {
      updatedUser = addItemToInventory(
        updatedUser, 
        'gold', 
        'Gold', 
        'Gold coins', 
        quest.goldReward
      );
    }

    // Update user
    updateCurrentUser({
      ...updatedUser,
      dailyQuests: updatedDailyQuests
    });

    // Show completion message
    toast.success(`Daily Quest Completed: ${quest.title}`, {
      description: `You earned ${quest.xpReward} XP${quest.goldReward ? ` and ${quest.goldReward} gold` : ''}!`
    });
  };

  return (
    <QuestsContext.Provider
      value={{
        quests,
        dailyQuests,
        activeQuest,
        setActiveQuest,
        completeQuest,
        resetDailyQuests,
        completeDailyQuest
      }}
    >
      {children}
    </QuestsContext.Provider>
  );
};
