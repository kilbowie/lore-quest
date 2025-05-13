
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RandomEncountersProps {
  distanceTraveled: number;
  onClose?: () => void;
  onComplete?: () => void;
}

const RandomEncounters: React.FC<RandomEncountersProps> = ({ 
  distanceTraveled, 
  onClose,
  onComplete 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Encounters</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Distance traveled: {distanceTraveled}m</p>
        <div className="flex gap-2 mt-4">
          {onClose && (
            <Button onClick={onClose}>Close</Button>
          )}
          {onComplete && (
            <Button onClick={onComplete} variant="outline">Complete</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RandomEncounters;
