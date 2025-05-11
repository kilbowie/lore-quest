
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateTimeBasedQuests, getTimeBasedQuests } from '../utils/xpUtils';
import { Progress } from '@/components/Progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle } from 'lucide-react';

const TimedQuests: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Generate time-based quests if needed
      const updatedUser = generateTimeBasedQuests(user);
      if (updatedUser !== user) {
        updateCurrentUser(updatedUser);
      }
    }
  }, [user]);
  
  if (!user) return null;
  
  const quests = getTimeBasedQuests(user.id);
  
  // Format time remaining
  const formatTimeRemaining = (expiresAt: Date | undefined) => {
    if (!expiresAt) return 'Unknown';
    
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };
  
  const renderQuestList = (questList: any[]) => {
    if (questList.length === 0) {
      return (
        <div className="text-center py-6 text-lorequest-parchment">
          No quests available
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {questList.map(quest => (
          <Card key={quest.id} className="bg-lorequest-dark border-lorequest-gold/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-1 text-lorequest-gold">
                  {quest.completed && <CheckCircle size={16} className="text-green-500" />}
                  {quest.name}
                </CardTitle>
                <span className="text-xs text-lorequest-parchment/70">
                  {formatTimeRemaining(quest.expiresAt)}
                </span>
              </div>
              <CardDescription className="text-lorequest-parchment text-xs">
                {quest.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-lorequest-parchment">Progress</span>
                  <span className="text-lorequest-gold">
                    {Math.floor(quest.progress * 100)}%
                  </span>
                </div>
                <Progress 
                  value={quest.progress * 100} 
                  className="h-1.5"
                  indicatorClassName={quest.completed ? "bg-green-500" : undefined}
                />
                
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-lorequest-parchment/70">
                    {quest.targetCount && (
                      <span>Target: {quest.targetCount} km</span>
                    )}
                  </div>
                  <div className="space-x-2 text-lorequest-gold">
                    {quest.xpReward && <span>{quest.xpReward} XP</span>}
                    {quest.goldReward && <span>{quest.goldReward} Gold</span>}
                    {quest.itemReward && (
                      <span>{quest.itemReward.quantity}x {quest.itemReward.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-lorequest-gold flex items-center gap-2">
          <Clock size={18} />
          Scheduled Quests
        </h3>
      </div>
      
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
            Monthly
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          {renderQuestList(quests.daily)}
        </TabsContent>
        
        <TabsContent value="weekly">
          {renderQuestList(quests.weekly)}
        </TabsContent>
        
        <TabsContent value="monthly">
          {renderQuestList(quests.monthly)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimedQuests;
