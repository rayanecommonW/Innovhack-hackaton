/**
 * Clerk Authentication Provider
 * Provides secure authentication with Google, Apple, and Email+Password
 */

import React from "react";
import { ClerkProvider as ClerkProviderBase, ClerkLoaded } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

// Token cache for secure storage of auth tokens
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("SecureStore getToken error:", error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore saveToken error:", error);
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("SecureStore clearToken error:", error);
    }
  },
};

// Get Clerk publishable key from environment
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY - Auth will not work. " +
    "Get your key from https://dashboard.clerk.com"
  );
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  if (!publishableKey) {
    // In development without key, render children directly
    // This allows the app to run but auth won't work
    console.warn("Clerk running in mock mode - no publishable key");
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProviderBase>
  );
}
