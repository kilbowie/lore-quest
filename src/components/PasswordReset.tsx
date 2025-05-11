
import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordReset, resetPassword } from '../utils/authUtils';
import { Lock } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PasswordResetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleRequestSubmit = () => {
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    const success = requestPasswordReset(email);
    
    if (success) {
      toast.success('Password reset email sent');
      setStep('reset');
    } else {
      toast.error('Email not found');
    }
    
    setIsSubmitting(false);
  };
  
  const handleResetSubmit = () => {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    const success = resetPassword(token, newPassword);
    
    if (success) {
      toast.success('Password reset successfully');
      onOpenChange(false);
    } else {
      toast.error('Invalid or expired token');
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-lorequest-dark border-lorequest-gold/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-lorequest-gold flex items-center gap-2">
            <Lock className="text-lorequest-gold" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-lorequest-parchment">
            {step === 'request' 
              ? 'Enter your email to receive a password reset link.'
              : 'Enter the reset code and your new password.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'request' ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Input 
                  id="email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="col-span-4 bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={handleRequestSubmit}
                disabled={!email.trim() || isSubmitting}
                className="w-full bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Input 
                  id="token" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Reset code from email"
                  className="col-span-4 bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Input 
                  id="newPassword" 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="col-span-4 bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="col-span-4 bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                />
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('request')}
                className="mb-2 sm:mb-0 border-lorequest-gold/50 text-lorequest-gold"
              >
                Back
              </Button>
              <Button
                onClick={handleResetSubmit}
                disabled={!token.trim() || !newPassword.trim() || !confirmPassword.trim() || isSubmitting}
                className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordReset;
