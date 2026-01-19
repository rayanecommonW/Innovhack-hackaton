/**
 * Root Layout - Enhanced animations and transitions
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { ConvexProvider } from '../providers/ConvexProvider';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { NotificationProvider } from '../providers/NotificationProvider';
import { ThemeContextProvider, useTheme } from '../providers/ThemeProvider';
import { Colors } from '../constants/theme';

// Light theme
const PactLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAF8',
    card: '#FFFFFF',
    text: '#18181B',
    border: '#E4E4E7',
    primary: '#C9705F',
    notification: '#C9705F',
  },
};

// Dark theme
const PactDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0A0B',
    card: '#18181B',
    text: '#FAFAFA',
    border: '#27272A',
    primary: '#E8927C',
    notification: '#E8927C',
  },
};

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Navigation handler for onboarding
function NavigationHandler({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, needsOnboarding, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';

    if (isAuthenticated && needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, segments]);

  return <>{children}</>;
}

// Inner layout with theme access
function InnerLayout() {
  const { isDark, colors } = useTheme();

  return (
    <ThemeProvider value={isDark ? PactDarkTheme : PactLightTheme}>
      <NavigationHandler>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade_from_bottom',
            animationDuration: 200,
          }}
        >
          <Stack.Screen
            name="auth"
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="create-challenge"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 250,
            }}
          />
          <Stack.Screen
            name="join-challenge"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 250,
            }}
          />
          <Stack.Screen
            name="submit-proof"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 250,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="badges"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="leaderboard"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="proof/[id]"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="history"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="my-pacts"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="challenge/[id]"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              animation: 'slide_from_right',
              animationDuration: 200,
            }}
          />
        </Stack>
      </NavigationHandler>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();

  return (
    <ConvexProvider>
      <AuthProvider>
        <NotificationProvider>
          <ThemeContextProvider>
            <InnerLayout />
          </ThemeContextProvider>
        </NotificationProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
