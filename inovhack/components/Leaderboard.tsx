import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "../constants/theme";

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

const getMedalColor = (position: number) => {
  switch (position) {
    case 0:
      return "#FFD700"; // Gold
    case 1:
      return "#C0C0C0"; // Silver
    case 2:
      return "#CD7F32"; // Bronze
    default:
      return Colors.textTertiary;
  }
};

const getMedalEmoji = (position: number) => {
  switch (position) {
    case 0:
      return "🥇";
    case 1:
      return "🥈";
    case 2:
      return "🥉";
    default:
      return `${position + 1}`;
  }
};

const Leaderboard: React.FC<LeaderboardProps> = ({ users, title = "Classement" }) => {
  return (
    <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={20} color={Colors.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Top 3 Podium */}
      <View style={styles.podium}>
        {/* 2nd Place */}
        {users[1] && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={[styles.podiumItem, styles.podiumSecond]}
          >
            <View style={[styles.podiumAvatar, { backgroundColor: "#C0C0C0" }]}>
              <Text style={styles.podiumAvatarText}>{users[1].name.charAt(0)}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[1].name}</Text>
            <Text style={styles.podiumPoints}>{users[1].points} pts</Text>
            <View style={[styles.podiumBar, { height: 60, backgroundColor: "#C0C0C0" }]}>
              <Text style={styles.podiumPosition}>2</Text>
            </View>
          </Animated.View>
        )}

        {/* 1st Place */}
        {users[0] && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={[styles.podiumItem, styles.podiumFirst]}
          >
            <Text style={styles.crownEmoji}>👑</Text>
            <View style={[styles.podiumAvatar, { backgroundColor: "#FFD700" }]}>
              <Text style={styles.podiumAvatarText}>{users[0].name.charAt(0)}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[0].name}</Text>
            <Text style={styles.podiumPoints}>{users[0].points} pts</Text>
            <View style={[styles.podiumBar, { height: 80, backgroundColor: "#FFD700" }]}>
              <Text style={styles.podiumPosition}>1</Text>
            </View>
          </Animated.View>
        )}

        {/* 3rd Place */}
        {users[2] && (
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={[styles.podiumItem, styles.podiumThird]}
          >
            <View style={[styles.podiumAvatar, { backgroundColor: "#CD7F32" }]}>
              <Text style={styles.podiumAvatarText}>{users[2].name.charAt(0)}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{users[2].name}</Text>
            <Text style={styles.podiumPoints}>{users[2].points} pts</Text>
            <View style={[styles.podiumBar, { height: 45, backgroundColor: "#CD7F32" }]}>
              <Text style={styles.podiumPosition}>3</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Rest of the list */}
      {users.slice(3).map((user, index) => (
        <Animated.View
          key={user.id}
          entering={FadeInRight.delay(500 + index * 50).springify()}
          style={[styles.listItem, user.isCurrentUser && styles.listItemCurrent]}
        >
          <Text style={styles.listPosition}>{index + 4}</Text>
          <View style={styles.listAvatar}>
            <Text style={styles.listAvatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{user.name}</Text>
            <View style={styles.listStreak}>
              <Text style={styles.listStreakEmoji}>🔥</Text>
              <Text style={styles.listStreakText}>{user.streak}</Text>
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
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  podiumItem: {
    alignItems: "center",
    width: 80,
  },
  podiumFirst: {
    marginHorizontal: Spacing.md,
  },
  podiumSecond: {},
  podiumThird: {},
  crownEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.black,
  },
  podiumName: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  podiumPoints: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
    marginBottom: Spacing.sm,
  },
  podiumBar: {
    width: 50,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumPosition: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.black,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemCurrent: {
    backgroundColor: Colors.successMuted,
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  listPosition: {
    width: 24,
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  listStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  listStreakEmoji: {
    fontSize: 10,
  },
  listStreakText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  listPoints: {
    ...Typography.labelMedium,
    color: Colors.success,
  },
});

export default Leaderboard;
