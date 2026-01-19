/**
 * Leaderboard Screen
 * Global and category-based rankings
 */

import React, { useState } from "react";
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
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

type Period = "all_time" | "monthly" | "weekly";

const PERIODS: { value: Period; label: string }[] = [
  { value: "all_time", label: "Tout" },
  { value: "monthly", label: "Ce mois" },
  { value: "weekly", label: "Semaine" },
];

export default function LeaderboardScreen() {
  const { userId } = useAuth();
  const [period, setPeriod] = useState<Period>("all_time");

  const leaderboard = useQuery(api.stats.getLeaderboard, { period, limit: 50 });
  const userRank = useQuery(api.stats.getUserRank, userId ? { userId, period } : "skip");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Classement</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Period Selector */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.periodContainer}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[styles.periodButton, period === p.value && styles.periodButtonActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* User Rank Card */}
      {userRank && userRank.rank && (
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.userRankCard}>
          <View style={styles.userRankLeft}>
            <Text style={styles.userRankPosition}>#{userRank.rank}</Text>
            <Text style={styles.userRankLabel}>Ta position</Text>
          </View>
          <View style={styles.userRankRight}>
            <Text style={styles.userRankScore}>{userRank.score} pts</Text>
            <Text style={styles.userRankPercentile}>Top {userRank.percentile}%</Text>
          </View>
        </Animated.View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!leaderboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun classement disponible</Text>
          </View>
        ) : (
          <>
            {/* Top 3 */}
            {leaderboard.length >= 3 && (
              <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.podium}>
                {/* 2nd place */}
                <PodiumItem user={leaderboard[1]} position={2} />
                {/* 1st place */}
                <PodiumItem user={leaderboard[0]} position={1} />
                {/* 3rd place */}
                <PodiumItem user={leaderboard[2]} position={3} />
              </Animated.View>
            )}

            {/* Rest of the list */}
            <View style={styles.listContainer}>
              {leaderboard.slice(3).map((user, index) => (
                <Animated.View
                  key={user.userId}
                  entering={FadeInDown.delay(200 + index * 30).duration(300)}
                >
                  <LeaderboardItem user={user} isCurrentUser={user.userId === userId} />
                </Animated.View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PodiumItem({
  user,
  position,
}: {
  user: any;
  position: 1 | 2 | 3;
}) {
  const colors = {
    1: Colors.warning,
    2: "#A8A8A8",
    3: "#CD7F32",
  };

  const sizes = {
    1: { height: 100, icon: 32 },
    2: { height: 80, icon: 24 },
    3: { height: 70, icon: 24 },
  };

  return (
    <View style={[styles.podiumItem, position === 1 && styles.podiumItemFirst]}>
      <View style={[styles.podiumAvatar, { borderColor: colors[position] }]}>
        <Text style={styles.podiumInitial}>{user.name?.charAt(0) || "?"}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {user.name || "Anonyme"}
      </Text>
      <Text style={styles.podiumScore}>{user.score} pts</Text>
      <View style={[styles.podiumBar, { height: sizes[position].height, backgroundColor: colors[position] + "20" }]}>
        <Ionicons name="trophy" size={sizes[position].icon} color={colors[position]} />
        <Text style={[styles.podiumPosition, { color: colors[position] }]}>#{position}</Text>
      </View>
    </View>
  );
}

function LeaderboardItem({
  user,
  isCurrentUser,
}: {
  user: any;
  isCurrentUser: boolean;
}) {
  return (
    <View style={[styles.listItem, isCurrentUser && styles.listItemCurrent]}>
      <Text style={styles.listRank}>#{user.rank}</Text>
      <View style={styles.listAvatar}>
        <Text style={styles.listInitial}>{user.name?.charAt(0) || "?"}</Text>
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, isCurrentUser && styles.listNameCurrent]}>
          {user.name || "Anonyme"}
          {isCurrentUser && " (toi)"}
        </Text>
        <Text style={styles.listWins}>{user.wins} victoires</Text>
      </View>
      <View style={styles.listRight}>
        <Text style={styles.listScore}>{user.score}</Text>
        <Text style={styles.listPts}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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

  // Period
  periodContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.xs,
  },
  periodButtonActive: {
    backgroundColor: Colors.accent,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.white,
  },

  // User Rank
  userRankCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  userRankLeft: {},
  userRankPosition: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },
  userRankLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  userRankRight: {
    alignItems: "flex-end",
  },
  userRankScore: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  userRankPercentile: {
    fontSize: 12,
    color: Colors.success,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Podium
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  podiumItem: {
    alignItems: "center",
    width: "30%",
  },
  podiumItemFirst: {
    marginBottom: 20,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: Spacing.xs,
  },
  podiumInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
    maxWidth: "90%",
    textAlign: "center",
  },
  podiumScore: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontVariant: ["tabular-nums"],
    marginBottom: Spacing.sm,
  },
  podiumBar: {
    width: "90%",
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  podiumPosition: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },

  // List
  listContainer: {
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  listItemCurrent: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  listRank: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textTertiary,
    width: 36,
    fontVariant: ["tabular-nums"],
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  listInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  listNameCurrent: {
    color: Colors.accent,
  },
  listWins: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  listRight: {
    alignItems: "flex-end",
  },
  listScore: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  listPts: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  bottomSpacer: {
    height: 40,
  },
});
