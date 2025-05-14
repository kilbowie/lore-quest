import { User, UserWithPassword } from "@/types";
import { db } from "./db";
import { nanoid } from "nanoid";
import { hash } from "bcryptjs";

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

export const createUser = async (userData: Partial<UserWithPassword>): Promise<UserWithPassword> => {
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

  return user;
};
