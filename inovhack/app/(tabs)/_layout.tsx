import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Animations } from '../../constants/theme';

type TabIconName = 'home' | 'compass' | 'gift' | 'person';

interface TabBarIconProps {
  name: TabIconName;
  focused: boolean;
}

function TabBarIcon({ name, focused }: TabBarIconProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, Animations.springSnappy);
    progress.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const iconColor = focused ? Colors.textPrimary : Colors.textTertiary;
  const iconName = (focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <Animated.View style={[styles.activeIndicator, dotAnimatedStyle]} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'home', icon: 'home' as TabIconName, label: 'Accueil' },
    { name: 'explore', icon: 'compass' as TabIconName, label: 'Explorer' },
    { name: 'rewards', icon: 'gift' as TabIconName, label: 'Gains' },
    { name: 'profile', icon: 'person' as TabIconName, label: 'Profil' },
  ];

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Subtle top border glow */}
      <View style={styles.tabBarGlow} />

      <View style={styles.tabBarBackground}>
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
                android_ripple={{ color: Colors.surfaceHighlight, borderless: true }}
              >
                <TabBarIcon name={tab.icon} focused={isFocused} />
              </Pressable>
            );
          })}
        </View>
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
        name="rewards"
        options={{
          title: 'Gains',
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
    backgroundColor: 'transparent',
  },
  tabBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  tabBarBackground: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  iconWrapperActive: {
    backgroundColor: Colors.surfaceHighlight,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});
