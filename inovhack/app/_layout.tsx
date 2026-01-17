import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ConvexProvider } from '../providers/ConvexProvider';
import { AuthProvider } from '../providers/AuthProvider';

// Custom dark theme for full black look
const BetBuddyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    text: '#FFFFFF',
    border: '#1A1A1A',
    primary: '#FFFFFF',
  },
};

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <ConvexProvider>
      <AuthProvider>
        <ThemeProvider value={BetBuddyTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="create-challenge" options={{ presentation: 'modal' }} />
            <Stack.Screen name="join-challenge" options={{ presentation: 'modal' }} />
            <Stack.Screen name="submit-proof" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
