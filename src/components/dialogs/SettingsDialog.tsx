
import React, { useState } from 'react';
import { User } from '../../types';
import { updateUser } from '../../utils/authUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  updateCurrentUser: (user: User) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  updateCurrentUser
}) => {
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profilePicture || '');

  const handleSaveSettings = () => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      profilePicture: profileImageUrl
    };
    
    updateUser(updatedUser);
    updateCurrentUser(updatedUser);
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-lorequest-dark border border-lorequest-gold/30 text-lorequest-parchment">
        <DialogHeader>
          <DialogTitle className="text-lorequest-gold">Profile Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24 border-2 border-lorequest-gold/50">
              <AvatarImage src={profileImageUrl} />
              <AvatarFallback className="bg-lorequest-gold/20 text-lorequest-gold text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full space-y-2">
              <Label htmlFor="profileImage" className="text-lorequest-parchment">
                Profile Image URL
              </Label>
              <Input
                id="profileImage"
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
              />
              <p className="text-xs text-lorequest-parchment/60">
                Enter the URL of your profile image
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-lorequest-gold/30 text-lorequest-parchment hover:bg-lorequest-gold/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSettings}
              className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
