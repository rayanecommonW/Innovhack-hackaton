/**
 * Stats Dashboard - Personal statistics
 * Clean, data-rich dashboard with elegant visualizations
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from "../constants/theme";

export default function StatsScreen() {
  const { userId } = useAuth();

  const stats = useQuery(api.stats.getUserStats, userId ? { userId } : "skip");
  const rank = useQuery(api.stats.getUserRank, userId ? { userId } : "skip");

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Connecte-toi pour voir tes stats</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mes statistiques</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* Rank Card */}
        {rank && rank.rank && (
          <Animated.View
            entering={FadeInDown.delay(50).duration(400)}
            style={styles.rankCard}
          >
            <View style={styles.rankIconContainer}>
              <Ionicons name="trophy" size={28} color={Colors.warning} />
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankPosition}>#{rank.rank}</Text>
              <Text style={styles.rankLabel}>
                Top {rank.percentile}% du classement
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/leaderboard")}
              style={styles.rankButton}
            >
              <Text style={styles.rankButtonText}>Voir</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Main Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.statsGrid}
        >
          <StatCard
            icon="checkmark-circle"
            iconColor={Colors.success}
            value={stats.wonPacts}
            label="Pacts gagnés"
            trend={stats.successRate > 50 ? "up" : "down"}
          />
          <StatCard
            icon="close-circle"
            iconColor={Colors.danger}
            value={stats.lostPacts}
            label="Pacts perdus"
          />
          <StatCard
            icon="flame"
            iconColor={Colors.warning}
            value={stats.currentStreak}
            label="Série actuelle"
            highlight={stats.currentStreak >= 3}
          />
          <StatCard
            icon="ribbon"
            iconColor={Colors.accent}
            value={stats.bestStreak}
            label="Meilleure série"
          />
        </Animated.View>

        {/* Success Rate */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.successCard}
        >
          <Text style={styles.successLabel}>Taux de réussite</Text>
          <View style={styles.successRow}>
            <Text style={styles.successValue}>{stats.successRate}%</Text>
            <View style={styles.successBarContainer}>
              <View
                style={[styles.successBar, { width: `${stats.successRate}%` }]}
              />
            </View>
          </View>
          <Text style={styles.successSub}>
            {stats.wonPacts + stats.lostPacts} pacts terminés
          </Text>
        </Animated.View>

        {/* Financial Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.financeSection}
        >
          <Text style={styles.sectionTitle}>Finances</Text>

          <View style={styles.financeCard}>
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Total misé</Text>
                <Text style={styles.financeValue}>{stats.totalBet.toFixed(0)}€</Text>
              </View>
              <View style={styles.financeDivider} />
              <View style={styles.financeItem}>
                <Text style={styles.financeLabel}>Total gagné</Text>
                <Text style={[styles.financeValue, styles.successValue2]}>
                  {stats.totalEarnings.toFixed(0)}€
                </Text>
              </View>
            </View>

            <View style={styles.netProfitContainer}>
              <Text style={styles.netProfitLabel}>Profit net</Text>
              <Text
                style={[
                  styles.netProfitValue,
                  stats.netProfit >= 0 ? styles.profitPositive : styles.profitNegative,
                ]}
              >
                {stats.netProfit >= 0 ? "+" : ""}
                {stats.netProfit.toFixed(0)}€
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Referrals */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.referralSection}
        >
          <Text style={styles.sectionTitle}>Parrainage</Text>

          <TouchableOpacity
            onPress={() => router.push("/referrals")}
            style={styles.referralCard}
            activeOpacity={0.7}
          >
            <View style={styles.referralInfo}>
              <View style={styles.referralIconContainer}>
                <Ionicons name="people" size={24} color={Colors.info} />
              </View>
              <View>
                <Text style={styles.referralValue}>{stats.referralCount} filleuls</Text>
                <Text style={styles.referralEarnings}>
                  +{stats.referralEarnings.toFixed(0)}€ gagnés
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Activity */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.activitySection}
        >
          <Text style={styles.sectionTitle}>Activité</Text>

          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{stats.totalPacts}</Text>
              <Text style={styles.activityLabel}>Pacts rejoints</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{stats.activePacts}</Text>
              <Text style={styles.activityLabel}>Pacts actifs</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  iconColor,
  value,
  label,
  trend,
  highlight,
}: {
  icon: string;
  iconColor: string;
  value: number;
  label: string;
  trend?: "up" | "down";
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && (
        <Ionicons
          name={trend === "up" ? "trending-up" : "trending-down"}
          size={16}
          color={trend === "up" ? Colors.success : Colors.danger}
          style={styles.statTrend}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Rank
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  rankIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  rankInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rankPosition: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  rankLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  rankButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rankButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statTrend: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },

  // Success Rate
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.xs,
  },
  successLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  successValue: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  successBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  successBar: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  successSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Finance
  financeSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  financeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.xs,
  },
  financeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  financeItem: {
    flex: 1,
    alignItems: "center",
  },
  financeLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  financeValue: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  successValue2: {
    color: Colors.success,
  },
  financeDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  netProfitContainer: {
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  netProfitLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  netProfitValue: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  profitPositive: {
    color: Colors.success,
  },
  profitNegative: {
    color: Colors.danger,
  },

  // Referral
  referralSection: {
    marginBottom: Spacing.lg,
  },
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  referralInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  referralIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  referralValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  referralEarnings: {
    fontSize: 13,
    color: Colors.success,
  },

  // Activity
  activitySection: {
    marginBottom: Spacing.lg,
  },
  activityGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  activityCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadows.xs,
  },
  activityValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  activityLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
