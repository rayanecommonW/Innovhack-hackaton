/**
 * Notifications Screen
 * All user notifications with read/unread management
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
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  badge_unlocked: { icon: "ribbon", color: Colors.warning, bg: Colors.warningMuted },
  deadline_reminder: { icon: "alarm", color: Colors.danger, bg: Colors.dangerMuted },
  proof_validated: { icon: "checkmark-circle", color: Colors.success, bg: Colors.successMuted },
  proof_rejected: { icon: "close-circle", color: Colors.danger, bg: Colors.dangerMuted },
  pact_won: { icon: "trophy", color: Colors.warning, bg: Colors.warningMuted },
  pact_lost: { icon: "sad", color: Colors.textTertiary, bg: Colors.surfaceHighlight },
  deposit_success: { icon: "wallet", color: Colors.success, bg: Colors.successMuted },
  withdrawal_pending: { icon: "time", color: Colors.info, bg: Colors.infoMuted },
  withdrawal_success: { icon: "checkmark-done", color: Colors.success, bg: Colors.successMuted },
  withdrawal_cancelled: { icon: "close", color: Colors.danger, bg: Colors.dangerMuted },
  referral_bonus: { icon: "gift", color: Colors.accent, bg: Colors.accentMuted },
  new_referral: { icon: "people", color: Colors.info, bg: Colors.infoMuted },
  new_comment: { icon: "chatbubble", color: Colors.info, bg: Colors.infoMuted },
  new_vote: { icon: "thumbs-up", color: Colors.success, bg: Colors.successMuted },
  default: { icon: "notifications", color: Colors.textSecondary, bg: Colors.surfaceHighlight },
};

export default function NotificationsScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications = useQuery(
    api.notifications.getNotifications,
    userId ? { userId, unreadOnly: filter === "unread" } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleMarkAllRead = async () => {
    if (userId) {
      await markAllAsRead({ userId });
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      await markAsRead({ notificationId: notification._id });
    }

    // Navigate based on notification type
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (data.challengeId) {
          router.push({ pathname: "/submit-proof", params: { challengeId: data.challengeId } });
        } else if (data.badgeId) {
          router.push("/badges");
        }
      } catch {}
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={styles.placeholder} />}
      </Animated.View>

      {/* Filter */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("unread")}
          style={[styles.filterButton, filter === "unread" && styles.filterButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === "unread" && styles.filterTextActive]}>
            Non lues {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
      >
        {!notifications ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <Animated.View
                key={notification._id}
                entering={FadeInDown.delay(100 + index * 30).duration(300)}
              >
                <NotificationItem
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: any;
  onPress: () => void;
}) {
  const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
      activeOpacity={0.7}
    >
      <View style={[styles.notificationIcon, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.notificationTime}>{timeAgo}</Text>
      </View>

      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;

  const date = new Date(timestamp);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
    width: 70,
  },
  markAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Filter
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    ...Shadows.xs,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  filterTextActive: {
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
  },

  // List
  notificationsList: {
    gap: Spacing.sm,
  },

  // Card
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  notificationUnread: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.sm,
    marginTop: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
