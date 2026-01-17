import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StatsCardProps {
  totalWon: number;
  totalLost: number;
  streak: number;
  completedChallenges: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  totalWon,
  totalLost,
  streak,
  completedChallenges,
  level,
  xp,
  xpToNextLevel,
}) => {
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.container}>
      {/* Level & XP Bar */}
      <View style={styles.levelSection}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
        <View style={styles.xpContainer}>
          <View style={styles.xpHeader}>
            <Text style={styles.levelTitle}>
              {level < 5 ? "Rookie" : level < 10 ? "Challenger" : level < 20 ? "Champion" : "Legend"}
            </Text>
            <Text style={styles.xpText}>{xp}/{xpToNextLevel} XP</Text>
          </View>
          <View style={styles.xpBarBackground}>
            <Animated.View
              entering={FadeInUp.delay(300)}
              style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Streak */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>

        {/* Completed */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: Colors.successMuted }]}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{completedChallenges}</Text>
          <Text style={styles.statLabel}>Complétés</Text>
        </View>

        {/* Won */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.statValue, { color: "#4CAF50" }]}>+{totalWon}€</Text>
          <Text style={styles.statLabel}>Gagnés</Text>
        </View>

        {/* Lost */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: "#FFEBEE" }]}>
            <Ionicons name="trending-down" size={24} color="#F44336" />
          </View>
          <Text style={[styles.statValue, { color: "#F44336" }]}>-{totalLost}€</Text>
          <Text style={styles.statLabel}>Perdus</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  levelSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.black,
  },
  xpContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  levelTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  xpText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});

export default StatsCard;
