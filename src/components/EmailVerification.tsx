
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
import { useAuth } from '../context/AuthContext';
import { verifyEmail, resendVerificationEmail } from '../utils/authUtils';
import { Mail, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface EmailVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ open, onOpenChange }) => {
  const { user, updateCurrentUser } = useAuth();
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = () => {
    if (!token.trim() || !user) return;
    
    setIsSubmitting(true);
    
    const success = verifyEmail(token);
    
    if (success) {
      toast.success('Email verified successfully');
      updateCurrentUser({ ...user, emailVerified: true });
      onOpenChange(false);
    } else {
      toast.error('Invalid or expired token');
    }
    
    setIsSubmitting(false);
  };
  
  const handleResend = () => {
    if (!user) return;
    
    const success = resendVerificationEmail(user.email);
    
    if (success) {
      toast.success('Verification email resent');
    } else {
      toast.error('Failed to resend verification email');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-lorequest-dark border-lorequest-gold/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-lorequest-gold flex items-center gap-2">
            <Mail className="text-lorequest-gold" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-lorequest-parchment">
            Enter the verification code sent to your email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input 
              id="token" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter verification code"
              className="col-span-4 bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleResend}
            className="mb-2 sm:mb-0 border-lorequest-gold/50 text-lorequest-gold"
          >
            Resend Code
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!token.trim() || isSubmitting}
            className="bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark"
          >
            <Check className="mr-2 h-4 w-4" /> Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerification;
