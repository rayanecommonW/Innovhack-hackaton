/**
 * PACT Tab Navigation - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Animations } from '../../constants/theme';

type TabIconName = 'home' | 'compass' | 'people' | 'person';

interface TabBarIconProps {
  name: TabIconName;
  label: string;
  focused: boolean;
}

function TabBarIcon({ name, label, focused }: TabBarIconProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 1, Animations.spring);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = (focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap;
  const iconColor = focused ? Colors.textPrimary : Colors.textMuted;
  const labelColor = focused ? Colors.textPrimary : Colors.textMuted;

  return (
    <Animated.View style={[styles.tabItemContainer, animatedStyle]}>
      <Ionicons name={iconName} size={24} color={iconColor} />
      <Text style={[styles.tabLabel, { color: labelColor }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'home', icon: 'home' as TabIconName, label: 'Accueil' },
    { name: 'explore', icon: 'compass' as TabIconName, label: 'Explorer' },
    { name: 'groups', icon: 'people' as TabIconName, label: 'Groupes' },
    { name: 'profile', icon: 'person' as TabIconName, label: 'Profil' },
  ];

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarInner}>
        {tabs.map((tab) => {
          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return null;

          const isFocused = state.index === state.routes.indexOf(route);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={styles.tabButton}
            >
              <TabBarIcon name={tab.icon} label={tab.label} focused={isFocused} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groupes',
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  tabItemContainer: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
