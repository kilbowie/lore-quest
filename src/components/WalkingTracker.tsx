import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

interface WalkingTrackerProps {
  onClose?: () => void;
  onComplete?: () => void;
}

const WalkingTracker: React.FC<WalkingTrackerProps> = ({
  onClose,
  onComplete
}) => {
  const [distance, setDistance] = useState<number>(0);

  // Update the UI
  return (
    <Card className="bg-zinc-950 border border-zinc-800 text-zinc-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lorequest-gold">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Walking Quest
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Distance walked:</span>
          <span className="font-medium">{distance.toFixed(2)} meters</span>
        </div>
        
        <div className="w-full bg-zinc-800 rounded-full h-2.5">
          <div 
            className="bg-lorequest-gold h-2.5 rounded-full" 
            style={{ width: `${Math.min(distance / 100 * 100, 100)}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-zinc-400">
          Walk at least 100 meters to earn rewards
        </p>
        
        <div className="flex gap-2 pt-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
          
          {onComplete && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onComplete} 
              disabled={distance < 100}
            >
              Claim Reward
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalkingTracker;
