
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
import { Progress } from '@/components/ui/progress';
import { Award, CheckCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TutorialStep } from '../types';
import { addExperience, addItemToInventory } from '../utils/xpUtils';
import { completeTutorial } from '../utils/authUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Lore Quest',
    description: 'Begin your adventure across the UK & Ireland! This quest will help you learn the basics.',
    completed: false
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
    id: 'quests',
    title: 'Tracking Quests',
    description: 'You can track achievements as quests. They appear in your active quests list.',
    completed: false
  }
];

const TUTORIAL_XP_REWARD = 150; // Enough to reach level 2

interface TutorialQuestProps {
  onComplete: () => void;
}

const TutorialQuest: React.FC<TutorialQuestProps> = ({ onComplete }) => {
  const { user, updateCurrentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    // Only show the tutorial for new users who haven't completed it
    if (user && !user.tutorialCompleted) {
      setOpen(true);
      setSteps([...TUTORIAL_STEPS]);
    }
  }, [user]);
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorialQuest();
    }
  };
  
  const completeTutorialQuest = () => {
    if (!user) return;
    
    // Mark all steps as completed
    const updatedSteps = steps.map(step => ({ ...step, completed: true }));
    setSteps(updatedSteps);
    
    // Mark as completed
    setCompleted(true);
    
    // Award XP to level up
    const updatedUser = addExperience(user, TUTORIAL_XP_REWARD, 'Tutorial Completion');
    
    // Add a weapon to the user's inventory
    addItemToInventory(
      updatedUser,
      'weapon',
      'Rusty Sword',
      'Your first weapon, earned from completing the tutorial quest',
      1
    );
    
    // Mark tutorial as completed
    completeTutorial(updatedUser.id);
    updateCurrentUser({...updatedUser, tutorialCompleted: true});
    
    // Close the dialog after a delay to allow the user to see the completion message
    setTimeout(() => {
      setOpen(false);
      onComplete();
    }, 3000);
  };
  
  const progress = Math.round((currentStep / (steps.length - 1)) * 100);
  
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
                You've earned {TUTORIAL_XP_REWARD} XP and a Rusty Sword for your inventory.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-lorequest-gold/10 p-4 rounded-lg border border-lorequest-gold/30">
                <h3 className="text-lg font-semibold text-lorequest-gold mb-1">
                  {steps[currentStep]?.title}
                </h3>
                <p className="text-lorequest-parchment text-sm">
                  {steps[currentStep]?.description}
                </p>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
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
        
        <DialogFooter>
          {!completed && (
            <Button 
              onClick={handleNextStep}
              className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark font-medium"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                'Complete Tutorial'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialQuest;
