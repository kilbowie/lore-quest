
import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRound, Settings, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUser } from '../utils/authUtils';

interface UserProfileProps {
  onToggleDashboard: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onToggleDashboard }) => {
  const { user, logout, updateCurrentUser } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profilePicture || '');
  
  if (!user) return null;
  
  const handleSaveSettings = () => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      profilePicture: profileImageUrl
    };
    
    updateUser(updatedUser);
    updateCurrentUser(updatedUser);
    setIsSettingsOpen(false);
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative w-10 h-10 rounded-full p-0">
            <Avatar className="w-10 h-10 border-2 border-lorequest-gold/50">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-lorequest-gold/20 text-lorequest-gold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-50 bg-lorequest-dark border border-lorequest-gold/30">
          <div className="flex items-center justify-start p-2 gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="bg-lorequest-gold/20 text-lorequest-gold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium text-lorequest-gold">{user.username}</p>
              <p className="text-xs text-lorequest-parchment">{user.email}</p>
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-lorequest-gold/20" />
          
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-lorequest-gold/20"
            onClick={onToggleDashboard}
          >
            <UserRound className="mr-2 h-4 w-4 text-lorequest-gold" />
            <span>View Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-lorequest-gold/20"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4 text-lorequest-gold" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-lorequest-gold/20" />
          
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-lorequest-gold/20 text-red-400 hover:text-red-500"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
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
                onClick={() => setIsSettingsOpen(false)}
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
    </>
  );
};

export default UserProfile;
