import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
}

interface AuthContextType {
  user: User | null;
  userId: Id<"users"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<boolean>;
  signup: (name: string, email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "@betbuddy_user_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUser = useMutation(api.users.createUser);
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  // Load stored user ID on mount
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUserId) {
        setUserId(storedUserId as Id<"users">);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string): Promise<boolean> => {
    try {
      // Try to create user (will return existing if email exists)
      const id = await createUser({ name: email.split("@")[0], email });
      await AsyncStorage.setItem(USER_STORAGE_KEY, id);
      setUserId(id);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    try {
      const id = await createUser({ name, email });
      await AsyncStorage.setItem(USER_STORAGE_KEY, id);
      setUserId(id);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUserId(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Convex auto-refreshes, this is for explicit refresh calls
  const refreshUser = () => {
    // No-op: Convex useQuery automatically updates
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        userId,
        isLoading,
        isAuthenticated: !!userId && !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
