
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RandomEncountersProps {
  distanceTraveled: number;
  onClose?: () => void;
}

const RandomEncounters: React.FC<RandomEncountersProps> = ({ distanceTraveled, onClose }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Encounters</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Distance traveled: {distanceTraveled}m</p>
        {onClose && (
          <Button onClick={onClose}>Close</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RandomEncounters;
