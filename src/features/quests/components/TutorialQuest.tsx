
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, HelpCircle, MapPin, X } from 'lucide-react';
import {
  TutorialQuest as TutorialQuestType,
  TutorialStep,
  CLASS_DESCRIPTIONS,
  STARTER_QUEST_REWARDS,
  EquippableItem,
  EquipmentSlot,
  ItemType
} from '@/types';
import { completeTutorial, setUserClass } from '@/utils/authUtils';
import { addExperience, addItemToInventory, equipItem } from '@/utils/xpUtils';
import WalkingTracker from '@/features/exploration/components/WalkingTracker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const TutorialQuest: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const [tutorialQuest, setTutorialQuest] = useState<TutorialQuestType | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [walkingProgress, setWalkingProgress] = useState(0);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialTarget, setTutorialTarget] = useState(0);
  const navigate = useNavigate();

  // Initialize tutorial status
  useEffect(() => {
    if (user) {
      // Only show tutorial if not completed
      if (!user.tutorialCompleted) {
        setTutorialMode(true);
        
        // Define the tutorial quest
        const initialQuest: TutorialQuestType = {
          id: 'starter-tutorial',
          title: 'Welcome to LoreQuest!',
          description: 'Learn the basics to start your adventure.',
          steps: [
            {
              id: 'step-1',
              title: 'Choose Your Class',
              description: 'Select a class that suits your playstyle.',
              completed: !!user.playerClass,
              requirement: { type: 'class', value: '' }
            },
            {
              id: 'step-2',
              title: 'Embark on a Journey',
              description: 'Walk a short distance to familiarize yourself with exploration.',
              completed: walkingProgress >= 1,
              requirement: { type: 'walk', value: 1 }
            },
            {
              id: 'step-3',
              title: 'Discover a Location',
              description: 'Find a nearby location to expand your map.',
              completed: user.discoveredLocations.length > 0,
              requirement: { type: 'discover', value: 1 }
            }
          ],
          xpReward: 200,
          goldReward: 100
        };

        setTutorialQuest(initialQuest);
        setTutorialTarget(initialQuest.steps.filter(step => step.requirement?.type === 'walk')[0]?.requirement?.value as number || 1);
        
        // Initialize the current step based on what's already completed
        if (user.playerClass) {
          setCurrentStepIndex(1);
        }
      } else {
        setTutorialMode(false);
      }
    }
  }, [user]);

  // Update walking progress step when progress changes
  useEffect(() => {
    if (walkingProgress >= tutorialTarget && currentStepIndex === 1) {
      markStepComplete(1);
    }
  }, [walkingProgress, tutorialTarget, currentStepIndex]);

  // Update location discovery step when locations change
  useEffect(() => {
    if (user && user.discoveredLocations.length > 0 && currentStepIndex === 2) {
      markStepComplete(2);
    }
  }, [user?.discoveredLocations, currentStepIndex]);

  const currentStep = tutorialQuest?.steps[currentStepIndex];
  const isQuestComplete = tutorialQuest?.steps.every(step => step.completed);

  const handleClassSelect = (playerClass: 'Knight' | 'Wizard' | 'Ranger') => {
    if (!user) return;

    // Set the user's class
    const updatedUser = setUserClass(user.id, playerClass);

    // Get the starter armor set for the selected class
    const starterArmorSet = STARTER_QUEST_REWARDS[playerClass].armorSet;

    // Equip each piece of armor
    let userWithArmor = { ...updatedUser };
    for (const slot in starterArmorSet) {
      if (starterArmorSet.hasOwnProperty(slot)) {
        const armorPiece = starterArmorSet[slot as keyof typeof starterArmorSet];
        if (armorPiece) {
          // Add the armor piece to the user's inventory
          userWithArmor = addItemToInventory(
            userWithArmor,
            armorPiece.type as ItemType,
            armorPiece.name || 'Armor Piece',
            armorPiece.description || 'A piece of armor',
            1,
            armorPiece.icon,
            armorPiece.useEffect,
            armorPiece.value,
            true,
            armorPiece.equipmentStats
          );

          // Equip the armor piece
          const itemToEquip = userWithArmor.inventory.find(
            item => item.name === armorPiece.name && item.isEquippable
          );
          if (itemToEquip) {
            userWithArmor = equipItem(userWithArmor, itemToEquip.id);
          }
        }
      }
    }

    // Update the user
    updateCurrentUser(userWithArmor);

    // Mark the step as complete
    markStepComplete(0);
  };

  const handleWalkingProgress = (distanceAdded: number) => {
    setWalkingProgress(prevProgress => prevProgress + distanceAdded);
  };

  const markStepComplete = (stepIndex: number) => {
    if (!tutorialQuest) return;

    const updatedSteps = [...tutorialQuest.steps];
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], completed: true };

    setTutorialQuest({ ...tutorialQuest, steps: updatedSteps });
    setCurrentStepIndex(prevIndex => Math.min(prevIndex + 1, tutorialQuest.steps.length - 1));
  };

  const handleCompleteQuest = () => {
    if (!user || !tutorialQuest) return;

    // Award the quest rewards
    let updatedUser = addExperience(user, tutorialQuest.xpReward, 'Tutorial Complete!');
    updatedUser = addItemToInventory(updatedUser, 'gold', 'Gold', 'Gold coins', tutorialQuest.goldReward);

    // Mark the tutorial as complete
    updatedUser = { ...updatedUser, tutorialCompleted: true };
    completeTutorial(user.id);

    // Update the user
    updateCurrentUser(updatedUser);
    setTutorialMode(false);
    toast.success("Tutorial Completed!", {
      description: "You have completed the tutorial and are now ready to explore the world!"
    });
    navigate('/');
  };
  
  // Close tutorial
  const handleCloseTutorial = () => {
    setTutorialMode(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!tutorialMode) {
    return null;
  }

  return (
    <Card className="bg-zinc-950/50 text-zinc-100 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-2 z-10"
        onClick={handleCloseTutorial}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="mr-2 h-4 w-4" /> Tutorial Quest
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep ? (
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{currentStep.title}</h3>
            <p className="text-sm">{currentStep.description}</p>
            {!currentStep.completed && (
              <>
                {currentStep.id === 'step-1' && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">Choose your class:</p>
                    <div className="flex gap-2">
                      {Object.keys(CLASS_DESCRIPTIONS).map((classKey) => (
                        <Button
                          key={classKey}
                          onClick={() => handleClassSelect(classKey as 'Knight' | 'Wizard' | 'Ranger')}
                          className="w-24"
                        >
                          {classKey}
                        </Button>
                      ))}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-pointer inline-block ml-1" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {Object.entries(CLASS_DESCRIPTIONS).map(([className, classDetails]) => (
                            <div key={className} className="mb-2">
                              <h4 className="font-semibold">{className}:</h4>
                              <p className="text-sm">{classDetails.description}</p>
                            </div>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                {currentStep.id === 'step-2' && (
                  <div className="mt-4">
                    <p className="text-sm">Walk {tutorialTarget} km to complete this step.</p>
                    <WalkingTracker 
                      showDetails={showDetails} 
                      onWalkingProgress={handleWalkingProgress} 
                      tutorialMode={true}
                      tutorialTarget={tutorialTarget}
                    />
                  </div>
                )}
                {currentStep.id === 'step-3' && (
                  <div className="mt-4">
                    <p className="text-sm">Discover a new location on the map.</p>
                    <Button onClick={() => navigate('/')}>
                      Go to Map <MapPin className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
            {currentStep.completed && (
              <div className="flex items-center mt-2 text-green-500">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Step Complete
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p>Tutorial completed!</p>
            <Button onClick={handleCompleteQuest}>Claim Rewards</Button>
          </div>
        )}
        {isQuestComplete && (
          <div className="text-center">
            <p>All steps completed!</p>
            <Button onClick={handleCompleteQuest}>Claim Rewards</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TutorialQuest;
