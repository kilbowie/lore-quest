
// This is a mock database implementation
import { User } from "@/types";
import { UserWithPassword } from "./authUtils";

// In-memory storage
const users: Record<string, UserWithPassword> = {};

// Mock Prisma-like interface
export const db = {
  user: {
    findMany: async (): Promise<User[]> => {
      return Object.values(users).map(({ password, ...user }) => user as User);
    },
    findUnique: async ({ where }: { where: { id?: string, email?: string, username?: string } }): Promise<User | null> => {
      if (where.id) {
        return users[where.id] ? { ...users[where.id], password: undefined } as User : null;
      }
      if (where.email) {
        const user = Object.values(users).find(u => u.email === where.email);
        return user ? { ...user, password: undefined } as User : null;
      }
      if (where.username) {
        const user = Object.values(users).find(u => u.username === where.username);
        return user ? { ...user, password: undefined } as User : null;
      }
      return null;
    },
    update: async ({ where, data }: { where: { id: string }, data: User }): Promise<User> => {
      if (users[where.id]) {
        // Preserve the password when updating
        const existingPassword = users[where.id].password;
        users[where.id] = { ...data, password: existingPassword } as UserWithPassword;
        return { ...users[where.id], password: undefined } as User;
      }
      throw new Error(`User with id ${where.id} not found`);
    },
    create: async ({ data }: { data: UserWithPassword }): Promise<User> => {
      users[data.id] = data;
      return { ...data, password: undefined } as User;
    }
  }
};
