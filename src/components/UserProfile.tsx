
import React, { useState } from 'react';
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
import { UserRound, Settings, LogOut, UserX } from 'lucide-react';
import PlayerStatus from './PlayerStatus';
import InventoryIcon from './InventoryIcon';
import SettingsDialog from './dialogs/SettingsDialog';
import DeleteAccountDialog from './dialogs/DeleteAccountDialog';

interface UserProfileProps {
  onToggleDashboard: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onToggleDashboard }) => {
  const { user, logout, updateCurrentUser } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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
        <InventoryIcon />
      </div>
      
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
      
      {/* Settings Dialog - Now imported as a component */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        user={user}
        updateCurrentUser={updateCurrentUser}
      />
      
      {/* Delete Account Dialog - Now imported as a component */}
      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={user}
        onLogout={logout}
      />
    </div>
  );
};

export default UserProfile;
