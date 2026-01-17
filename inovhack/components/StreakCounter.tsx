import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/theme";

interface StreakCounterProps {
  count: number;
  label?: string;
  size?: "small" | "medium" | "large";
  animate?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({
  count,
  label = "jours",
  size = "medium",
  animate = true,
}) => {
  const scale = useSharedValue(1);
  const flameScale = useSharedValue(1);
  const flameRotate = useSharedValue(0);

  useEffect(() => {
    if (animate && count > 0) {
      // Pulse animation for the counter
      scale.value = withSequence(
        withSpring(1.2, { damping: 3 }),
        withSpring(1, { damping: 5 })
      );

      // Flame dancing animation
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300, easing: Easing.ease }),
          withTiming(0.95, { duration: 300, easing: Easing.ease })
        ),
        -1,
        true
      );

      flameRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 200, easing: Easing.ease }),
          withTiming(5, { duration: 400, easing: Easing.ease }),
          withTiming(0, { duration: 200, easing: Easing.ease })
        ),
        -1,
        true
      );
    }
  }, [count, animate]);

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: flameScale.value },
      { rotate: `${flameRotate.value}deg` },
    ],
  }));

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      count: styles.countSmall,
      label: styles.labelSmall,
      flame: styles.flameSmall,
    },
    medium: {
      container: styles.containerMedium,
      count: styles.countMedium,
      label: styles.labelMedium,
      flame: styles.flameMedium,
    },
    large: {
      container: styles.containerLarge,
      count: styles.countLarge,
      label: styles.labelLarge,
      flame: styles.flameLarge,
    },
  };

  const currentSize = sizeStyles[size];
  const isActive = count > 0;

  return (
    <View style={[styles.container, currentSize.container, !isActive && styles.containerInactive]}>
      <Animated.Text style={[currentSize.flame, flameStyle]}>
        {isActive ? "🔥" : "❄️"}
      </Animated.Text>
      <Animated.View style={counterStyle}>
        <Text style={[currentSize.count, !isActive && styles.countInactive]}>
          {count}
        </Text>
      </Animated.View>
      <Text style={[currentSize.label, !isActive && styles.labelInactive]}>
        {label}
      </Text>

      {/* Milestone badges */}
      {count >= 7 && count < 30 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🌟 1 semaine!</Text>
        </View>
      )}
      {count >= 30 && count < 100 && (
        <View style={[styles.badge, styles.badgeGold]}>
          <Text style={styles.badgeText}>⭐ 1 mois!</Text>
        </View>
      )}
      {count >= 100 && (
        <View style={[styles.badge, styles.badgePlatinum]}>
          <Text style={styles.badgeText}>💎 100 jours!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  containerInactive: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  containerSmall: {
    padding: Spacing.sm,
    gap: 2,
  },
  containerMedium: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  containerLarge: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  flameSmall: {
    fontSize: 20,
  },
  flameMedium: {
    fontSize: 32,
  },
  flameLarge: {
    fontSize: 48,
  },
  countSmall: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.accent,
  },
  countMedium: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.accent,
  },
  countLarge: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.accent,
  },
  countInactive: {
    color: Colors.textTertiary,
  },
  labelSmall: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  labelMedium: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  labelLarge: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
  labelInactive: {
    color: Colors.textTertiary,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeGold: {
    backgroundColor: "#FFD700",
  },
  badgePlatinum: {
    backgroundColor: "#E5E4E2",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.black,
  },
});

export default StreakCounter;
