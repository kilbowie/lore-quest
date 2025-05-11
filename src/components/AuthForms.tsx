
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Mail, Lock } from 'lucide-react';
import EmailVerification from './EmailVerification';
import PasswordReset from './PasswordReset';

interface AuthFormsProps {
  onSuccess?: () => void;
}

const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const { login, signup } = useAuth();
  
  // Login form state
  const [loginData, setLoginData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };
  
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const { usernameOrEmail, password } = loginData;
    
    // Basic validation
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await login(usernameOrEmail, password);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const { name, email, username, password, confirmPassword } = signupData;
    
    // Basic validation
    if (!name.trim() || !email.trim() || !username.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await signup(name, email, username, password);
      if (success) {
        setShowVerification(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError('Signup failed. This email or username might already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="bg-lorequest-dark/90 backdrop-blur-md border border-lorequest-gold/30 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-lorequest-gold/10 p-3 rounded-full border border-lorequest-gold/30">
              {isLogin ? (
                <Shield size={32} className="text-lorequest-gold" />
              ) : (
                <User size={32} className="text-lorequest-gold" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-lorequest-gold">
            {isLogin ? 'Welcome Back, Explorer' : 'Join the Quest'}
          </h2>
          <p className="text-lorequest-parchment text-sm mt-1">
            {isLogin ? 'Sign in to continue your adventure' : 'Create an account to begin your journey'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-200 px-4 py-2 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        {isLogin ? (
          // Login Form
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-lorequest-parchment">Username / Email</Label>
              <Input
                id="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="Enter your username or email"
                value={loginData.usernameOrEmail}
                onChange={handleLoginChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-lorequest-parchment">Password</Label>
                <button 
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-xs text-lorequest-gold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={handleLoginChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark font-semibold"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="flex items-center justify-between mt-4">
              <button 
                type="button"
                onClick={() => setShowVerification(true)}
                className="text-xs text-lorequest-gold hover:underline"
              >
                Verify email
              </button>
            </div>
          </form>
        ) : (
          // Signup Form
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lorequest-parchment">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={signupData.name}
                onChange={handleSignupChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lorequest-parchment">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={signupData.email}
                onChange={handleSignupChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-lorequest-parchment">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Choose a unique username"
                value={signupData.username}
                onChange={handleSignupChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-lorequest-parchment">Password</Label>
              <Input
                id="newPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                value={signupData.password}
                onChange={handleSignupChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-lorequest-parchment">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                className="bg-lorequest-dark border-lorequest-gold/30 text-lorequest-parchment"
                required
              />
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-lorequest-gold hover:bg-lorequest-highlight text-lorequest-dark font-semibold"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}
        
        <div className="mt-5 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-lorequest-gold hover:underline focus:outline-none"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
        
        <div className="fantasy-divider my-5"></div>
        
        <div className="text-center text-xs text-lorequest-parchment/50">
          By continuing, you agree to the epic quest guidelines of Lore Quest
        </div>
      </div>
      
      {/* Email verification dialog */}
      <EmailVerification 
        open={showVerification}
        onOpenChange={setShowVerification}
      />
      
      {/* Password reset dialog */}
      <PasswordReset
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
      />
    </>
  );
};

export default AuthForms;
