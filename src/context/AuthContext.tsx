
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { 
  loginUser, 
  logoutUser, 
  getUserById, 
  createUser as createUserApi,
  updateUser as updateUserApi 
} from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, username: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, username: string, password: string) => Promise<User | null>; // Alias for register
  updateUser: (updatedUser: User) => void;
  updateCurrentUser: (updatedUser: User) => void; // Alias for updateUser
  setUser: (user: User) => void; // Added setter
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => null,
  logout: () => {},
  register: async () => null,
  signup: async () => null, // Added alias
  updateUser: () => {},
  updateCurrentUser: () => {}, // Added alias
  setUser: () => {} // Added setter default
});

// Export hook for easy context access
export const useAuth = (): AuthContextType => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const storedUserId = localStorage.getItem('currentUserId');
      
      if (storedUserId) {
        const foundUser = await getUserById(storedUserId);
        if (foundUser) {
          setUser(foundUser);
        }
      }
      
      setIsLoading(false);
    };
    
    checkLoggedInUser();
  }, []);

  // Login function
  const login = async (usernameOrEmail: string, password: string): Promise<User | null> => {
    const loggedInUser = await loginUser(usernameOrEmail, password);
    
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('currentUserId', loggedInUser.id);
    }
    
    return loggedInUser;
  };

  // Logout function
  const logout = (): void => {
    logoutUser();
    setUser(null);
    localStorage.removeItem('currentUserId');
  };

  // Register function
  const register = async (name: string, email: string, username: string, password: string): Promise<User | null> => {
    const newUser = await createUserApi({ name, email, username, password });
    
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('currentUserId', newUser.id);
    }
    
    return newUser;
  };

  // Update user function
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    updateUserApi(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // Make setter available
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        signup: register, // Alias for register
        updateUser,
        updateCurrentUser: updateUser // Alias for updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
