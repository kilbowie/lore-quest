
import { User, PlayerClass } from "@/types";
import { db } from "./db";
import { nanoid } from "nanoid";
import { hash, compare } from "bcryptjs";

// Interface for user with password
export interface UserWithPassword extends User {
  password: string;
}

export const getUsers = async (): Promise<User[]> => {
  const users = await db.user.findMany();
  return users;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await db.user.findUnique({
    where: {
      email: email,
    },
  });
  return user;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const user = await db.user.findUnique({
    where: {
      id: id,
    },
  });
  return user;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const user = await db.user.findUnique({
    where: {
      username: username,
    },
  });
  return user;
};

export const updateUser = async (user: User): Promise<User> => {
  const updatedUser = await db.user.update({
    where: {
      id: user.id,
    },
    data: user,
  });
  return updatedUser;
};

export const createUser = async (userData: { name?: string; email?: string; username?: string; password?: string }): Promise<User> => {
  const hashedPassword = await hash(userData.password || "password", 12);

  const user: UserWithPassword = {
    id: nanoid(),
    name: userData.name || "",
    email: userData.email || "",
    username: userData.username || "",
    password: hashedPassword,
    level: 1,
    experience: 0,
    gold: 50,
    inventory: [],
    discoveredLocations: [],
    achievements: [],
    activeQuests: [],
    completedQuests: [],
    createdAt: new Date(),
    stats: {
      strength: 1,
      intelligence: 1,
      dexterity: 1,
      distanceTravelled: 0,
      locationsDiscovered: 0,
      totalXpEarned: 0,
      questXpEarned: 0,
      walkingXpEarned: 0,
      totalGoldEarned: 0,
      questGoldEarned: 0,
      questsCompleted: 0,
      achievementsUnlocked: 0,
      dailyQuestsCompleted: 0,
      weeklyQuestsCompleted: 0,
      monthlyQuestsCompleted: 0
    },
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    stamina: 100,
    maxStamina: 100,
    energy: 10,
    maxEnergy: 10,
    lastEnergyRegenTime: new Date(),
    isDead: false,
    lastRegenerationTime: new Date(),
    trackedAchievements: [],
    equipment: {},
    armor: 0,
    quests: [],
    dailyQuests: []
  };

  await db.user.create({
    data: user,
  });

  // Return the user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Add missing auth functions required by components
export const loginUser = async (usernameOrEmail: string, password: string): Promise<User | null> => {
  // Try to find user by email
  let user = await getUserByEmail(usernameOrEmail);
  
  // If not found, try by username
  if (!user) {
    user = await getUserByUsername(usernameOrEmail);
  }

  // If user not found or password doesn't match, return null
  if (!user) return null;
  
  // Get full user with password from our mock database
  const userWithPassword = Object.values(db.user).find(u => u.id === user?.id) as UserWithPassword | undefined;
  if (!userWithPassword) return null;
  
  const isPasswordValid = await compare(password, userWithPassword.password);
  if (!isPasswordValid) return null;
  
  // Return user without password
  return user;
};

export const logoutUser = (): void => {
  // Nothing to do in our mock implementation
  console.log("User logged out");
};

export const verifyEmail = (token: string): boolean => {
  // Mock implementation
  return token === "123456"; // Simple verification for demo purposes
};

export const resendVerificationEmail = (email: string): boolean => {
  // Mock implementation
  return !!email; // Success if email is provided
};

export const requestPasswordReset = (email: string): boolean => {
  // Mock implementation
  return !!email; // Success if email is provided
};

export const resetPassword = (token: string, newPassword: string): boolean => {
  // Mock implementation
  return token === "123456"; // Simple verification for demo purposes
};

export const completeTutorial = (userId: string): void => {
  // Mock implementation
  console.log(`Tutorial completed for user ${userId}`);
};

export const setUserClass = (userId: string, playerClass: PlayerClass): User => {
  // Mock implementation
  console.log(`User ${userId} class set to ${playerClass}`);
  
  // Return a mock user with the class set
  return {
    id: userId,
    playerClass: playerClass,
    // Include other required fields with default values
    name: "",
    email: "",
    username: "",
    level: 1,
    experience: 0,
    gold: 50,
    inventory: [],
    discoveredLocations: [],
    achievements: [],
    activeQuests: [],
    completedQuests: [],
    createdAt: new Date(),
    stats: {
      strength: 1,
      intelligence: 1,
      dexterity: 1,
      distanceTravelled: 0,
      locationsDiscovered: 0,
      totalXpEarned: 0,
      questXpEarned: 0,
      walkingXpEarned: 0,
      totalGoldEarned: 0,
      questGoldEarned: 0,
      questsCompleted: 0,
      achievementsUnlocked: 0,
      dailyQuestsCompleted: 0,
      weeklyQuestsCompleted: 0,
      monthlyQuestsCompleted: 0
    },
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    stamina: 100,
    maxStamina: 100,
    energy: 10,
    maxEnergy: 10,
    lastEnergyRegenTime: new Date(),
    isDead: false,
    lastRegenerationTime: new Date(),
    trackedAchievements: [],
    equipment: {},
    armor: 0,
    quests: [],
    dailyQuests: []
  };
};

