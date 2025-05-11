import { User } from "../types";
import { USERS_STORAGE_KEY, updateUserInStorage } from "./storageUtils";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/sonner";
import { completeVerificationQuest } from "./xpUtils";

// Function to create a new user
export const createUser = (name: string, email: string, username: string, password: string): User | null => {
  // Check if username or email already exists
  const existingUsers = getUsers();
  if (existingUsers.some(user => user.username === username || user.email === email)) {
    toast.error('Username or email already exists');
    return null;
  }

  const newUser: User = {
    id: uuidv4(),
    name,
    email,
    username,
    password,
    level: 1,
    experience: 0,
    gold: 0,
    inventory: [],
    discoveredLocations: [],
    achievements: [],
    activeQuests: [],
    completedQuests: [],
    tutorialCompleted: false,
    emailVerified: false,
    lastRegenerationTime: new Date(),
    isDead: false,
    playerClass: 'Knight'
  };

  existingUsers.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
  return newUser;
};

// Function to login user
export const loginUser = (usernameOrEmail: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(
    u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
  );
  return user || null;
};

// Function to logout user
export const logoutUser = (): void => {
  // No specific logic needed for logout in this implementation
  // Just clear any session-related data if you have any
};

// Function to get current user from local storage
export const getCurrentUser = (): User | null => {
  const users = getUsers();
  // In a real application, you might store a session token or user ID in local storage
  // For this example, we'll just return the first user if there are any
  return users.length > 0 ? users[0] : null;
};

// Function to get all users from local storage
export const getUsers = (): User[] => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [];
};

// Function to get a user by ID
export const getUserById = (userId: string): User | undefined => {
  const users = getUsers();
  return users.find(user => user.id === userId);
};

// Function to update user information
export const updateUser = (updatedUser: User): void => {
  updateUserInStorage(updatedUser);
};

// Function to set user class
export const setUserClass = (userId: string, playerClass: string): User => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  const updatedUser = { ...users[userIndex], playerClass: playerClass };
  users[userIndex] = updatedUser;
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return updatedUser;
};

// Function to complete tutorial
export const completeTutorial = (userId: string): void => {
  const user = getUserById(userId);
  
  if (user) {
    user.tutorialCompleted = true;
    updateUser(user);
  }
};

// Complete email verification quest
export const completeEmailVerification = (userId: string): void => {
  const user = getUserById(userId);
  
  if (user && !user.emailVerified) {
    // Mark email as verified
    user.emailVerified = true;
    
    // Add email verification quest rewards
    const xpReward = 100;
    const goldReward = 50;
    
    // Complete the quest and award XP and Gold
    const updatedUser = completeVerificationQuest(user);
    
    // Save updated user
    updateUser(updatedUser);
  }
};
