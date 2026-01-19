/**
 * Activity Feed Screen
 * Friends activity and global feed
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  joined_pact: { icon: "enter", color: Colors.info },
  submitted_proof: { icon: "camera", color: Colors.accent },
  won_pact: { icon: "trophy", color: Colors.warning },
  lost_pact: { icon: "sad", color: Colors.textTertiary },
  badge_unlocked: { icon: "ribbon", color: Colors.warning },
  streak: { icon: "flame", color: Colors.danger },
  default: { icon: "ellipse", color: Colors.textMuted },
};

export default function ActivityScreen() {
  const { userId } = useAuth();
  const [view, setView] = useState<"friends" | "global">("friends");
  const [refreshing, setRefreshing] = useState(false);

  const friendsFeed = useQuery(
    api.feed.getFriendsFeed,
    userId && view === "friends" ? { userId } : "skip"
  );

  const globalFeed = useQuery(
    api.feed.getGlobalFeed,
    view === "global" ? {} : "skip"
  );

  const feed = view === "friends" ? friendsFeed : globalFeed;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Activité</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* View Toggle */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setView("friends")}
          style={[styles.toggleButton, view === "friends" && styles.toggleButtonActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people"
            size={18}
            color={view === "friends" ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.toggleText, view === "friends" && styles.toggleTextActive]}>
            Amis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView("global")}
          style={[styles.toggleButton, view === "global" && styles.toggleButtonActive]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="globe"
            size={18}
            color={view === "global" ? Colors.white : Colors.textSecondary}
          />
          <Text style={[styles.toggleText, view === "global" && styles.toggleTextActive]}>
            Global
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Feed */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
      >
        {!feed ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : feed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {view === "friends"
                ? "Aucune activité de tes amis"
                : "Aucune activité récente"}
            </Text>
            {view === "friends" && (
              <TouchableOpacity onPress={() => setView("global")} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>Voir l'activité globale</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.feedList}>
            {feed.map((activity: any, index: number) => (
              <Animated.View
                key={activity._id}
                entering={FadeInDown.delay(100 + index * 30).duration(300)}
              >
                <ActivityItem activity={activity} />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityItem({ activity }: { activity: any }) {
  const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
  const timeAgo = getTimeAgo(activity.createdAt);
  const message = getActivityMessage(activity);

  return (
    <View style={styles.activityCard}>
      <View style={[styles.activityIcon, { backgroundColor: config.color + "15" }]}>
        <Ionicons name={config.icon as any} size={18} color={config.color} />
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{activity.user?.name || "Quelqu'un"}</Text>
          {" "}{message}
        </Text>
        <Text style={styles.activityTime}>{timeAgo}</Text>
      </View>
    </View>
  );
}

function getActivityMessage(activity: any): string {
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case "joined_pact":
      return `a rejoint "${metadata.challengeTitle || "un pact"}"`;
    case "submitted_proof":
      return `a soumis une preuve pour "${metadata.challengeTitle || "un pact"}"`;
    case "won_pact":
      const amount = metadata.amount ? ` (+${metadata.amount.toFixed(0)}€)` : "";
      return `a gagné "${metadata.challengeTitle || "un pact"}"${amount}`;
    case "lost_pact":
      return `n'a pas réussi "${metadata.challengeTitle || "un pact"}"`;
    case "badge_unlocked":
      return `a débloqué ${metadata.badgeIcon || ""} ${metadata.badgeTitle || "un badge"}`;
    case "streak":
      return `est sur une série de ${metadata.streakCount || "?"} victoires !`;
    default:
      return "a fait quelque chose";
  }
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}j`;

  return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    ...Shadows.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
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
    textAlign: "center",
  },
  emptyAction: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.white,
  },

  // Feed List
  feedList: {
    gap: Spacing.sm,
  },

  // Activity Card
  activityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
