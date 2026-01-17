import { Redirect } from 'expo-router';

// Redirect to home tab - this file is hidden in navigation
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
