import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/Progress';
import { Award, CheckCircle, ChevronRight, ChevronLeft, Shield, Wand, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TutorialStep, PlayerClass, CLASS_DESCRIPTIONS, QUEST_TYPES } from '../types';
import { addExperience, addItemToInventory, updateUserStats } from '../utils/xpUtils';
import { completeTutorial, setUserClass } from '../utils/authUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import WalkingTracker from './WalkingTracker';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Lore Quest',
    description: 'Begin your adventure across the UK & Ireland! This quest will help you learn the basics.',
    completed: false
  },
  {
    id: 'class',
    title: 'Choose Your Class',
    description: 'Select a character class to begin your journey. Each class has different strengths and abilities.',
    completed: false,
    requirement: {
      type: 'class',
      value: 'any'
    }
  },
  {
    id: 'map',
    title: 'Exploring the Map',
    description: 'Use the map to navigate. Click "Begin Quest" to start tracking your location and discover new territories.',
    completed: false
  },
  {
    id: 'territories',
    title: 'Discovering Territories',
    description: 'When you get close enough to a location, you\'ll discover it automatically. Look for them on your sidebar.',
    completed: false
  },
  {
    id: 'achievements',
    title: 'Earning Achievements',
    description: 'Discover territories, realms, and continents to earn achievements and gain XP.',
    completed: false
  },
  {
    id: 'walking',
    title: 'Walking to Earn XP',
    description: 'Walk 1 kilometer to earn XP and complete quests. For this tutorial, you can use the simulator to track progress.',
    completed: false,
    requirement: {
      type: 'walk',
      value: 1 // 1 kilometer
    }
  },
  {
    id: 'quests',
    title: 'Tracking Quests',
    description: 'You can track achievements as quests. They appear in your active quests list.',
    completed: false
  }
];

const TUTORIAL_XP_REWARD = 150; // Enough to reach level 2
const TUTORIAL_GOLD_REWARD = 50; // Starting gold

interface TutorialQuestProps {
  onComplete: () => void;
}

const TutorialQuest: React.FC<TutorialQuestProps> = ({ onComplete }) => {
  const { user, updateCurrentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [walkingDistance, setWalkingDistance] = useState(0);
  
  useEffect(() => {
    // Only show the tutorial for new users who haven't completed it
    if (user && !user.tutorialCompleted) {
      setOpen(true);
      setSteps([...TUTORIAL_STEPS]);
    }
  }, [user]);
  
  const handleNextStep = () => {
    // Check if current step has a requirement
    const currentStepData = steps[currentStep];
    if (currentStepData.requirement) {
      // Check class selection requirement
      if (currentStepData.requirement.type === 'class' && !selectedClass) {
        return; // Can't proceed without class selection
      }
      
      // Check walking requirement
      if (currentStepData.requirement.type === 'walk') {
        const requiredDistance = Number(currentStepData.requirement.value);
        if (walkingDistance < requiredDistance) {
          return; // Can't proceed until walking requirement is met
        }
      }
    }
    
    if (currentStep < steps.length - 1) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorialQuest();
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleClassSelection = (playerClass: PlayerClass) => {
    setSelectedClass(playerClass);
  };
  
  const updateWalkingProgress = (distanceAdded: number) => {
    setWalkingDistance(prev => prev + distanceAdded);
  };
  
  const giveClassSpecificWeapon = (user: any, playerClass: PlayerClass) => {
    if (!playerClass || !CLASS_DESCRIPTIONS[playerClass]) return user;
    
    const classInfo = CLASS_DESCRIPTIONS[playerClass];
    const weapon = classInfo.initialWeapon;
    
    // Add the weapon to inventory as an equippable item
    addItemToInventory(
      user,
      'weapon',
      weapon.name,
      `Your first weapon as a ${playerClass}. Grants +1 ${weapon.statBonus.attribute}.`,
      1,
      playerClass === 'Knight' ? '🗡️' : playerClass === 'Wizard' ? '🪄' : '🏹',
      'none',
      0,
      true,
      {
        slot: 'mainWeapon',
        attackType: weapon.attackType,
        statBonuses: [{ attribute: weapon.statBonus.attribute, value: weapon.statBonus.value }],
        requiredClass: playerClass,
        requiredLevel: 1
      }
    );
    
    return user;
  };
  
  const completeTutorialQuest = () => {
    if (!user || !selectedClass) return;
    
    // Mark all steps as completed
    const updatedSteps = steps.map(step => ({ ...step, completed: true }));
    setSteps(updatedSteps);
    
    // Mark as completed
    setCompleted(true);
    
    // Set user class
    let updatedUser = setUserClass(user.id, selectedClass);
    
    // Initialize equipment slots if they don't exist
    if (!updatedUser.equipment) {
      updatedUser.equipment = {};
    }
    
    // Award XP to level up
    updatedUser = addExperience(updatedUser, TUTORIAL_XP_REWARD, 'Tutorial Completion');
    
    // Add gold
    updatedUser.gold = (updatedUser.gold || 0) + TUTORIAL_GOLD_REWARD;
    
    // Add class-specific weapon to the user's inventory
    updatedUser = giveClassSpecificWeapon(updatedUser, selectedClass);
    
    // Update stats
    updateUserStats(updatedUser, {
      questsCompleted: 1,
      questXpEarned: TUTORIAL_XP_REWARD,
      totalXpEarned: TUTORIAL_XP_REWARD,
      questGoldEarned: TUTORIAL_GOLD_REWARD,
      totalGoldEarned: TUTORIAL_GOLD_REWARD
    });
    
    // Add starter quest for armor set
    addStarterQuest(updatedUser);
    
    // Mark tutorial as completed
    completeTutorial(updatedUser.id);
    updateCurrentUser({...updatedUser, tutorialCompleted: true});
    
    // Close the dialog after a delay to allow the user to see the completion message
    setTimeout(() => {
      setOpen(false);
      onComplete();
    }, 3000);
  };
  
  const addStarterQuest = (user: any) => {
    // Check if user already has the starter quest
    if (!user.activeQuests) {
      user.activeQuests = [];
    }
    
    const starterQuestId = 'starter-walking-quest';
    
    // Check if user already has the starter quest
    if (!user.activeQuests.includes(starterQuestId)) {
      // Add starter quest to active quests
      user.activeQuests.push(starterQuestId);
      
      // Store the quest in localStorage
      const QUESTS_STORAGE_KEY = `lorequest_quests_${user.id}`;
      
      try {
        const storedQuests = localStorage.getItem(QUESTS_STORAGE_KEY);
        let questsData = storedQuests ? JSON.parse(storedQuests) : { 
          daily: [], weekly: [], monthly: [], custom: [] 
        };
        
        if (!questsData.custom) {
          questsData.custom = [];
        }
        
        // Create the starter quest
        const starterQuest = {
          id: starterQuestId,
          name: QUEST_TYPES.STARTER.WALKING_DISTANCE.name,
          description: QUEST_TYPES.STARTER.WALKING_DISTANCE.description,
          type: QUEST_TYPES.STARTER.WALKING_DISTANCE.type,
          targetCount: QUEST_TYPES.STARTER.WALKING_DISTANCE.targetCount,
          xpReward: QUEST_TYPES.STARTER.WALKING_DISTANCE.xpReward,
          goldReward: QUEST_TYPES.STARTER.WALKING_DISTANCE.goldReward,
          completed: false,
          progress: 0,
          itemReward: {
            type: 'armor',
            name: `${user.playerClass} Armor Set`,
            quantity: 5
          }
        };
        
        questsData.custom.push(starterQuest);
        localStorage.setItem(QUESTS_STORAGE_KEY, JSON.stringify(questsData));
      } catch (error) {
        console.error('Failed to add starter quest:', error);
      }
    }
    
    return user;
  };
  
  const progress = Math.round((currentStep / (steps.length - 1)) * 100);
  
  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    if (!currentStepData) return null;
    
    switch (currentStepData.id) {
      case 'class':
        return (
          <div className="space-y-4">
            <RadioGroup 
              value={selectedClass || ""} 
              onValueChange={(value) => handleClassSelection(value as PlayerClass)}
              className="space-y-4"
            >
              <div className="bg-lorequest-gold/10 p-4 rounded-lg border border-lorequest-gold/30 cursor-pointer hover:bg-lorequest-gold/20 transition-colors">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="Knight" id="knight" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="knight" className="flex items-center text-lorequest-gold font-semibold cursor-pointer">
                      <Shield size={16} className="mr-2" /> Knight
                    </Label>
                    <p className="text-lorequest-parchment text-sm mt-1">
                      {CLASS_DESCRIPTIONS.Knight.description}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-lorequest-parchment">
                      <div>STR: {CLASS_DESCRIPTIONS.Knight.baseStats.strength}</div>
                      <div>INT: {CLASS_DESCRIPTIONS.Knight.baseStats.intelligence}</div>
                      <div>DEX: {CLASS_DESCRIPTIONS.Knight.baseStats.dexterity}</div>
                    </div>
                    <div className="mt-2 text-xs text-lorequest-parchment">
                      Starting Weapon: <span className="text-lorequest-gold">{CLASS_DESCRIPTIONS.Knight.initialWeapon.name}</span> (+1 STR)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-lorequest-gold/10 p-4 rounded-lg border border-lorequest-gold/30 cursor-pointer hover:bg-lorequest-gold/20 transition-colors">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="Wizard" id="wizard" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="wizard" className="flex items-center text-lorequest-gold font-semibold cursor-pointer">
                      <Wand size={16} className="mr-2" /> Wizard
                    </Label>
                    <p className="text-lorequest-parchment text-sm mt-1">
                      {CLASS_DESCRIPTIONS.Wizard.description}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-lorequest-parchment">
                      <div>STR: {CLASS_DESCRIPTIONS.Wizard.baseStats.strength}</div>
                      <div>INT: {CLASS_DESCRIPTIONS.Wizard.baseStats.intelligence}</div>
                      <div>DEX: {CLASS_DESCRIPTIONS.Wizard.baseStats.dexterity}</div>
                    </div>
                    <div className="mt-2 text-xs text-lorequest-parchment">
                      Starting Weapon: <span className="text-lorequest-gold">{CLASS_DESCRIPTIONS.Wizard.initialWeapon.name}</span> (+1 INT)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-lorequest-gold/10 p-4 rounded-lg border border-lorequest-gold/30 cursor-pointer hover:bg-lorequest-gold/20 transition-colors">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="Ranger" id="ranger" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="ranger" className="flex items-center text-lorequest-gold font-semibold cursor-pointer">
                      <Activity size={16} className="mr-2" /> Ranger
                    </Label>
                    <p className="text-lorequest-parchment text-sm mt-1">
                      {CLASS_DESCRIPTIONS.Ranger.description}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-lorequest-parchment">
                      <div>STR: {CLASS_DESCRIPTIONS.Ranger.baseStats.strength}</div>
                      <div>INT: {CLASS_DESCRIPTIONS.Ranger.baseStats.intelligence}</div>
                      <div>DEX: {CLASS_DESCRIPTIONS.Ranger.baseStats.dexterity}</div>
                    </div>
                    <div className="mt-2 text-xs text-lorequest-parchment">
                      Starting Weapon: <span className="text-lorequest-gold">{CLASS_DESCRIPTIONS.Ranger.initialWeapon.name}</span> (+1 DEX)
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        );
      
      case 'walking':
        return (
          <div className="space-y-4">
            <WalkingTracker 
              showDetails={true}
              onWalkingProgress={updateWalkingProgress}
              tutorialMode={true}
              tutorialTarget={1.0}
            />
            <div className="text-center text-lorequest-parchment text-sm">
              Walking progress: {walkingDistance.toFixed(2)} / 1.0 km
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-lorequest-gold/10 p-4 rounded-lg border border-lorequest-gold/30">
            <h3 className="text-lg font-semibold text-lorequest-gold mb-1">
              {currentStepData.title}
            </h3>
            <p className="text-lorequest-parchment text-sm">
              {currentStepData.description}
            </p>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] bg-lorequest-dark border-lorequest-gold/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-lorequest-gold flex items-center gap-2">
            <Award className="text-lorequest-gold" />
            Tutorial Quest
          </DialogTitle>
          <DialogDescription className="text-lorequest-parchment">
            {completed 
              ? "Congratulations! You've completed the tutorial quest."
              : "Complete this quest to learn the basics and earn rewards"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-lorequest-parchment">Progress</span>
            <span className="text-sm text-lorequest-gold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-4 my-4">
          {completed ? (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-lorequest-gold">Tutorial Complete!</h3>
              <p className="text-lorequest-parchment">
                You've earned {TUTORIAL_XP_REWARD} XP, {TUTORIAL_GOLD_REWARD} Gold, and a {selectedClass && CLASS_DESCRIPTIONS[selectedClass].initialWeapon.name} for your inventory.
              </p>
              <p className="text-lorequest-parchment text-sm">
                Your class: <span className="text-lorequest-gold">{selectedClass}</span>
              </p>
              <div className="text-lorequest-parchment text-sm p-4 bg-lorequest-gold/10 rounded-lg mt-4">
                <p className="font-medium text-lorequest-gold mb-2">Your next quest: First Steps</p>
                <p>Walk 1 km to complete your first quest and earn a full armor set appropriate for your class!</p>
              </div>
            </div>
          ) : (
            <>
              {renderStepContent()}
              
              <div className="grid grid-cols-7 gap-2">
                {steps.map((step, index) => (
                  <TooltipProvider key={step.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={`h-2 rounded-full ${
                            index < currentStep 
                              ? 'bg-green-500' 
                              : index === currentStep 
                              ? 'bg-lorequest-gold' 
                              : 'bg-lorequest-gold/20'
                          }`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{step.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          {!completed && (
            <>
              <Button 
                onClick={handlePrevStep}
                variant="outline"
                disabled={currentStep === 0}
                className="border-lorequest-gold/30 text-lorequest-parchment"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              
              <Button 
                onClick={handleNextStep}
                className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark font-medium"
                disabled={
                  (steps[currentStep]?.requirement?.type === 'class' && !selectedClass) ||
                  (steps[currentStep]?.requirement?.type === 'walk' && walkingDistance < 1)
                }
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  'Complete Tutorial'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialQuest;
