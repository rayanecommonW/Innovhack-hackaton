import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "../constants/theme";

interface LevelProgressProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
  showLevelUp?: boolean;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Débutant",
  2: "Novice",
  3: "Apprenti",
  4: "Confirmé",
  5: "Expert",
  6: "Maître",
  7: "Champion",
  8: "Légende",
  9: "Mythique",
  10: "Immortel",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#9CA3AF",
  2: "#60A5FA",
  3: "#34D399",
  4: "#FBBF24",
  5: "#F97316",
  6: "#EF4444",
  7: "#A855F7",
  8: "#EC4899",
  9: "#06B6D4",
  10: "#FFD700",
};

const LevelProgress: React.FC<LevelProgressProps> = ({
  xp,
  level,
  xpToNextLevel,
  showLevelUp = false,
}) => {
  const progress = xpToNextLevel > 0 ? xp / xpToNextLevel : 1;
  const progressWidth = useSharedValue(0);
  const levelScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    if (showLevelUp) {
      levelScale.value = withSequence(
        withSpring(1.3, { damping: 3 }),
        withSpring(1, { damping: 5 })
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
    }
  }, [progress, showLevelUp]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const levelBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const levelColor = LEVEL_COLORS[Math.min(level, 10)] || LEVEL_COLORS[10];
  const levelTitle = LEVEL_TITLES[Math.min(level, 10)] || "Immortel";

  return (
    <View style={styles.container}>
      {/* Level Badge */}
      <Animated.View style={[styles.levelBadge, { backgroundColor: levelColor }, levelBadgeStyle]}>
        <Text style={styles.levelNumber}>{level}</Text>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, { backgroundColor: levelColor }, glowStyle]} />
      </Animated.View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: levelColor }]}>{levelTitle}</Text>
          <Text style={styles.xpText}>
            {xp} / {xpToNextLevel} XP
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: levelColor },
              progressStyle,
            ]}
          />
          {/* Shimmer effect */}
          <View style={styles.shimmer} />
        </View>

        {/* Next Level Preview */}
        {level < 10 && (
          <Text style={styles.nextLevel}>
            Prochain: {LEVEL_TITLES[Math.min(level + 1, 10)]}
          </Text>
        )}
      </View>
    </View>
  );
};

// Compact version for headers
export const LevelBadge: React.FC<{ level: number }> = ({ level }) => {
  const levelColor = LEVEL_COLORS[Math.min(level, 10)] || LEVEL_COLORS[10];

  return (
    <View style={[styles.compactBadge, { backgroundColor: levelColor }]}>
      <Text style={styles.compactLevel}>Niv. {level}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.sm,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  glow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  progressSection: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.labelLarge,
    fontWeight: "700",
  },
  xpText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: "100%",
    opacity: 0.3,
  },
  nextLevel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  compactBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  compactLevel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default LevelProgress;
