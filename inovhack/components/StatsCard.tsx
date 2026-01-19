/**
 * StatsCard - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "../constants/theme";

interface StatsCardProps {
  totalWon: number;
  totalLost: number;
  streak: number;
  completedChallenges: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  userName?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  totalWon,
  totalLost,
  streak,
  completedChallenges,
  level,
  xp,
  xpToNextLevel,
  userName,
}) => {
  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.container}>
      {/* Level & XP */}
      <View style={styles.levelSection}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{level}</Text>
          <Text style={styles.levelLabel}>Niveau</Text>
        </View>
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Progression</Text>
            <Text style={styles.xpText}>{xp}/{xpToNextLevel} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <Animated.View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.warningMuted }]}>
            <Ionicons name="flame-outline" size={18} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Série</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successMuted }]}>
            <Ionicons name="checkmark-outline" size={18} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{completedChallenges}</Text>
          <Text style={styles.statLabel}>Pacts</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successMuted }]}>
            <Ionicons name="trending-up-outline" size={18} color={Colors.success} />
          </View>
          <Text style={[styles.statValue, { color: Colors.success }]}>+{totalWon}€</Text>
          <Text style={styles.statLabel}>Gagnés</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.dangerMuted }]}>
            <Ionicons name="trending-down-outline" size={18} color={Colors.danger} />
          </View>
          <Text style={[styles.statValue, { color: Colors.danger }]}>-{totalLost}€</Text>
          <Text style={styles.statLabel}>Perdus</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },

  // Level Section
  levelSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  levelBadge: {
    width: 56,
    height: 56,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.white,
    opacity: 0.8,
  },
  xpSection: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  xpText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
});

export default StatsCard;
