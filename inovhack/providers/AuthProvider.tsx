/**
 * Auth Provider - Syncs Clerk auth with Convex user
 *
 * Flow:
 * 1. Clerk handles authentication (Google, Apple, Email)
 * 2. When user signs in, we create/get Convex user
 * 3. Convex user ID is used throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  profileImageUrl?: string;
  balance: number;
  totalWins: number;
  totalLosses: number;
  currentStreak?: number;
  bestStreak?: number;
  totalEarnings?: number;
  totalPacts?: number;
  successRate?: number;
  onboardingCompleted?: boolean;
  notificationsEnabled?: boolean;
  pushToken?: string;
  clerkId?: string;
}

interface AuthContextType {
  // Clerk state
  isClerkLoaded: boolean;
  isSignedIn: boolean;
  clerkUser: ReturnType<typeof useUser>["user"];

  // Convex user
  user: User | null;
  userId: Id<"users"> | null;

  // Combined state
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  needsUsername: boolean;

  // Actions
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mutations
  const getOrCreateUserFromClerk = useMutation(api.users.getOrCreateUserFromClerk);

  // Get Convex user data
  const convexUser = useQuery(
    api.users.getUser,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Sync Clerk user to Convex when signed in
  useEffect(() => {
    const syncUser = async () => {
      if (isClerkLoaded && isSignedIn && clerkUser && !isSyncing) {
        setIsSyncing(true);
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          const name = clerkUser.fullName ||
                       clerkUser.firstName ||
                       email?.split("@")[0] ||
                       "Utilisateur";

          // Get username from Clerk (from signup or unsafeMetadata)
          const metadata = clerkUser.unsafeMetadata as any;
          const username = clerkUser.username || metadata?.username;
          const birthDate = metadata?.birthDate;
          const ageVerified = metadata?.ageVerified;

          if (email) {
            const userId = await getOrCreateUserFromClerk({
              clerkId: clerkUser.id,
              email,
              name,
              profileImageUrl: clerkUser.imageUrl,
              username: username || undefined,
              birthDate: birthDate || undefined,
              ageVerified: ageVerified || undefined,
            });
            setConvexUserId(userId);
          }
        } catch (error) {
          console.error("Error syncing user to Convex:", error);
        } finally {
          setIsSyncing(false);
        }
      } else if (isClerkLoaded && !isSignedIn) {
        setConvexUserId(null);
      }
    };

    syncUser();
  }, [isClerkLoaded, isSignedIn, clerkUser?.id]);

  const signOut = async () => {
    try {
      await clerkSignOut();
      setConvexUserId(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const refreshUser = () => {
    // Convex useQuery automatically updates
  };

  // Loading states
  const isLoading = !isClerkLoaded || (isSignedIn && !convexUser && isSyncing);

  // Check if fully authenticated (both Clerk and Convex)
  const isAuthenticated = isSignedIn && !!convexUserId && !!convexUser;

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && !convexUser?.onboardingCompleted;

  // Check if user needs to set username (OAuth users without username)
  const needsUsername = isAuthenticated && !convexUser?.username;

  return (
    <AuthContext.Provider
      value={{
        // Clerk state
        isClerkLoaded,
        isSignedIn: isSignedIn ?? false,
        clerkUser: clerkUser ?? null,

        // Convex user
        user: convexUser ?? null,
        userId: convexUserId,

        // Combined state
        isLoading,
        isAuthenticated,
        needsOnboarding,
        needsUsername,

        // Actions
        signOut,
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
