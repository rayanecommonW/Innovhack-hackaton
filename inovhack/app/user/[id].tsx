/**
 * User Profile Page (Instagram Style)
 * View any user's profile with their stats, badges, and activity
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Id } from "../../convex/_generated/dataModel";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../constants/theme";

const BADGE_RARITY_COLORS: Record<string, string> = {
  common: Colors.textMuted,
  rare: Colors.info,
  epic: "#9B59B6",
  legendary: Colors.warning,
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId: currentUserId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const profileUserId = id as Id<"users">;
  const isOwnProfile = currentUserId === profileUserId;

  const profile = useQuery(
    api.users.getPublicProfile,
    profileUserId ? { userId: profileUserId } : "skip"
  );

  const blockUser = useMutation(api.users.blockUser);
  const reportUser = useMutation(api.users.reportUser);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBlock = () => {
    if (!currentUserId) return;

    Alert.alert(
      "Bloquer l'utilisateur",
      "Voulez-vous vraiment bloquer cet utilisateur ? Vous ne verrez plus ses activités.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bloquer",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser({
                userId: currentUserId,
                blockedUserId: profileUserId,
              });
              Alert.alert("Utilisateur bloqué", "Vous ne verrez plus cet utilisateur.");
              router.back();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de bloquer l'utilisateur");
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!currentUserId) return;

    Alert.alert("Signaler l'utilisateur", "Pour quelle raison ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Comportement inapproprié",
        onPress: () => submitReport("inappropriate_behavior"),
      },
      {
        text: "Spam",
        onPress: () => submitReport("spam"),
      },
      {
        text: "Fraude",
        onPress: () => submitReport("fraud"),
      },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (!currentUserId) return;

    try {
      await reportUser({
        reporterId: currentUserId,
        reportedUserId: profileUserId,
        reason,
      });
      Alert.alert("Signalement envoyé", "Merci de nous aider à maintenir une communauté saine.");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer le signalement");
    }
  };

  const showMoreOptions = () => {
    if (isOwnProfile) {
      router.push("/settings");
      return;
    }

    Alert.alert("Options", "", [
      { text: "Annuler", style: "cancel" },
      { text: "Signaler", onPress: handleReport },
      { text: "Bloquer", style: "destructive", onPress: handleBlock },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {profile.username ? `@${profile.username}` : profile.name}
          </Text>
          <TouchableOpacity onPress={showMoreOptions} style={styles.moreButton}>
            <Ionicons
              name={isOwnProfile ? "settings-outline" : "ellipsis-horizontal"}
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile.name}</Text>
          {profile.username && (
            <Text style={styles.username}>@{profile.username}</Text>
          )}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {profile.createdAt && (
            <Text style={styles.memberSince}>
              Membre depuis {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalPacts || 0}</Text>
              <Text style={styles.statLabel}>Pacts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalWins || 0}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.successRate || 0}%</Text>
              <Text style={styles.statLabel}>Réussite</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Série</Text>
            </View>
          </View>
        </Animated.View>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesGrid}>
              {profile.badges.map((badge: any, index: number) => (
                <Animated.View
                  key={badge._id}
                  entering={FadeInDown.delay(200 + index * 30).duration(300)}
                  style={[
                    styles.badgeItem,
                    { borderColor: BADGE_RARITY_COLORS[badge.rarity] + "40" },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>
                    {badge.title}
                  </Text>
                  <Text
                    style={[
                      styles.badgeRarity,
                      { color: BADGE_RARITY_COLORS[badge.rarity] },
                    ]}
                  >
                    {badge.rarity === "common" && "Commun"}
                    {badge.rarity === "rare" && "Rare"}
                    {badge.rarity === "epic" && "Épique"}
                    {badge.rarity === "legendary" && "Légendaire"}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Performance Cards */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance</Text>

          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <View style={[styles.performanceIcon, { backgroundColor: Colors.successMuted }]}>
                <Ionicons name="trophy" size={20} color={Colors.success} />
              </View>
              <View style={styles.performanceInfo}>
                <Text style={styles.performanceValue}>
                  {profile.totalEarnings?.toFixed(0) || 0}€
                </Text>
                <Text style={styles.performanceLabel}>Gains totaux</Text>
              </View>
            </View>

            <View style={styles.performanceCard}>
              <View style={[styles.performanceIcon, { backgroundColor: Colors.warningMuted }]}>
                <Ionicons name="flame" size={20} color={Colors.warning} />
              </View>
              <View style={styles.performanceInfo}>
                <Text style={styles.performanceValue}>{profile.bestStreak || 0}</Text>
                <Text style={styles.performanceLabel}>Meilleure série</Text>
              </View>
            </View>

            <View style={styles.performanceCard}>
              <View style={[styles.performanceIcon, { backgroundColor: Colors.infoMuted }]}>
                <Ionicons name="game-controller" size={20} color={Colors.info} />
              </View>
              <View style={styles.performanceInfo}>
                <Text style={styles.performanceValue}>{profile.activePacts || 0}</Text>
                <Text style={styles.performanceLabel}>Pacts actifs</Text>
              </View>
            </View>

            <View style={styles.performanceCard}>
              <View style={[styles.performanceIcon, { backgroundColor: Colors.dangerMuted }]}>
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
              </View>
              <View style={styles.performanceInfo}>
                <Text style={styles.performanceValue}>{profile.totalLosses || 0}</Text>
                <Text style={styles.performanceLabel}>Défaites</Text>
              </View>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
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
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginHorizontal: Spacing.sm,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceHighlight,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: "80%",
    marginBottom: Spacing.sm,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Stats
  statsSection: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // Badges
  badgesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1,
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
    fontWeight: "500",
    marginTop: 2,
  },

  // Performance
  performanceSection: {
    marginBottom: Spacing.xl,
  },
  performanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  performanceCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  performanceLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 40,
  },
});
