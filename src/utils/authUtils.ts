
import { User } from "../types";

// Mock user database for local storage
export const USERS_STORAGE_KEY = 'lorequest_users';
export const CURRENT_USER_KEY = 'lorequest_current_user';

// Create a new user
export const createUser = (name: string, email: string, username: string, password: string): User | null => {
  try {
    // Get existing users
    const existingUsers = loadUsers();
    
    // Check if user with email or username already exists
    const userExists = existingUsers.some(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (userExists) {
      throw new Error('User with this email or username already exists');
    }
    
    // Create new user
    const newUser: User = {
      id: generateUniqueId(),
      name,
      email,
      username,
      level: 1,
      experience: 0,
      inventory: [
        {
          id: generateUniqueId(),
          type: 'compass',
          name: 'Starter Compass',
          description: 'Your first tool for exploration',
          quantity: 1
        }
      ],
      discoveredLocations: [],
      achievements: [],
      activeQuests: [],
      completedQuests: [],
      createdAt: new Date()
    };
    
    // Hash password in a real implementation
    // Here we just simulate it with a simple object
    const userAuth = {
      userId: newUser.id,
      email,
      username,
      passwordHash: password // In real app, this would be hashed
    };
    
    // Save user auth
    const authData = loadUserAuth();
    authData.push(userAuth);
    localStorage.setItem('lorequest_auth', JSON.stringify(authData));
    
    // Save user
    existingUsers.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Login user
export const loginUser = (usernameOrEmail: string, password: string): User | null => {
  try {
    const authData = loadUserAuth();
    const userAuth = authData.find(
      auth => 
        (auth.email.toLowerCase() === usernameOrEmail.toLowerCase() || 
         auth.username.toLowerCase() === usernameOrEmail.toLowerCase()) && 
        auth.passwordHash === password
    );
    
    if (!userAuth) {
      throw new Error('Invalid credentials');
    }
    
    const users = loadUsers();
    const user = users.find(u => u.id === userAuth.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Save current user to localStorage
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Check if user is logged in
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    const user = JSON.parse(userJson) as User;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user
export const updateUser = (user: User): boolean => {
  try {
    // Get existing users
    const users = loadUsers();
    
    // Find and update user
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) {
      throw new Error('User not found');
    }
    
    users[index] = user;
    
    // Save updated users
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

// Helper functions
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const loadUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const loadUserAuth = (): any[] => {
  const authJson = localStorage.getItem('lorequest_auth');
  return authJson ? JSON.parse(authJson) : [];
};
