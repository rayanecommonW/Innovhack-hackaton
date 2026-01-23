/**
 * Friend Profile Screen - View a friend's profile with badges, stats, etc.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function FriendProfileScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { userId } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);

  const friendProfile = useQuery(
    api.friends.getFriendProfile,
    userId && friendId ? { userId, friendId: friendId as any } : "skip"
  );

  const removeFriend = useMutation(api.friends.removeFriend);

  const handleRemoveFriend = () => {
    Alert.alert(
      "Retirer cet ami ?",
      `Tu ne pourras plus voir ${friendProfile?.name} dans ta liste d'amis.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            if (!userId || !friendId) return;
            setIsRemoving(true);
            try {
              await removeFriend({ userId, friendId: friendId as any });
              router.back();
            } catch (err: any) {
              Alert.alert("Erreur", err.message);
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  if (!friendProfile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return Colors.warning;
      case "epic":
        return "#9B59B6";
      case "rare":
        return Colors.info;
      default:
        return Colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Profil</Text>
        <TouchableOpacity onPress={handleRemoveFriend} style={styles.menuButton} disabled={isRemoving}>
          {isRemoving ? (
            <ActivityIndicator color={Colors.danger} size="small" />
          ) : (
            <Ionicons name="person-remove-outline" size={22} color={Colors.danger} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {friendProfile.profileImageUrl ? (
              <Image source={{ uri: friendProfile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {friendProfile.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{friendProfile.level}</Text>
            </View>
          </View>

          <Text style={styles.profileName}>{friendProfile.name}</Text>
          {friendProfile.username && (
            <Text style={styles.profileUsername}>@{friendProfile.username}</Text>
          )}
          {friendProfile.bio && (
            <Text style={styles.profileBio}>{friendProfile.bio}</Text>
          )}

          <Text style={styles.memberSince}>
            Membre depuis {new Date(friendProfile.createdAt).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={Colors.success} />
              <Text style={styles.statValue}>{friendProfile.stats.wonPacts}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{friendProfile.stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Série</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="ribbon" size={24} color={Colors.info} />
              <Text style={styles.statValue}>{friendProfile.stats.successRate}%</Text>
              <Text style={styles.statLabel}>Réussite</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={Colors.accent} />
              <Text style={styles.statValue}>{friendProfile.stats.bestStreak}</Text>
              <Text style={styles.statLabel}>Record</Text>
            </View>
          </View>
        </Animated.View>

        {/* Additional Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.detailStatsCard}>
          <View style={styles.detailStatRow}>
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatLabel}>Pacts totaux</Text>
              <Text style={styles.detailStatValue}>{friendProfile.stats.totalPacts}</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStatItem}>
              <Text style={styles.detailStatLabel}>Perdus</Text>
              <Text style={[styles.detailStatValue, { color: Colors.danger }]}>
                {friendProfile.stats.lostPacts}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Badges Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>
            Badges ({friendProfile.badges.length})
          </Text>
          {friendProfile.badges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {friendProfile.badges.map((badge: any, index: number) => (
                <Animated.View
                  key={badge._id}
                  entering={ZoomIn.delay(250 + index * 50).duration(300)}
                  style={[
                    styles.badgeCard,
                    { borderColor: getRarityColor(badge.rarity) },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>
                    {badge.title}
                  </Text>
                  <Text
                    style={[styles.badgeRarity, { color: getRarityColor(badge.rarity) }]}
                  >
                    {badge.rarity === "legendary"
                      ? "Légendaire"
                      : badge.rarity === "epic"
                      ? "Épique"
                      : badge.rarity === "rare"
                      ? "Rare"
                      : "Commun"}
                  </Text>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBadges}>
              <Ionicons name="ribbon-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyBadgesText}>Aucun badge pour l'instant</Text>
            </View>
          )}
        </Animated.View>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: Colors.accent,
  },
  levelBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  profileUsername: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  profileBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Stats Section
  statsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Detail Stats
  detailStatsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  detailStatRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailStatItem: {
    flex: 1,
    alignItems: "center",
  },
  detailStatLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  detailStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  // Badges Section
  badgesSection: {
    marginBottom: Spacing.lg,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeCard: {
    width: "30%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
    borderWidth: 2,
    ...Shadows.xs,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  badgeRarity: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
  },
  emptyBadges: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  emptyBadgesText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  bottomSpacer: {
    height: 40,
  },
});
