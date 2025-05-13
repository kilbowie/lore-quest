import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RandomEncountersProps {
  distanceTraveled: number;
  onClose?: () => void;
}

const RandomEncounters: React.FC<RandomEncountersProps> = ({ distanceTraveled, onClose }) => {
  // Implementation
  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Encounters</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Distance traveled: {distanceTraveled}m</p>
        {onClose && (
          <button onClick={onClose}>Close</button>
        )}
      </CardContent>
    </Card>
  );
};

export default RandomEncounters;
