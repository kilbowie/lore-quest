
import React from 'react';

// Add proper props interface
interface TutorialQuestProps {
  onComplete: () => void;
}

const TutorialQuest: React.FC<TutorialQuestProps> = ({ onComplete }) => {
  // Implement the component content here
  return (
    <div>
      <h2>Tutorial Quest</h2>
      <button onClick={onComplete}>Complete Tutorial</button>
    </div>
  );
};

export default TutorialQuest;
