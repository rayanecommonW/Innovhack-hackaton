/**
 * Profile Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity with Instagram-style profile
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import AddFundsModal from "../../components/AddFundsModal";
import FriendsModal from "../../components/FriendsModal";
import { getCategoryName } from "../../constants/categories";
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

export default function ProfileScreen() {
  const { user, userId, isLoading, refreshUser } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  // Get full profile with image and badges
  const profile = useQuery(
    api.users.getPublicProfile,
    userId ? { userId } : "skip"
  );

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const proofsToVote = useQuery(
    api.votes.getProofsToVote,
    userId ? { userId } : "skip"
  );

  const handleSubmitProof = (participationId: string) => {
    router.push({ pathname: "/submit-proof", params: { participationId } });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.loginIconBox}>
            <Ionicons name="person-outline" size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.loginTitle}>Connexion requise</Text>
          <Text style={styles.loginSubtitle}>Connecte-toi pour accéder à ton profil</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const wonCount = participations?.filter((p: any) => p.status === "won").length || 0;
  const totalBets = participations?.length || 0;
  const winRate = totalBets > 0 ? Math.round((wonCount / totalBets) * 100) : 0;

  // Filter active participations (not yet won or lost)
  const activePacts = participations?.filter((p: any) => p.status === "active") || [];

  // Get badges from profile
  const badges = profile?.badges || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Section - Instagram Style */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.profileSection}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/user/[id]", params: { id: userId } })}
            style={styles.avatarContainer}
            activeOpacity={0.9}
          >
            {profile?.profileImageUrl ? (
              <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: userId } })}
              activeOpacity={0.8}
            >
              <Text style={styles.userName}>{user.name}</Text>
            </TouchableOpacity>
            {profile?.username && (
              <Text style={styles.userUsername}>@{profile.username}</Text>
            )}
            {profile?.bio && (
              <Text style={styles.userBio} numberOfLines={2}>{profile.bio}</Text>
            )}
          </View>
        </Animated.View>

        {/* Badges Row */}
        {badges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.badgesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesScroll}
            >
              {badges.slice(0, 5).map((badge: any, index: number) => (
                <TouchableOpacity
                  key={badge._id}
                  style={[
                    styles.badgeItem,
                    { borderColor: BADGE_RARITY_COLORS[badge.rarity] + "40" },
                  ]}
                  onPress={() => router.push("/badges")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
                </TouchableOpacity>
              ))}
              {badges.length > 5 && (
                <TouchableOpacity
                  style={styles.moreBadges}
                  onPress={() => router.push("/badges")}
                >
                  <Text style={styles.moreBadgesText}>+{badges.length - 5}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet-outline" size={18} color={Colors.accent} />
            <Text style={styles.balanceLabelText}>Solde disponible</Text>
          </View>
          <View style={styles.balanceMain}>
            <Text style={styles.balanceAmount}>{user.balance.toFixed(2)}€</Text>
            <TouchableOpacity
              onPress={() => setShowAddFunds(true)}
              style={styles.addFundsButton}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addFundsText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statValueSuccess]}>{wonCount}</Text>
            <Text style={styles.statLabel}>Gagnés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Réussite</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalBets}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {profile?.currentStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Série</Text>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.quickActionsGrid}>
          <TouchableOpacity
            onPress={() => router.push("/stats")}
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.infoMuted }]}>
              <Ionicons name="stats-chart" size={20} color={Colors.info} />
            </View>
            <Text style={styles.quickActionLabel}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/leaderboard")}
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.warningMuted }]}>
              <Ionicons name="trophy" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.quickActionLabel}>Classement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/badges")}
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "rgba(155, 138, 224, 0.1)" }]}>
              <Ionicons name="ribbon" size={20} color="#9B8AE0" />
            </View>
            <Text style={styles.quickActionLabel}>Badges</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/activity")}
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.successMuted }]}>
              <Ionicons name="newspaper" size={20} color={Colors.success} />
            </View>
            <Text style={styles.quickActionLabel}>Activité</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Cards */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={styles.actionCard}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: Colors.dangerMuted }]}>
                <Ionicons name="notifications-outline" size={22} color={Colors.danger} />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Notifications</Text>
                <Text style={styles.actionCardSubtitle}>Rappels et alertes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(400)}>
          <TouchableOpacity
            onPress={() => setShowFriends(true)}
            style={styles.actionCard}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardLeft}>
              <View style={styles.actionCardIcon}>
                <Ionicons name="people-outline" size={22} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Mes amis</Text>
                <Text style={styles.actionCardSubtitle}>Ajouter et gérer tes amis</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push("/transactions")}
            style={styles.actionCard}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: Colors.successMuted }]}>
                <Ionicons name="receipt-outline" size={22} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Transactions</Text>
                <Text style={styles.actionCardSubtitle}>Historique des paiements</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push("/referrals")}
            style={styles.actionCard}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardLeft}>
              <View style={[styles.actionCardIcon, { backgroundColor: Colors.warningMuted }]}>
                <Ionicons name="gift-outline" size={22} color={Colors.warning} />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Parrainage</Text>
                <Text style={styles.actionCardSubtitle}>Invite tes amis et gagne</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Community Proofs to Vote */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <TouchableOpacity
            onPress={() => router.push("/community-proofs")}
            style={[
              styles.actionCard,
              proofsToVote && proofsToVote.length > 0 && styles.actionCardActive
            ]}
            activeOpacity={0.9}
          >
            <View style={styles.actionCardLeft}>
              <View style={[
                styles.actionCardIcon,
                proofsToVote && proofsToVote.length > 0 && styles.actionCardIconActive
              ]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={proofsToVote && proofsToVote.length > 0 ? Colors.white : Colors.textTertiary}
                />
              </View>
              <View>
                <Text style={styles.actionCardTitle}>Validation communautaire</Text>
                <Text style={[
                  styles.actionCardSubtitle,
                  proofsToVote && proofsToVote.length > 0 && styles.actionCardSubtitleActive
                ]}>
                  {proofsToVote && proofsToVote.length > 0
                    ? `${proofsToVote.length} preuve${proofsToVote.length > 1 ? "s" : ""} en attente`
                    : "Aucune preuve à valider"
                  }
                </Text>
              </View>
            </View>
            {proofsToVote && proofsToVote.length > 0 ? (
              <View style={styles.proofsBadge}>
                <Text style={styles.proofsBadgeText}>{proofsToVote.length}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Active Pacts */}
        {activePacts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.activePactsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Mes pacts actifs</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{activePacts.length}</Text>
              </View>
            </View>
            <View style={styles.pactsList}>
              {activePacts.map((pact: any, index: number) => (
                <Animated.View
                  key={pact._id}
                  entering={FadeInRight.delay(320 + index * 40).duration(300)}
                >
                  <View style={styles.pactCard}>
                    <View style={styles.pactMain}>
                      <Text style={styles.pactTitle} numberOfLines={1}>
                        {pact.challenge?.title || "Pact"}
                      </Text>
                      <View style={styles.pactMeta}>
                        <View style={styles.pactCategoryBadge}>
                          <Text style={styles.pactCategoryText}>
                            {pact.challenge?.category ? getCategoryName(pact.challenge.category) : ""}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.pactRight}>
                      <Text style={styles.pactBet}>{pact.betAmount}€</Text>
                      <TouchableOpacity
                        onPress={() => handleSubmitProof(pact._id)}
                        style={styles.submitProofButton}
                      >
                        <Ionicons name="camera-outline" size={18} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Funds Modal */}
      <AddFundsModal
        visible={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        userId={userId}
        onSuccess={refreshUser}
      />

      {/* Friends Modal */}
      <FriendsModal
        visible={showFriends}
        onClose={() => setShowFriends(false)}
        userId={userId}
        userUsername={user?.username}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  loginIconBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  loginSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Section
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  userUsername: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  userBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  // Badges Section
  badgesSection: {
    marginBottom: Spacing.lg,
  },
  badgesScroll: {
    gap: Spacing.sm,
  },
  badgeItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    minWidth: 70,
    ...Shadows.xs,
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  moreBadges: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  moreBadgesText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textTertiary,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  balanceLabelText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  balanceMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.white,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statValueSuccess: {
    color: Colors.success,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadows.xs,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },

  // Action Cards
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  actionCardActive: {
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardIconActive: {
    backgroundColor: Colors.accent,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  actionCardSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginTop: 2,
  },
  actionCardSubtitleActive: {
    color: Colors.accent,
  },
  proofsBadge: {
    minWidth: 28,
    height: 28,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  proofsBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.white,
  },

  // Active Pacts
  activePactsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.accent,
  },
  pactsList: {
    gap: Spacing.sm,
  },
  pactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  pactMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  pactTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  pactMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  pactCategoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pactCategoryText: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  pactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  pactBet: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  submitProofButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomSpacer: {
    height: 120,
  },
});
