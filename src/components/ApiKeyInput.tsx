
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-card/80 backdrop-blur-md rounded-lg shadow-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Enter Mapbox API Key</h2>
      <p className="text-sm text-muted-foreground mb-6">
        To use the map features, please provide your Mapbox public token.
        You can get one for free at <a href="https://www.mapbox.com/" className="text-primary hover:underline" target="_blank" rel="noreferrer">mapbox.com</a>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter your Mapbox public token"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            This will be stored in your browser only.
          </p>
        </div>
        
        <Button
          type="submit"
          disabled={!apiKey.trim()}
          className="w-full bg-gradient-to-r from-explorer-primary to-explorer-secondary"
        >
          Start Exploring
        </Button>
      </form>
    </div>
  );
};

export default ApiKeyInput;
