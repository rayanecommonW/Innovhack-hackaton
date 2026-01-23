/**
 * Dispute Detail Screen - Détail d'un litige
 * Vue détaillée d'une contestation avec toutes les informations
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useLocalSearchParams, router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import { Id } from "../convex/_generated/dataModel";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; description: string }> = {
  pending: {
    label: "En attente",
    color: Colors.warning,
    icon: "time-outline",
    description: "Cette contestation est en attente d'examen par un administrateur PACT."
  },
  under_review: {
    label: "En cours d'examen",
    color: Colors.info,
    icon: "search-outline",
    description: "Un administrateur PACT examine actuellement cette contestation."
  },
  resolved_favor_disputer: {
    label: "Acceptée",
    color: Colors.success,
    icon: "checkmark-circle-outline",
    description: "La contestation a été acceptée. La preuve a été invalidée."
  },
  resolved_favor_target: {
    label: "Rejetée",
    color: Colors.danger,
    icon: "close-circle-outline",
    description: "La contestation a été rejetée. La preuve reste valide."
  },
  dismissed: {
    label: "Classée sans suite",
    color: Colors.textMuted,
    icon: "remove-circle-outline",
    description: "Cette contestation a été classée sans suite."
  },
};

const REASON_LABELS: Record<string, { label: string; description: string }> = {
  fake_proof: { label: "Preuve falsifiée", description: "La preuve semble être truquée ou modifiée" },
  wrong_date: { label: "Mauvaise date", description: "La preuve n'a pas été faite pendant la période du pact" },
  not_matching: { label: "Ne correspond pas", description: "La preuve ne correspond pas à l'objectif demandé" },
  cheating: { label: "Triche", description: "Le participant a triché pour atteindre l'objectif" },
  other: { label: "Autre", description: "Autre raison de contestation" },
};

export default function DisputeDetailScreen() {
  const { disputeId } = useLocalSearchParams<{ disputeId: string }>();

  const dispute = useQuery(
    api.disputes.getDisputeById,
    disputeId ? { disputeId: disputeId as Id<"disputes"> } : "skip"
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!disputeId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Litige non trouvé</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = dispute ? STATUS_CONFIG[dispute.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending;
  const reason = dispute ? REASON_LABELS[dispute.reason] || { label: dispute.reason, description: "" } : { label: "", description: "" };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Détail du litige</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {dispute === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : dispute === null ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>Litige non trouvé</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.statusCard}>
            <View style={[styles.statusIconContainer, { backgroundColor: status.color + "20" }]}>
              <Ionicons name={status.icon as any} size={32} color={status.color} />
            </View>
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
            <Text style={styles.statusDescription}>{status.description}</Text>
          </Animated.View>

          {/* Challenge Info */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Pact concerné</Text>
            <View style={styles.challengeInfo}>
              <Ionicons name="trophy-outline" size={20} color={Colors.accent} />
              <Text style={styles.challengeName}>{dispute.challenge?.title || "Pact"}</Text>
            </View>
          </Animated.View>

          {/* Parties */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Parties concernées</Text>

            <View style={styles.partyRow}>
              <View style={styles.partyInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={16} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.partyLabel}>Contestataire</Text>
                  <Text style={styles.partyName}>{dispute.disputer?.name || "Utilisateur"}</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color={Colors.textMuted} />
              <View style={styles.partyInfo}>
                <View style={[styles.avatar, { backgroundColor: Colors.warning }]}>
                  <Ionicons name="person" size={16} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.partyLabel}>Contesté</Text>
                  <Text style={styles.partyName}>{dispute.target?.name || "Utilisateur"}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Reason */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Motif de la contestation</Text>
            <View style={styles.reasonBadge}>
              <Ionicons name="flag-outline" size={16} color={Colors.accent} />
              <Text style={styles.reasonLabel}>{reason.label}</Text>
            </View>
            <Text style={styles.reasonDescription}>{reason.description}</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Description détaillée</Text>
            <Text style={styles.descriptionText}>{dispute.description}</Text>
          </Animated.View>

          {/* Evidence if any */}
          {dispute.evidence && (
            <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.card}>
              <Text style={styles.cardTitle}>Preuve fournie</Text>
              <Text style={styles.evidenceText}>{dispute.evidence}</Text>
            </Animated.View>
          )}

          {/* Resolution if resolved */}
          {dispute.resolution && (
            <Animated.View entering={FadeInDown.delay(350).duration(300)} style={styles.resolutionCard}>
              <View style={styles.resolutionHeader}>
                <Ionicons name="gavel-outline" size={20} color={Colors.info} />
                <Text style={styles.resolutionTitle}>Décision de l'administrateur</Text>
              </View>
              <Text style={styles.resolutionText}>{dispute.resolution}</Text>
              {dispute.resolvedAt && (
                <Text style={styles.resolutionDate}>
                  Résolu le {formatDate(dispute.resolvedAt)}
                </Text>
              )}
            </Animated.View>
          )}

          {/* Timeline */}
          <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.card}>
            <Text style={styles.cardTitle}>Chronologie</Text>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Créée le</Text>
                  <Text style={styles.timelineDate}>{formatDate(dispute.createdAt)}</Text>
                </View>
              </View>
              {dispute.resolvedAt && (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: status.color }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Résolue le</Text>
                    <Text style={styles.timelineDate}>{formatDate(dispute.resolvedAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Help text */}
          <Animated.View entering={FadeInDown.delay(450).duration(300)} style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.textTertiary} />
            <Text style={styles.helpText}>
              Les litiges sont examinés par les administrateurs PACT de manière neutre et impartiale.
              La décision est définitive.
            </Text>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  backLink: {
    padding: Spacing.sm,
  },
  backLinkText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "500",
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Challenge
  challengeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  // Parties
  partyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  partyLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  partyName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  // Reason
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },
  reasonDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Evidence
  evidenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: "italic",
  },

  // Resolution
  resolutionCard: {
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info + "30",
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resolutionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.info,
  },
  resolutionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  resolutionDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Timeline
  timeline: {
    gap: Spacing.md,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  // Help
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
  },

  bottomSpacer: {
    height: 40,
  },
});
