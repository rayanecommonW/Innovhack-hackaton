/**
 * Stripe Provider
 * Initialise Stripe pour les paiements dans l'app
 *
 * Note: Native Stripe SDK requires a development build.
 * In Expo Go, payments are simulated.
 */

import React, { ReactNode } from "react";
import Constants from "expo-constants";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Check if we're in Expo Go (no native Stripe support)
const isExpoGo = Constants.appOwnership === "expo";

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  // In Expo Go, just render children without Stripe provider
  if (isExpoGo) {
    console.log("Stripe: Running in Expo Go - payments will be simulated");
    return <>{children}</>;
  }

  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("Stripe publishable key not configured");
    return <>{children}</>;
  }

  // Only import native Stripe in development builds
  try {
    const { StripeProvider: StripeNativeProvider } = require("@stripe/stripe-react-native");
    return (
      <StripeNativeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.app.paact.ios"
        urlScheme="pact"
      >
        {children}
      </StripeNativeProvider>
    );
  } catch (e) {
    console.warn("Stripe native module not available");
    return <>{children}</>;
  }
}

export default StripeProvider;
