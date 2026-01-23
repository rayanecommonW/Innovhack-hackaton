/**
 * Admin Panel Screen
 * Interface d'administration pour PACT
 * Accessible uniquement aux admins
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
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
import { Id } from "../convex/_generated/dataModel";

type Tab = "overview" | "disputes" | "users" | "challenges";

export default function AdminScreen() {
  const { userId, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolving, setResolving] = useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.isAdmin;

  // Queries
  const stats = useQuery(
    api.admin.getAdminStats,
    userId && isAdmin ? { adminId: userId } : "skip"
  );

  const pendingDisputes = useQuery(
    api.admin.getPendingDisputes,
    userId && isAdmin ? { adminId: userId } : "skip"
  );

  const allUsers = useQuery(
    api.admin.getAllUsers,
    userId && isAdmin && activeTab === "users" ? { adminId: userId, limit: 50 } : "skip"
  );

  const allChallenges = useQuery(
    api.admin.getAllChallenges,
    userId && isAdmin && activeTab === "challenges" ? { adminId: userId, limit: 50 } : "skip"
  );

  // Mutations
  const resolveDispute = useMutation(api.admin.resolveDispute);
  const toggleUserBlock = useMutation(api.admin.toggleUserBlock);
  const cancelChallenge = useMutation(api.admin.cancelChallenge);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Non-admin view
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={60} color={Colors.textMuted} />
          <Text style={styles.noAccessTitle}>Accès refusé</Text>
          <Text style={styles.noAccessText}>
            Cette page est réservée aux administrateurs PACT.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleResolveDispute = async (resolution: string) => {
    if (!selectedDispute || !userId) return;
    if (!resolutionComment.trim()) {
      Alert.alert("Erreur", "Ajoute un commentaire pour expliquer ta décision");
      return;
    }

    setResolving(true);
    try {
      await resolveDispute({
        adminId: userId,
        disputeId: selectedDispute._id,
        resolution,
        comment: resolutionComment,
      });
      Alert.alert("Succès", "Dispute résolue");
      setSelectedDispute(null);
      setResolutionComment("");
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleBlockUser = async (targetUserId: Id<"users">, currentlyBlocked: boolean) => {
    if (!userId) return;

    Alert.alert(
      currentlyBlocked ? "Débloquer" : "Bloquer",
      currentlyBlocked
        ? "Réactiver ce compte ?"
        : "Bloquer ce compte ? L'utilisateur ne pourra plus se connecter.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: currentlyBlocked ? "Débloquer" : "Bloquer",
          style: currentlyBlocked ? "default" : "destructive",
          onPress: async () => {
            try {
              await toggleUserBlock({
                adminId: userId,
                userId: targetUserId,
                blocked: !currentlyBlocked,
                reason: currentlyBlocked ? undefined : "Bloqué par admin",
              });
            } catch (err: any) {
              Alert.alert("Erreur", err.message);
            }
          },
        },
      ]
    );
  };

  const handleCancelChallenge = async (challengeId: Id<"challenges">, title: string) => {
    if (!userId) return;

    Alert.prompt(
      "Annuler le pact",
      `Annuler "${title}" et rembourser tous les participants ?\n\nRaison:`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async (reason) => {
            try {
              await cancelChallenge({
                adminId: userId,
                challengeId,
                reason: reason || "Annulé par admin",
              });
              Alert.alert("Succès", "Pact annulé et participants remboursés");
            } catch (err: any) {
              Alert.alert("Erreur", err.message);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(["overview", "disputes", "users", "challenges"] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === "overview" && "Vue d'ensemble"}
            {tab === "disputes" && `Disputes${pendingDisputes?.length ? ` (${pendingDisputes.length})` : ""}`}
            {tab === "users" && "Utilisateurs"}
            {tab === "challenges" && "Challenges"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Text style={styles.sectionTitle}>Statistiques</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.verifiedUsers || 0}</Text>
          <Text style={styles.statLabel}>KYC vérifié</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.activeChallenges || 0}</Text>
          <Text style={styles.statLabel}>Pacts actifs</Text>
        </View>
        <View style={[styles.statCard, stats?.pendingDisputes ? styles.statCardWarning : null]}>
          <Text style={[styles.statValue, stats?.pendingDisputes ? styles.statValueWarning : null]}>
            {stats?.pendingDisputes || 0}
          </Text>
          <Text style={styles.statLabel}>Disputes en attente</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(stats?.totalDeposits || 0).toFixed(0)}€</Text>
          <Text style={styles.statLabel}>Dépôts totaux</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(stats?.totalWithdrawals || 0).toFixed(0)}€</Text>
          <Text style={styles.statLabel}>Retraits totaux</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(stats?.totalBalance || 0).toFixed(0)}€</Text>
          <Text style={styles.statLabel}>Soldes cumulés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.validatingChallenges || 0}</Text>
          <Text style={styles.statLabel}>En validation</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderDisputes = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Text style={styles.sectionTitle}>Disputes en attente</Text>

      {!pendingDisputes?.length ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
          <Text style={styles.emptyStateText}>Aucune dispute en attente</Text>
        </View>
      ) : (
        pendingDisputes.map((dispute: any) => (
          <TouchableOpacity
            key={dispute._id}
            style={styles.disputeCard}
            onPress={() => setSelectedDispute(dispute)}
          >
            <View style={styles.disputeHeader}>
              <View style={styles.disputeBadge}>
                <Ionicons name="warning" size={14} color={Colors.warning} />
                <Text style={styles.disputeBadgeText}>En attente</Text>
              </View>
              <Text style={styles.disputeDate}>
                {new Date(dispute.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <Text style={styles.disputeTitle}>{dispute.challenge?.title || "Challenge"}</Text>
            <Text style={styles.disputeReason} numberOfLines={2}>{dispute.reason}</Text>
            <View style={styles.disputeParties}>
              <Text style={styles.disputeParty}>
                <Text style={styles.disputePartyLabel}>Contestataire: </Text>
                {dispute.disputer?.name || "?"}
              </Text>
              <Text style={styles.disputeParty}>
                <Text style={styles.disputePartyLabel}>vs </Text>
                {dispute.target?.name || "?"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </Animated.View>
  );

  const renderUsers = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Text style={styles.sectionTitle}>Utilisateurs ({allUsers?.length || 0})</Text>

      {allUsers?.map((user: any) => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.userStats}>
              <Text style={styles.userStat}>{user.balance?.toFixed(2) || 0}€</Text>
              <Text style={styles.userStatSep}>•</Text>
              <Text style={styles.userStat}>{user.totalWins} wins</Text>
              {user.kycVerified && (
                <>
                  <Text style={styles.userStatSep}>•</Text>
                  <Text style={[styles.userStat, styles.userStatVerified]}>KYC ✓</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.userAction, user.isBlocked && styles.userActionBlocked]}
            onPress={() => handleBlockUser(user.id, user.isBlocked)}
          >
            <Ionicons
              name={user.isBlocked ? "lock-open" : "ban"}
              size={18}
              color={user.isBlocked ? Colors.success : Colors.error}
            />
          </TouchableOpacity>
        </View>
      ))}
    </Animated.View>
  );

  const renderChallenges = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Text style={styles.sectionTitle}>Challenges récents ({allChallenges?.length || 0})</Text>

      {allChallenges?.map((challenge: any) => (
        <View key={challenge._id} style={styles.challengeCard}>
          <View style={styles.challengeInfo}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle} numberOfLines={1}>{challenge.title}</Text>
              <View style={[
                styles.challengeStatus,
                challenge.status === "active" && styles.challengeStatusActive,
                challenge.status === "completed" && styles.challengeStatusCompleted,
                challenge.status === "validating" && styles.challengeStatusValidating,
              ]}>
                <Text style={styles.challengeStatusText}>{challenge.status}</Text>
              </View>
            </View>
            <Text style={styles.challengeCreator}>
              Par {challenge.creator?.name || "?"} • {challenge.participantCount} participants • {challenge.totalPot}€
            </Text>
            <Text style={styles.challengeDate}>
              Fin: {new Date(challenge.endDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          {(challenge.status === "active" || challenge.status === "pending") && (
            <TouchableOpacity
              style={styles.challengeAction}
              onPress={() => handleCancelChallenge(challenge._id, challenge.title)}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "disputes" && renderDisputes()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "challenges" && renderChallenges()}
      </ScrollView>

      {/* Dispute Resolution Modal */}
      <Modal visible={!!selectedDispute} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Résoudre la dispute</Text>
              <TouchableOpacity onPress={() => setSelectedDispute(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDispute && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Challenge</Text>
                  <Text style={styles.modalValue}>{selectedDispute.challenge?.title}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Raison de la contestation</Text>
                  <Text style={styles.modalValue}>{selectedDispute.reason}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValue}>{selectedDispute.description}</Text>
                </View>

                {selectedDispute.proof?.proofContent && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Preuve contestée</Text>
                    <Text style={styles.modalValue}>{selectedDispute.proof.proofContent}</Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Ta décision (obligatoire)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Explique ta décision..."
                    placeholderTextColor={Colors.textMuted}
                    value={resolutionComment}
                    onChangeText={setResolutionComment}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalAction, styles.modalActionFavorDisputer]}
                    onPress={() => handleResolveDispute("favor_disputer")}
                    disabled={resolving}
                  >
                    {resolving ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={Colors.white} />
                        <Text style={styles.modalActionText}>
                          Donner raison au contestataire
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalAction, styles.modalActionFavorTarget]}
                    onPress={() => handleResolveDispute("favor_target")}
                    disabled={resolving}
                  >
                    <Ionicons name="close" size={18} color={Colors.white} />
                    <Text style={styles.modalActionText}>Rejeter la contestation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalAction, styles.modalActionDismiss]}
                    onPress={() => handleResolveDispute("dismissed")}
                    disabled={resolving}
                  >
                    <Text style={styles.modalActionTextSecondary}>Classer sans suite</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  adminBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  statCardWarning: {
    backgroundColor: Colors.warningMuted,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statValueWarning: {
    color: Colors.warning,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },

  // Disputes
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  disputeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  disputeBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.warning,
  },
  disputeDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  disputeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  disputeReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  disputeParties: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  disputeParty: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  disputePartyLabel: {
    fontWeight: "500",
  },

  // Users
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userStatSep: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  userStatVerified: {
    color: Colors.success,
  },
  userAction: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  userActionBlocked: {
    backgroundColor: Colors.successMuted,
  },

  // Challenges
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  challengeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  challengeStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.surfaceHighlight,
  },
  challengeStatusActive: {
    backgroundColor: Colors.successMuted,
  },
  challengeStatusCompleted: {
    backgroundColor: Colors.infoMuted,
  },
  challengeStatusValidating: {
    backgroundColor: Colors.warningMuted,
  },
  challengeStatusText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  challengeCreator: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  challengeDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  challengeAction: {
    padding: Spacing.sm,
  },

  // No access
  noAccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  noAccessText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  modalSection: {
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  modalActionFavorDisputer: {
    backgroundColor: Colors.success,
  },
  modalActionFavorTarget: {
    backgroundColor: Colors.error,
  },
  modalActionDismiss: {
    backgroundColor: Colors.surfaceHighlight,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  modalActionTextSecondary: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
