
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Compass, Award, ScrollText, Activity, BaggageClaim, Shield, Clock } from 'lucide-react';
import { initializeUserStats } from '../utils/xpUtils';
import { getUserWalkingData } from '../utils/xpUtils';
import { Progress } from '@/components/Progress';
import { getTimeBasedQuests } from '../utils/xpUtils';

const StatsTracker: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Ensure user has stats
  if (!user.stats) {
    initializeUserStats(user);
  }
  
  // Get walking data
  const walkingData = getUserWalkingData(user.id);
  
  // Get scheduled quests
  const quests = getTimeBasedQuests(user.id);
  
  // Calculate quest completion rates
  const dailyCompletionRate = quests.daily.length ? quests.daily.filter(q => q.completed).length / quests.daily.length * 100 : 0;
  const weeklyCompletionRate = quests.weekly.length ? quests.weekly.filter(q => q.completed).length / quests.weekly.length * 100 : 0;
  const monthlyCompletionRate = quests.monthly.length ? quests.monthly.filter(q => q.completed).length / quests.monthly.length * 100 : 0;
  
  const statCards = [
    {
      title: 'Distance & Discovery',
      icon: <Compass className="h-4 w-4" />,
      items: [
        { label: 'Distance Travelled', value: `${user.stats.distanceTravelled.toFixed(2)} km` },
        { label: 'Locations Discovered', value: user.stats.locationsDiscovered },
      ]
    },
    {
      title: 'Experience',
      icon: <Award className="h-4 w-4" />,
      items: [
        { label: 'Total XP Earned', value: user.stats.totalXpEarned },
        { label: 'Quest XP Earned', value: user.stats.questXpEarned },
        { label: 'Walking XP Earned', value: user.stats.walkingXpEarned },
      ]
    },
    {
      title: 'Gold',
      icon: <BaggageClaim className="h-4 w-4" />,
      items: [
        { label: 'Total Gold Earned', value: user.stats.totalGoldEarned },
        { label: 'Quest Gold Earned', value: user.stats.questGoldEarned },
        { label: 'Current Gold', value: user.gold || 0 },
      ]
    },
    {
      title: 'Quests',
      icon: <ScrollText className="h-4 w-4" />,
      items: [
        { label: 'Quests Completed', value: user.stats.questsCompleted },
        { label: 'Achievements Unlocked', value: user.stats.achievementsUnlocked },
      ]
    },
    {
      title: 'Scheduled Quests',
      icon: <Clock className="h-4 w-4" />,
      items: [
        { label: 'Daily Quests Completed', value: user.stats.dailyQuestsCompleted },
        { label: 'Weekly Quests Completed', value: user.stats.weeklyQuestsCompleted },
        { label: 'Monthly Quests Completed', value: user.stats.monthlyQuestsCompleted },
      ]
    },
    {
      title: 'Character Stats',
      icon: <Shield className="h-4 w-4" />,
      items: [
        { label: 'Strength (STR)', value: user.stats.strength },
        { label: 'Intelligence (INT)', value: user.stats.intelligence },
        { label: 'Dexterity (DEX)', value: user.stats.dexterity },
      ]
    }
  ];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="summary" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
            Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
            Detailed Stats
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <div className="space-y-5">
            {/* Walking Stats */}
            <Card className="bg-lorequest-dark border-lorequest-gold/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-1 text-lorequest-gold">
                    <Activity size={18} />
                    Walking Progress
                  </CardTitle>
                  <span className="text-sm text-lorequest-gold">{walkingData.totalDistanceKm.toFixed(2)} km today</span>
                </div>
                <CardDescription className="text-lorequest-parchment">
                  Total distance walked and XP earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-lorequest-parchment">Total Distance</span>
                      <span className="text-lorequest-gold">{user.stats.distanceTravelled.toFixed(2)} km</span>
                    </div>
                    <Progress value={Math.min(100, user.stats.distanceTravelled)} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-lorequest-parchment">Walking XP</span>
                      <span className="text-lorequest-gold">{walkingData.earnedXP}</span>
                    </div>
                    <Progress value={Math.min(100, walkingData.earnedXP / 10)} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quest Progress */}
            <Card className="bg-lorequest-dark border-lorequest-gold/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-1 text-lorequest-gold">
                    <ScrollText size={18} />
                    Quest Progress
                  </CardTitle>
                </div>
                <CardDescription className="text-lorequest-parchment">
                  Daily, weekly and monthly quest completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-lorequest-parchment">Daily</span>
                      <span className="text-lorequest-gold">
                        {quests.daily.filter(q => q.completed).length}/{quests.daily.length}
                      </span>
                    </div>
                    <Progress value={dailyCompletionRate} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-lorequest-parchment">Weekly</span>
                      <span className="text-lorequest-gold">
                        {quests.weekly.filter(q => q.completed).length}/{quests.weekly.length}
                      </span>
                    </div>
                    <Progress value={weeklyCompletionRate} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-lorequest-parchment">Monthly</span>
                      <span className="text-lorequest-gold">
                        {quests.monthly.filter(q => q.completed).length}/{quests.monthly.length}
                      </span>
                    </div>
                    <Progress value={monthlyCompletionRate} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Character Status */}
            <Card className="bg-lorequest-dark border-lorequest-gold/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-1 text-lorequest-gold">
                    <Shield size={18} />
                    Character Status
                  </CardTitle>
                  <span className="text-sm text-lorequest-gold">Level {user.level}</span>
                </div>
                <CardDescription className="text-lorequest-parchment">
                  Health, mana, and stamina status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-400">Health</span>
                      <span className="text-red-400">
                        {user.health}/{user.maxHealth}
                      </span>
                    </div>
                    <Progress 
                      value={user.health / user.maxHealth * 100} 
                      className="h-1.5 bg-red-950"
                      indicatorClassName="bg-red-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-blue-400">Mana</span>
                      <span className="text-blue-400">
                        {user.mana}/{user.maxMana}
                      </span>
                    </div>
                    <Progress 
                      value={user.mana / user.maxMana * 100} 
                      className="h-1.5 bg-blue-950"
                      indicatorClassName="bg-blue-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-400">Stamina</span>
                      <span className="text-green-400">
                        {user.stamina}/{user.maxStamina}
                      </span>
                    </div>
                    <Progress 
                      value={user.stamina / user.maxStamina * 100} 
                      className="h-1.5 bg-green-950"
                      indicatorClassName="bg-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {statCards.map((card, i) => (
              <Card key={i} className="bg-lorequest-dark border-lorequest-gold/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-1 text-lorequest-gold">
                    {card.icon}
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {card.items.map((item, j) => (
                      <li key={j} className="flex justify-between items-center text-sm">
                        <span className="text-lorequest-parchment">{item.label}</span>
                        <span className="text-lorequest-gold font-medium">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatsTracker;
