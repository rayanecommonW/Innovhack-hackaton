/**
 * Disputes Screen - Mes litiges
 * Vue des contestations créées et reçues
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
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

type TabType = "created" | "received";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "En attente", color: Colors.warning, icon: "time-outline" },
  under_review: { label: "En cours d'examen", color: Colors.info, icon: "search-outline" },
  resolved_favor_disputer: { label: "Acceptée", color: Colors.success, icon: "checkmark-circle-outline" },
  resolved_favor_target: { label: "Rejetée", color: Colors.danger, icon: "close-circle-outline" },
  dismissed: { label: "Classée", color: Colors.textMuted, icon: "remove-circle-outline" },
};

const REASON_LABELS: Record<string, string> = {
  fake_proof: "Preuve falsifiée",
  wrong_date: "Mauvaise date",
  not_matching: "Ne correspond pas",
  cheating: "Triche",
  other: "Autre",
};

export default function DisputesScreen() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("created");
  const [refreshing, setRefreshing] = useState(false);

  const myDisputes = useQuery(
    api.disputes.getMyDisputes,
    userId ? { userId } : "skip"
  );

  const disputesAgainstMe = useQuery(
    api.disputes.getDisputesAgainstMe,
    userId ? { userId } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const disputes = activeTab === "created" ? myDisputes : disputesAgainstMe;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Connecte-toi pour voir tes litiges</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes litiges</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "created" && styles.tabActive]}
          onPress={() => setActiveTab("created")}
        >
          <Text style={[styles.tabText, activeTab === "created" && styles.tabTextActive]}>
            Créés ({myDisputes?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.tabActive]}
          onPress={() => setActiveTab("received")}
        >
          <Text style={[styles.tabText, activeTab === "received" && styles.tabTextActive]}>
            Reçus ({disputesAgainstMe?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {disputes === undefined ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : disputes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {activeTab === "created" ? "Aucune contestation créée" : "Aucune contestation reçue"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "created"
                ? "Tu n'as contesté aucune preuve"
                : "Personne n'a contesté tes preuves"}
            </Text>
          </View>
        ) : (
          disputes.map((dispute: any, index: number) => {
            const status = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.pending;
            return (
              <Animated.View
                key={dispute._id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <TouchableOpacity
                  style={styles.disputeCard}
                  onPress={() => router.push({
                    pathname: "/dispute-detail",
                    params: { disputeId: dispute._id }
                  })}
                  activeOpacity={0.8}
                >
                  <View style={styles.disputeHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
                      <Ionicons name={status.icon as any} size={14} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                    <Text style={styles.disputeDate}>{formatDate(dispute.createdAt)}</Text>
                  </View>

                  <Text style={styles.challengeTitle} numberOfLines={1}>
                    {dispute.challenge?.title || "Pact"}
                  </Text>

                  <View style={styles.disputeInfo}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>
                        {activeTab === "created" ? "Contre:" : "Par:"}
                      </Text>
                      <Text style={styles.infoValue}>
                        {activeTab === "created"
                          ? dispute.target?.name || "Utilisateur"
                          : dispute.disputer?.name || "Utilisateur"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Raison:</Text>
                      <Text style={styles.infoValue}>
                        {REASON_LABELS[dispute.reason] || dispute.reason}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.disputeDescription} numberOfLines={2}>
                    {dispute.description}
                  </Text>

                  {dispute.resolution && (
                    <View style={styles.resolutionBox}>
                      <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
                      <Text style={styles.resolutionText} numberOfLines={2}>
                        {dispute.resolution}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.viewMore}>Voir les détails</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    width: 40,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },

  // Dispute Card
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  disputeDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  disputeInfo: {
    gap: 4,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  disputeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  resolutionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.infoMuted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  resolutionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewMore: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.accent,
  },

  bottomSpacer: {
    height: 40,
  },
});
