
import React from 'react';
import { User } from '../../types';
import { toast } from '@/components/ui/sonner';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
  onLogout: () => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onLogout
}) => {
  const handleDeleteAccount = () => {
    if (!user) return;
    
    // Get all users from storage
    const usersStorageKey = 'lorequest_users';
    const storedUsers = localStorage.getItem(usersStorageKey);
    
    if (storedUsers) {
      // Filter out the current user
      const users = JSON.parse(storedUsers);
      const updatedUsers = users.filter((u: User) => u.id !== user.id);
      
      // Update storage
      localStorage.setItem(usersStorageKey, JSON.stringify(updatedUsers));
      
      // Clear any other user-specific data from local storage
      localStorage.removeItem(`user_locations_${user.id}`);
      localStorage.removeItem(`user_achievements_${user.id}`);
      localStorage.removeItem(`user_quests_${user.id}`);
      localStorage.removeItem(`user_inventory_${user.id}`);
      localStorage.removeItem(`walking_data_${user.id}_${new Date().toISOString().split('T')[0]}`);
      localStorage.removeItem(`lastQuestGenerationDate_${user.id}`);
      localStorage.removeItem(`time_quests_${user.id}`);
      
      // Show success message
      toast.success("Account deleted successfully", {
        description: "Your account and all associated data have been permanently removed."
      });
      
      // Log the user out
      onLogout();
    }
    
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-lorequest-dark border border-red-800/50 text-lorequest-parchment">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400">Delete Your Account?</AlertDialogTitle>
          <AlertDialogDescription className="text-lorequest-parchment/70">
            This action is irreversible. Your account and all associated data will be permanently deleted, including:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>User profile and settings</li>
              <li>Progress (XP, level, achievements)</li>
              <li>Discovered territories and maps</li>
              <li>Inventory items and purchases</li>
              <li>Character class and stats</li>
              <li>Movement and exploration history</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t border-red-800/30 pt-4">
          <AlertDialogCancel className="border-lorequest-gold/30 hover:bg-lorequest-gold/10 text-lorequest-parchment">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            className="bg-red-700 hover:bg-red-800 text-white border-none"
          >
            Yes, Delete My Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
