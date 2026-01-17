import { ConvexProvider as ConvexProviderOriginal, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderOriginal client={convex}>
      {children}
    </ConvexProviderOriginal>
  );
}
