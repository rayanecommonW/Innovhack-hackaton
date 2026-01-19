/**
 * Leaderboard - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "../constants/theme";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  streak: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  title?: string;
}

const getMedalConfig = (position: number) => {
  switch (position) {
    case 0:
      return { color: "#D4AF37", bg: "#FDF6E3" }; // Soft gold
    case 1:
      return { color: "#A8A8A8", bg: "#F5F5F5" }; // Soft silver
    case 2:
      return { color: "#CD9B6D", bg: "#FBF4EF" }; // Soft bronze
    default:
      return { color: Colors.textTertiary, bg: Colors.surfaceHighlight };
  }
};

const Leaderboard: React.FC<LeaderboardProps> = ({ users, title = "Classement" }) => {
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="trophy-outline" size={18} color={Colors.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Top 3 Podium */}
      <View style={styles.podium}>
        {/* 2nd Place */}
        {users[1] && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            style={[styles.podiumItem, styles.podiumSecond]}
          >
            <View style={[styles.podiumAvatar, { backgroundColor: getMedalConfig(1).bg }]}>
              <Text style={[styles.podiumAvatarText, { color: getMedalConfig(1).color }]}>
                {users[1].name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[1].name}</Text>
            <Text style={styles.podiumPoints}>{users[1].points} pts</Text>
            <View style={[styles.podiumBar, styles.podiumBarSecond]}>
              <Text style={[styles.podiumPosition, { color: getMedalConfig(1).color }]}>2</Text>
            </View>
          </Animated.View>
        )}

        {/* 1st Place */}
        {users[0] && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(300)}
            style={[styles.podiumItem, styles.podiumFirst]}
          >
            <View style={styles.crownBadge}>
              <Ionicons name="sparkles" size={12} color={getMedalConfig(0).color} />
            </View>
            <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
              <Text style={[styles.podiumAvatarText, styles.podiumAvatarTextFirst]}>
                {users[0].name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[0].name}</Text>
            <Text style={[styles.podiumPoints, styles.podiumPointsFirst]}>{users[0].points} pts</Text>
            <View style={[styles.podiumBar, styles.podiumBarFirst]}>
              <Text style={[styles.podiumPosition, styles.podiumPositionFirst]}>1</Text>
            </View>
          </Animated.View>
        )}

        {/* 3rd Place */}
        {users[2] && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={[styles.podiumItem, styles.podiumThird]}
          >
            <View style={[styles.podiumAvatar, { backgroundColor: getMedalConfig(2).bg }]}>
              <Text style={[styles.podiumAvatarText, { color: getMedalConfig(2).color }]}>
                {users[2].name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[2].name}</Text>
            <Text style={styles.podiumPoints}>{users[2].points} pts</Text>
            <View style={[styles.podiumBar, styles.podiumBarThird]}>
              <Text style={[styles.podiumPosition, { color: getMedalConfig(2).color }]}>3</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Rest of the list */}
      {users.slice(3).map((user, index) => (
        <Animated.View
          key={user.id}
          entering={FadeInRight.delay(500 + index * 50).duration(300)}
          style={[styles.listItem, user.isCurrentUser && styles.listItemCurrent]}
        >
          <View style={styles.listPosition}>
            <Text style={styles.listPositionText}>{index + 4}</Text>
          </View>
          <View style={styles.listAvatar}>
            <Text style={styles.listAvatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{user.name}</Text>
            <View style={styles.listStreak}>
              <Ionicons name="flame-outline" size={10} color={Colors.warning} />
              <Text style={styles.listStreakText}>{user.streak} jours</Text>
            </View>
          </View>
          <Text style={styles.listPoints}>{user.points} pts</Text>
        </Animated.View>
      ))}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Podium
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  podiumItem: {
    alignItems: "center",
    width: 80,
  },
  podiumFirst: {
    marginHorizontal: Spacing.sm,
  },
  podiumSecond: {},
  podiumThird: {},
  crownBadge: {
    width: 24,
    height: 24,
    backgroundColor: getMedalConfig(0).bg,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  podiumAvatarFirst: {
    width: 52,
    height: 52,
    backgroundColor: getMedalConfig(0).bg,
  },
  podiumAvatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  podiumAvatarTextFirst: {
    fontSize: 18,
    color: getMedalConfig(0).color,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  podiumPointsFirst: {
    color: Colors.accent,
    fontWeight: "500",
  },
  podiumBar: {
    width: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumBarFirst: {
    height: 64,
    backgroundColor: getMedalConfig(0).bg,
  },
  podiumBarSecond: {
    height: 48,
    backgroundColor: getMedalConfig(1).bg,
  },
  podiumBarThird: {
    height: 36,
    backgroundColor: getMedalConfig(2).bg,
  },
  podiumPosition: {
    fontSize: 18,
    fontWeight: "600",
  },
  podiumPositionFirst: {
    color: getMedalConfig(0).color,
  },

  // List Items
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemCurrent: {
    backgroundColor: Colors.accentMuted,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 0,
  },
  listPosition: {
    width: 24,
    height: 24,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  listPositionText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  listStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  listStreakText: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  listPoints: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },
});

export default Leaderboard;
