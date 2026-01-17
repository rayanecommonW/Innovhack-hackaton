import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/theme";

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
      return {
        icon: "checkmark-circle",
        color: Colors.success,
        text: "a validé",
        emoji: "✅",
      };
    case "joined":
      return {
        icon: "enter",
        color: Colors.info,
        text: "a rejoint",
        emoji: "🎯",
      };
    case "failed":
      return {
        icon: "close-circle",
        color: Colors.danger,
        text: "a raté",
        emoji: "😢",
      };
    case "won":
      return {
        icon: "trophy",
        color: Colors.accent,
        text: "a gagné",
        emoji: "🏆",
      };
  }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={18} color={Colors.info} />
        <Text style={styles.title}>Activité récente</Text>
      </View>

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
              entering={FadeInLeft.delay(index * 80).springify()}
              style={styles.activityCard}
            >
              <Text style={styles.emoji}>{config.emoji}</Text>
              <Text style={styles.activityText}>
                <Text style={styles.userName}>{activity.userName}</Text>
                {" "}{config.text}{" "}
                <Text style={styles.challengeName}>{activity.challengeTitle}</Text>
              </Text>
              {activity.amount && (
                <View style={[styles.amountBadge, { backgroundColor: config.color + "20" }]}>
                  <Text style={[styles.amountText, { color: config.color }]}>
                    {activity.action === "won" ? "+" : "-"}{activity.amount}€
                  </Text>
                </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  activityCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  activityText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  challengeName: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  amountBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  amountText: {
    ...Typography.labelSmall,
    fontWeight: "700",
  },
  timeAgo: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});

export default ActivityFeed;
