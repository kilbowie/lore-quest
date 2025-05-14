
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRound, Settings, LogOut, UserX, Box } from 'lucide-react';
import PlayerStatus from '@/components/PlayerStatus';
import SettingsDialog from '@/components/dialogs/SettingsDialog';
import DeleteAccountDialog from '@/components/dialogs/DeleteAccountDialog';
import UserProfilePopup from './UserProfilePopup';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const UserProfile: React.FC = () => {
  const { user, logout, updateCurrentUser } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  if (!user) return null;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2 mr-4">
        <PlayerStatus />
        
        {/* Energy display */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-950/30 border border-yellow-800/50">
                <span className="text-yellow-500">⚡</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-800 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {user.energy}/{user.maxEnergy}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 bg-zinc-950/90 border border-yellow-800/30">
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-500">Energy</h4>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(user.energy / user.maxEnergy) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-zinc-400">
                Energy: {user.energy}/{user.maxEnergy}
              </p>
              <p className="text-xs text-zinc-500">
                Regenerates 1 point every 4 hours. Used for special actions and quests.
              </p>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Inventory button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setIsProfileOpen(true)}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lorequest-gold/20 border border-lorequest-gold/30">
                <Box className="h-4 w-4 text-lorequest-gold" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 bg-zinc-950/90 border border-lorequest-gold/30">
            <div className="space-y-2">
              <h4 className="font-medium text-lorequest-gold">Inventory</h4>
              <p className="text-xs text-zinc-500">Click to view your inventory and equipment</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsProfileOpen(true)}>
                Open Inventory
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <Button variant="ghost" className="relative" onClick={() => setIsProfileOpen(true)}>
        <span className="mr-2">Profile</span>
        <Avatar className="w-8 h-8 border-2 border-lorequest-gold/50">
          <AvatarImage src={user.profilePicture} alt={user.name} />
          <AvatarFallback className="bg-lorequest-gold/20 text-lorequest-gold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </Button>
      
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
            onClick={() => setIsProfileOpen(true)}
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
            className="cursor-pointer hover:bg-red-700/30 text-red-400"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <UserX className="mr-2 h-4 w-4" />
            <span>Delete Account</span>
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
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        user={user}
        updateCurrentUser={updateCurrentUser}
      />
      
      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        onLogout={logout}
      />
      
      {/* User Profile Popup */}
      <UserProfilePopup 
        isOpen={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </div>
  );
};

export default UserProfile;
