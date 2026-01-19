/**
 * ActivityFeed - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "../constants/theme";

interface ActivityItem {
  id: string;
  userName: string;
  action: "completed" | "joined" | "failed" | "won";
  challengeTitle: string;
  amount?: number;
  timeAgo: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const getActionConfig = (action: ActivityItem["action"]) => {
  switch (action) {
    case "completed":
      return { icon: "checkmark" as const, color: Colors.success, text: "Validé" };
    case "joined":
      return { icon: "arrow-forward" as const, color: Colors.info, text: "Rejoint" };
    case "failed":
      return { icon: "close" as const, color: Colors.danger, text: "Raté" };
    case "won":
      return { icon: "trophy" as const, color: Colors.success, text: "Gagné" };
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activité récente</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activities.map((activity, index) => {
          const config = getActionConfig(activity.action);
          return (
            <Animated.View
              key={activity.id}
              entering={FadeInLeft.delay(index * 60).duration(300)}
              style={styles.card}
            >
              <View style={[styles.statusDot, { backgroundColor: config.color }]} />

              <Text style={styles.userName}>{activity.userName}</Text>
              <Text style={styles.actionText}>{config.text}</Text>
              <Text style={styles.challengeName} numberOfLines={2}>
                {activity.challengeTitle}
              </Text>

              {activity.amount && (
                <Text style={[styles.amountText, { color: config.color }]}>
                  {activity.action === "won" ? "+" : "-"}{activity.amount}€
                </Text>
              )}

              <Text style={styles.timeAgo}>{activity.timeAgo}</Text>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: 140,
    ...Shadows.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  challengeName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textMuted,
  },
});

export default ActivityFeed;
