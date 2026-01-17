import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, withSequence, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExploreScreen from './explore';
import RewardsScreen from './rewards';
import HomeScreen from './home';
import ProfileScreen from './profile';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabIconName = 'compass' | 'gift' | 'home' | 'person';

interface TabBarIconProps {
  name: TabIconName;
  focused: boolean;
}

function TabBarIcon({ name, focused }: TabBarIconProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 400 })
      );
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = focused ? '#FFFFFF' : '#4A4A4A';
  const iconName = focused ? name : `${name}-outline` as const;

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Ionicons name={iconName as any} size={26} color={iconColor} />
      {focused && <View style={styles.activeIndicator} />}
    </Animated.View>
  );
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabBarInner}>
          {state.routes
            .filter((route: any) => {
              const { options } = descriptors[route.key];
              // Only show routes that are not hidden (href !== null)
              return options.href !== null;
            })
            .map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              let iconName: TabIconName = 'home';
              if (route.name === 'explore') iconName = 'compass';
              else if (route.name === 'rewards') iconName = 'gift';
              else if (route.name === 'home') iconName = 'home';
              else if (route.name === 'profile') iconName = 'person';

              return (
                <AnimatedPressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabButton}
                >
                  <TabBarIcon name={iconName} focused={isFocused} />
                </AnimatedPressable>
              );
            })}
      </View>
    </View>
  );
}

import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false, // Pre-render all tabs
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#1A1A1A',
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
