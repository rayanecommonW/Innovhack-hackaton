/**
 * Proof Detail Screen - View proof image, description, and status
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import { Id } from "../convex/_generated/dataModel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ProofDetailScreen() {
  const { userId } = useAuth();
  const { proofId } = useLocalSearchParams<{ proofId: string }>();
  const [showFullImage, setShowFullImage] = useState(false);
  const [validating, setValidating] = useState(false);

  // Get proof detail
  const proofDetail = useQuery(
    api.proofs.getProofDetail,
    proofId ? { proofId: proofId as Id<"proofs"> } : "skip"
  );

  // Validate proof mutation
  const validateProof = useMutation(api.proofs.validateProofAsOrganizer);

  const isOrganizer = proofDetail?.challenge?.creatorId === userId;
  const isPending = proofDetail?.organizerValidation === "pending";

  const handleValidate = async (decision: "approved" | "rejected") => {
    if (!proofId || !userId || validating) return;

    setValidating(true);
    try {
      await validateProof({
        proofId: proofId as Id<"proofs">,
        organizerId: userId as Id<"users">,
        decision,
      });
      router.back();
    } catch (error) {
      console.error("Error validating proof:", error);
    } finally {
      setValidating(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!proofDetail) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Détails de la preuve</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Extract proof image URL
  const proofImageUrl = proofDetail.proofContent?.startsWith("http")
    ? proofDetail.proofContent
    : null;

  // Extract text content if it's not just an image
  const proofTextContent = proofDetail.proofContent?.includes("[Fichier uploadé")
    ? proofDetail.proofContent.split("\n")[0]
    : !proofImageUrl
      ? proofDetail.proofContent
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Détails de la preuve</Text>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push({ pathname: "/proof-chat", params: { proofId } })}
        >
          <Ionicons name="chatbubble-outline" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Challenge Info */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.challengeCard}>
          <Text style={styles.challengeLabel}>Pact</Text>
          <Text style={styles.challengeTitle}>{proofDetail.challenge?.title}</Text>
          {proofDetail.challenge?.description && (
            <Text style={styles.challengeDescription}>{proofDetail.challenge.description}</Text>
          )}
        </Animated.View>

        {/* User Info */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.userCard}>
          <View style={styles.userAvatar}>
            {proofDetail.user?.profileImageUrl ? (
              <Image
                source={{ uri: proofDetail.user.profileImageUrl }}
                style={styles.userAvatarImage}
              />
            ) : (
              <Text style={styles.userAvatarText}>
                {proofDetail.user?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{proofDetail.user?.name || "Participant"}</Text>
            <Text style={styles.userDate}>Soumis le {formatDate(proofDetail.submittedAt)}</Text>
          </View>
        </Animated.View>

        {/* Status */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.statusCard}>
          <Text style={styles.statusLabel}>Statut</Text>
          <View
            style={[
              styles.statusBadge,
              proofDetail.organizerValidation === "approved" && styles.statusApproved,
              proofDetail.organizerValidation === "rejected" && styles.statusRejected,
              proofDetail.organizerValidation === "pending" && styles.statusPending,
            ]}
          >
            <Ionicons
              name={
                proofDetail.organizerValidation === "approved"
                  ? "checkmark-circle"
                  : proofDetail.organizerValidation === "rejected"
                    ? "close-circle"
                    : "time"
              }
              size={18}
              color={
                proofDetail.organizerValidation === "approved"
                  ? Colors.success
                  : proofDetail.organizerValidation === "rejected"
                    ? Colors.danger
                    : Colors.warning
              }
            />
            <Text
              style={[
                styles.statusText,
                proofDetail.organizerValidation === "approved" && styles.statusTextApproved,
                proofDetail.organizerValidation === "rejected" && styles.statusTextRejected,
                proofDetail.organizerValidation === "pending" && styles.statusTextPending,
              ]}
            >
              {proofDetail.organizerValidation === "approved"
                ? "Validée"
                : proofDetail.organizerValidation === "rejected"
                  ? "Refusée"
                  : "En attente de validation"}
            </Text>
          </View>
          {proofDetail.organizerComment && (
            <View style={styles.commentBox}>
              <Text style={styles.commentLabel}>Commentaire de l'organisateur :</Text>
              <Text style={styles.commentText}>{proofDetail.organizerComment}</Text>
            </View>
          )}
        </Animated.View>

        {/* Proof Content */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.proofCard}>
          <Text style={styles.proofLabel}>Preuve</Text>

          {proofImageUrl && (
            <TouchableOpacity onPress={() => setShowFullImage(true)} activeOpacity={0.9}>
              <Image source={{ uri: proofImageUrl }} style={styles.proofImage} />
              <View style={styles.expandOverlay}>
                <Ionicons name="expand-outline" size={24} color={Colors.white} />
              </View>
            </TouchableOpacity>
          )}

          {proofTextContent && (
            <View style={styles.proofTextContainer}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.proofText}>{proofTextContent}</Text>
            </View>
          )}

          {proofDetail.proofValue && (
            <View style={styles.proofValueContainer}>
              <Text style={styles.proofValueLabel}>Valeur déclarée :</Text>
              <Text style={styles.proofValue}>{proofDetail.proofValue}</Text>
            </View>
          )}
        </Animated.View>

        {/* Validation Actions (for organizer) */}
        {isOrganizer && isPending && (
          <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.actionsCard}>
            <Text style={styles.actionsLabel}>Valider cette preuve</Text>
            <View style={styles.actionsButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleValidate("rejected")}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="close" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Refuser</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleValidate("approved")}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Valider</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Full Image Modal */}
      <Modal visible={showFullImage} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          {proofImageUrl && (
            <Image
              source={{ uri: proofImageUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
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
  chatButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  challengeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  userDate: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  statusApproved: {
    backgroundColor: Colors.successMuted,
  },
  statusRejected: {
    backgroundColor: Colors.dangerMuted,
  },
  statusPending: {
    backgroundColor: Colors.warningMuted,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusTextApproved: {
    color: Colors.success,
  },
  statusTextRejected: {
    color: Colors.danger,
  },
  statusTextPending: {
    color: Colors.warning,
  },
  commentBox: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },

  // Proof Card
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  proofLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  proofImage: {
    width: "100%",
    height: SCREEN_WIDTH - Spacing.lg * 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  expandOverlay: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  proofTextContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  proofText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  proofValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  proofValueLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  proofValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  actionsButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
