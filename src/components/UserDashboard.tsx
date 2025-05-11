
import React, { useState } from 'react';
import { User, Achievement } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateLevelProgress, xpToNextLevel } from '../utils/xpUtils';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Award, Package, ScrollText, 
  ChevronDown, ChevronUp, Crown, CheckCircle2,
  Compass, MapIcon
} from 'lucide-react';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { trackAchievement, untrackAchievement } from '../utils/xpUtils';
import { getAchievementById } from '../utils/achievementsUtils';

const UserDashboard: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { user, updateCurrentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>('achievements');
  
  if (!user) return null;
  
  const levelProgress = calculateLevelProgress(user);
  const xpNeeded = xpToNextLevel(user.level);
  const currentLevelXp = user.experience - calculateLevelProgress(user.level);
  const progressXp = Math.floor((levelProgress * xpNeeded) / 100);
  
  const handleTrackAchievement = (achievementId: string) => {
    if (!user) return;
    
    const userAchievement = user.achievements.find(ua => ua.achievementId === achievementId);
    
    if (userAchievement) {
      if (userAchievement.isTracked) {
        const updatedUser = untrackAchievement(user, achievementId);
        updateCurrentUser(updatedUser);
      } else {
        const updatedUser = trackAchievement(user, achievementId);
        updateCurrentUser(updatedUser);
      }
    }
  };
  
  // Group achievements by type
  const territoryAchievements = user.achievements.filter(
    ua => {
      const achievement = getAchievementById(ua.achievementId);
      return achievement?.type === 'territory';
    }
  );
  
  const realmAchievements = user.achievements.filter(
    ua => {
      const achievement = getAchievementById(ua.achievementId);
      return achievement?.type === 'realm';
    }
  );
  
  const continentAchievements = user.achievements.filter(
    ua => {
      const achievement = getAchievementById(ua.achievementId);
      return achievement?.type === 'continent';
    }
  );
  
  const metaAchievements = user.achievements.filter(
    ua => {
      const achievement = getAchievementById(ua.achievementId);
      return achievement?.type === 'meta';
    }
  );
  
  // Filter active and completed quests
  const activeQuests = user.achievements.filter(
    ua => ua.isTracked && !ua.completed
  );
  
  const completedQuests = user.achievements.filter(
    ua => ua.completed
  );
  
  return (
    <div className="fixed inset-0 z-50 bg-lorequest-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[80vh] bg-lorequest-dark border border-lorequest-gold/30 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-lorequest-gold/10 border-b border-lorequest-gold/30">
          <h2 className="text-xl font-bold text-lorequest-gold flex items-center gap-2">
            <Shield size={20} />
            Adventurer Dashboard
          </h2>
          <button 
            onClick={onClose}
            className="text-lorequest-gold hover:text-white transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Level and XP Progress */}
        <div className="p-4 border-b border-lorequest-gold/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lorequest-gold font-medium">Level {user.level}</div>
            <div className="text-lorequest-gold text-sm">{progressXp} / {xpNeeded} XP</div>
          </div>
          <Progress value={levelProgress} className="h-2 bg-lorequest-dark" />
        </div>
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar">
          {/* Main Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Quests Section */}
            <button 
              onClick={() => setActiveSection(activeSection === 'quests' ? null : 'quests')}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                activeSection === 'quests' 
                  ? 'border-lorequest-gold bg-lorequest-gold/20' 
                  : 'border-lorequest-gold/30 hover:bg-lorequest-gold/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <ScrollText size={20} className="text-lorequest-gold" />
                <span className="font-bold text-lorequest-gold">Quests</span>
              </div>
              {activeSection === 'quests' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {/* Inventory Section */}
            <button 
              onClick={() => setActiveSection(activeSection === 'inventory' ? null : 'inventory')}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                activeSection === 'inventory' 
                  ? 'border-lorequest-gold bg-lorequest-gold/20' 
                  : 'border-lorequest-gold/30 hover:bg-lorequest-gold/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package size={20} className="text-lorequest-gold" />
                <span className="font-bold text-lorequest-gold">Inventory</span>
              </div>
              {activeSection === 'inventory' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {/* Achievements Section */}
            <button 
              onClick={() => setActiveSection(activeSection === 'achievements' ? null : 'achievements')}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                activeSection === 'achievements' 
                  ? 'border-lorequest-gold bg-lorequest-gold/20' 
                  : 'border-lorequest-gold/30 hover:bg-lorequest-gold/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award size={20} className="text-lorequest-gold" />
                <span className="font-bold text-lorequest-gold">Achievements</span>
              </div>
              {activeSection === 'achievements' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          
          {/* Quests Panel */}
          {activeSection === 'quests' && (
            <div className="bg-lorequest-dark/80 border border-lorequest-gold/30 rounded-lg p-4 mb-6 animate-fade-in">
              <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="active" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
                    Active Quests
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="data-[state=active]:bg-lorequest-gold data-[state=active]:text-lorequest-dark">
                    Completed Quests
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active">
                  {activeQuests.length === 0 ? (
                    <div className="text-center py-8 text-lorequest-parchment">
                      <p>No active quests. Track an achievement to add it here!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeQuests.map(quest => {
                        const achievement = getAchievementById(quest.achievementId);
                        return achievement ? (
                          <div key={quest.achievementId} className="border border-lorequest-gold/30 rounded-lg p-3 bg-lorequest-dark/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lorequest-gold">{achievement.name}</h4>
                                <p className="text-sm text-lorequest-parchment">{achievement.description}</p>
                              </div>
                              <button 
                                onClick={() => handleTrackAchievement(quest.achievementId)}
                                className="text-lorequest-gold hover:text-white transition-colors"
                                title="Untrack quest"
                              >
                                <span className="sr-only">Untrack</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6 6 18"></path>
                                  <path d="m6 6 12 12"></path>
                                </svg>
                              </button>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-lorequest-parchment">Progress</span>
                                <span className="text-xs text-lorequest-gold">{Math.floor(quest.progress * 100)}%</span>
                              </div>
                              <Progress value={quest.progress * 100} className="h-1 bg-lorequest-dark" />
                            </div>
                            <div className="mt-2 text-xs text-lorequest-gold">
                              Reward: {achievement.xpReward} XP
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed">
                  {completedQuests.length === 0 ? (
                    <div className="text-center py-8 text-lorequest-parchment">
                      <p>No quests completed yet. Begin your journey!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedQuests.map(quest => {
                        const achievement = getAchievementById(quest.achievementId);
                        return achievement ? (
                          <div key={quest.achievementId} className="border border-lorequest-gold/30 rounded-lg p-3 bg-lorequest-dark/50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lorequest-gold flex items-center gap-1">
                                  {achievement.name}
                                  <CheckCircle2 size={14} className="text-green-400" />
                                </h4>
                                <p className="text-sm text-lorequest-parchment">{achievement.description}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={100} className="h-1 bg-green-900" />
                            </div>
                            <div className="mt-2 text-xs text-green-400">
                              Reward: {achievement.xpReward} XP (Claimed)
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Inventory Panel */}
          {activeSection === 'inventory' && (
            <div className="bg-lorequest-dark/80 border border-lorequest-gold/30 rounded-lg p-4 mb-6 animate-fade-in">
              <h3 className="font-bold text-lorequest-gold mb-3">Your Items</h3>
              
              {user.inventory.length === 0 ? (
                <div className="text-center py-8 text-lorequest-parchment">
                  <p>Your inventory is empty. Explore to find items!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {user.inventory.map(item => (
                    <div key={item.id} className="border border-lorequest-gold/30 bg-lorequest-dark/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'rune' && <Crown size={18} className="text-lorequest-gold" />}
                        {item.type === 'compass' && <Compass size={18} className="text-lorequest-gold" />}
                        {item.type === 'map' && <MapIcon size={18} className="text-lorequest-gold" />}
                        <h4 className="font-medium text-lorequest-gold">{item.name}</h4>
                      </div>
                      {item.description && (
                        <p className="text-xs text-lorequest-parchment mt-1">{item.description}</p>
                      )}
                      <div className="text-xs text-lorequest-gold mt-2">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Achievements Panel */}
          {activeSection === 'achievements' && (
            <div className="bg-lorequest-dark/80 border border-lorequest-gold/30 rounded-lg p-4 mb-6 animate-fade-in">
              <h3 className="font-bold text-lorequest-gold mb-3">Achievements</h3>
              
              {/* Territory Achievements */}
              <div className="mb-6">
                <h4 className="text-lorequest-gold font-medium border-b border-lorequest-gold/20 pb-1 mb-3">
                  Territory Discoveries
                </h4>
                
                {territoryAchievements.length === 0 ? (
                  <p className="text-sm text-lorequest-parchment">Explore to unlock territory achievements!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {territoryAchievements.map(ua => {
                      const achievement = getAchievementById(ua.achievementId);
                      if (!achievement) return null;
                      
                      return (
                        <div 
                          key={ua.achievementId} 
                          className={`border rounded-md p-2 ${
                            ua.completed 
                              ? 'border-green-600/50 bg-green-900/20' 
                              : 'border-lorequest-gold/30 bg-lorequest-dark/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-sm text-lorequest-gold">{achievement.name}</h5>
                              <div className="mt-1">
                                <Progress value={ua.progress * 100} className="h-1 bg-lorequest-dark" />
                              </div>
                            </div>
                            {!ua.completed && (
                              <button 
                                onClick={() => handleTrackAchievement(ua.achievementId)}
                                className={`text-xs px-2 py-1 rounded ${
                                  ua.isTracked 
                                    ? 'bg-lorequest-gold/30 text-lorequest-gold' 
                                    : 'bg-lorequest-gold/10 text-lorequest-parchment hover:bg-lorequest-gold/30'
                                }`}
                              >
                                {ua.isTracked ? 'Tracked' : 'Track'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Realm Achievements */}
              <div className="mb-6">
                <h4 className="text-lorequest-gold font-medium border-b border-lorequest-gold/20 pb-1 mb-3">
                  Realm Mastery
                </h4>
                
                <div className="space-y-3">
                  {realmAchievements.map(ua => {
                    const achievement = getAchievementById(ua.achievementId);
                    if (!achievement) return null;
                    
                    return (
                      <div 
                        key={ua.achievementId} 
                        className={`border rounded-lg p-3 ${
                          ua.completed 
                            ? 'border-green-600/50 bg-green-900/20' 
                            : 'border-lorequest-gold/30 bg-lorequest-dark/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-lorequest-gold">{achievement.name}</h5>
                            <p className="text-xs text-lorequest-parchment">{achievement.description}</p>
                          </div>
                          {!ua.completed && (
                            <button 
                              onClick={() => handleTrackAchievement(ua.achievementId)}
                              className={`text-xs px-2 py-1 rounded ${
                                ua.isTracked 
                                  ? 'bg-lorequest-gold/30 text-lorequest-gold' 
                                  : 'bg-lorequest-gold/10 text-lorequest-parchment hover:bg-lorequest-gold/30'
                              }`}
                            >
                              {ua.isTracked ? 'Tracked' : 'Track'}
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-lorequest-parchment">Progress</span>
                            <span className="text-xs text-lorequest-gold">{Math.floor(ua.progress * 100)}%</span>
                          </div>
                          <Progress value={ua.progress * 100} className="h-1 bg-lorequest-dark" />
                        </div>
                        <div className="mt-2 text-xs text-lorequest-gold">
                          Reward: {achievement.xpReward} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Continent Achievements */}
              <div className="mb-6">
                <h4 className="text-lorequest-gold font-medium border-b border-lorequest-gold/20 pb-1 mb-3">
                  Continent Mastery
                </h4>
                
                <div className="space-y-3">
                  {continentAchievements.map(ua => {
                    const achievement = getAchievementById(ua.achievementId);
                    if (!achievement) return null;
                    
                    return (
                      <div 
                        key={ua.achievementId} 
                        className={`border rounded-lg p-3 ${
                          ua.completed 
                            ? 'border-green-600/50 bg-green-900/20' 
                            : 'border-lorequest-gold/30 bg-lorequest-dark/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-lorequest-gold">{achievement.name}</h5>
                            <p className="text-xs text-lorequest-parchment">{achievement.description}</p>
                          </div>
                          {!ua.completed && (
                            <button 
                              onClick={() => handleTrackAchievement(ua.achievementId)}
                              className={`text-xs px-2 py-1 rounded ${
                                ua.isTracked 
                                  ? 'bg-lorequest-gold/30 text-lorequest-gold' 
                                  : 'bg-lorequest-gold/10 text-lorequest-parchment hover:bg-lorequest-gold/30'
                              }`}
                            >
                              {ua.isTracked ? 'Tracked' : 'Track'}
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-lorequest-parchment">Progress</span>
                            <span className="text-xs text-lorequest-gold">{Math.floor(ua.progress * 100)}%</span>
                          </div>
                          <Progress value={ua.progress * 100} className="h-1 bg-lorequest-dark" />
                        </div>
                        <div className="mt-2 text-xs text-lorequest-gold">
                          Reward: {achievement.xpReward} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Meta Achievements */}
              <div>
                <h4 className="text-lorequest-gold font-medium border-b border-lorequest-gold/20 pb-1 mb-3">
                  Legendary Achievements
                </h4>
                
                <div className="space-y-3">
                  {metaAchievements.map(ua => {
                    const achievement = getAchievementById(ua.achievementId);
                    if (!achievement) return null;
                    
                    return (
                      <div 
                        key={ua.achievementId} 
                        className={`border rounded-lg p-3 ${
                          ua.completed 
                            ? 'border-green-600/50 bg-green-900/20' 
                            : 'border-lorequest-gold/30 bg-lorequest-dark/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-lorequest-gold">{achievement.name}</h5>
                            <p className="text-xs text-lorequest-parchment">{achievement.description}</p>
                          </div>
                          {!ua.completed && (
                            <button 
                              onClick={() => handleTrackAchievement(ua.achievementId)}
                              className={`text-xs px-2 py-1 rounded ${
                                ua.isTracked 
                                  ? 'bg-lorequest-gold/30 text-lorequest-gold' 
                                  : 'bg-lorequest-gold/10 text-lorequest-parchment hover:bg-lorequest-gold/30'
                              }`}
                            >
                              {ua.isTracked ? 'Tracked' : 'Track'}
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-lorequest-parchment">Progress</span>
                            <span className="text-xs text-lorequest-gold">{Math.floor(ua.progress * 100)}%</span>
                          </div>
                          <Progress value={ua.progress * 100} className="h-1 bg-lorequest-dark" />
                        </div>
                        <div className="mt-2 text-xs text-lorequest-gold">
                          Reward: {achievement.xpReward} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
