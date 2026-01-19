/**
 * Blocked Users Page
 * View and manage blocked users
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Id } from "../convex/_generated/dataModel";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function BlockedUsersScreen() {
  const { userId } = useAuth();

  const blockedUsers = useQuery(
    api.users.getBlockedUsers,
    userId ? { userId } : "skip"
  );

  const unblockUser = useMutation(api.users.unblockUser);

  const handleUnblock = (blockedUserId: Id<"users">, name: string) => {
    if (!userId) return;

    Alert.alert(
      "Débloquer",
      `Voulez-vous débloquer ${name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Débloquer",
          onPress: async () => {
            try {
              await unblockUser({
                userId,
                blockedUserId,
              });
            } catch (error) {
              Alert.alert("Erreur", "Impossible de débloquer l'utilisateur");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Utilisateurs bloqués</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!blockedUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : blockedUsers.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.emptyContainer}>
            <Ionicons name="ban-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
            <Text style={styles.emptyDescription}>
              Les utilisateurs que vous bloquez apparaîtront ici
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.usersList}>
            {blockedUsers.map((user: any, index: number) => (
              <Animated.View
                key={user._id}
                entering={FadeInDown.delay(50 + index * 30).duration(300)}
              >
                <View style={styles.userCard}>
                  {user.profileImageUrl ? (
                    <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.username && (
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleUnblock(user._id, user.name)}
                    style={styles.unblockButton}
                  >
                    <Text style={styles.unblockText}>Débloquer</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Empty
  emptyContainer: {
    paddingTop: Spacing.xxl * 2,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // List
  usersList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  userUsername: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.sm,
  },
  unblockText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },

  bottomSpacer: {
    height: 40,
  },
});
