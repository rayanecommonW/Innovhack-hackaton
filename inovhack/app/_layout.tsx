import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ConvexProvider } from '../providers/ConvexProvider';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { NotificationProvider } from '../providers/NotificationProvider';
import { Colors } from '../constants/theme';

// Pact custom dark theme - premium, refined
const PactTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.accent,
    notification: Colors.accent,
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

    // If user is authenticated and needs onboarding, redirect to onboarding
    if (isAuthenticated && needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, needsOnboarding, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexProvider>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider value={PactTheme}>
            <NavigationHandler>
              <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="create-challenge"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="join-challenge"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="submit-proof"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              </Stack>
            </NavigationHandler>
            <StatusBar style="light" />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
