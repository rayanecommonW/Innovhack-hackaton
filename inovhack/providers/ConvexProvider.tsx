/**
 * Convex Provider with Clerk Authentication
 * Passes Clerk auth token to Convex so backend can verify users
 */

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
