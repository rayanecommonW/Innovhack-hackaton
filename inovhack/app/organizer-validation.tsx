/**
 * Organizer Validation Page
 * For challenge creators to validate submitted proofs
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
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Id } from "../convex/_generated/dataModel";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function OrganizerValidationScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [validating, setValidating] = useState(false);

  const proofsToValidate = useQuery(
    api.proofs.getProofsToValidateAsOrganizer,
    userId ? { organizerId: userId } : "skip"
  );

  const validateProof = useMutation(api.proofs.validateProofAsOrganizer);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleValidate = async (proofId: Id<"proofs">, decision: "approved" | "rejected") => {
    if (!userId) return;

    setValidating(true);
    try {
      await validateProof({
        proofId,
        organizerId: userId,
        decision,
        comment: comment.trim() || undefined,
      });

      setSelectedProof(null);
      setComment("");

      Alert.alert(
        decision === "approved" ? "Preuve validée" : "Preuve rejetée",
        decision === "approved"
          ? "La preuve a été acceptée."
          : "La preuve a été refusée."
      );
    } catch (error) {
      Alert.alert("Erreur", "Impossible de valider la preuve");
    } finally {
      setValidating(false);
    }
  };

  const openProofDetail = (proof: any) => {
    setSelectedProof(proof);
    setComment("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Validation</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {selectedProof ? (
        // Proof Detail View
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Challenge Info */}
            <View style={styles.challengeCard}>
              <Text style={styles.challengeTitle}>{selectedProof.challenge?.title}</Text>
              <Text style={styles.challengeDescription}>{selectedProof.challenge?.description}</Text>
              <View style={styles.challengeMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textTertiary} />
                  <Text style={styles.metaText}>
                    Preuve requise: {selectedProof.challenge?.proofDescription}
                  </Text>
                </View>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                {selectedProof.user?.profileImageUrl ? (
                  <Image source={{ uri: selectedProof.user.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {selectedProof.user?.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{selectedProof.user?.name || "Utilisateur"}</Text>
                <Text style={styles.userMeta}>
                  Mise: {selectedProof.participation?.betAmount}€
                </Text>
              </View>
              <View style={styles.submittedAt}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.submittedAtText}>
                  {new Date(selectedProof.submittedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            {/* Proof Content */}
            <View style={styles.proofSection}>
              <Text style={styles.sectionTitle}>Preuve soumise</Text>
              {selectedProof.proofType === "image" || selectedProof.proofContent?.startsWith("http") ? (
                <TouchableOpacity
                  style={styles.proofImageContainer}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: selectedProof.proofContent }}
                    style={styles.proofImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.proofTextContainer}>
                  <Text style={styles.proofText}>{selectedProof.proofContent}</Text>
                </View>
              )}
              {selectedProof.proofValue && (
                <View style={styles.proofValue}>
                  <Ionicons name="analytics-outline" size={16} color={Colors.accent} />
                  <Text style={styles.proofValueText}>
                    Valeur: {selectedProof.proofValue}
                  </Text>
                </View>
              )}
            </View>

            {/* Validation Criteria */}
            <View style={styles.criteriaSection}>
              <Text style={styles.sectionTitle}>Critères de validation</Text>
              <View style={styles.criteriaCard}>
                <Ionicons name="clipboard-outline" size={20} color={Colors.info} />
                <Text style={styles.criteriaText}>
                  {selectedProof.challenge?.proofValidationCriteria}
                </Text>
              </View>
            </View>

            {/* Comment */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={500}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleValidate(selectedProof._id, "rejected")}
                style={[styles.actionButton, styles.rejectButton]}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <>
                    <Ionicons name="close" size={20} color={Colors.danger} />
                    <Text style={styles.rejectButtonText}>Refuser</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleValidate(selectedProof._id, "approved")}
                style={[styles.actionButton, styles.approveButton]}
                disabled={validating}
              >
                {validating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text style={styles.approveButtonText}>Valider</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setSelectedProof(null)}
              style={styles.backToListButton}
            >
              <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.backToListText}>Retour à la liste</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        // Proofs List View
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
          }
        >
          {!proofsToValidate ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : proofsToValidate.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucune preuve en attente</Text>
              <Text style={styles.emptyDescription}>
                Les preuves des pacts que vous organisez apparaîtront ici
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.proofsList}>
              <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {proofsToValidate.length} preuve{proofsToValidate.length > 1 ? "s" : ""} en attente
                </Text>
              </Animated.View>

              {proofsToValidate.map((proof: any, index: number) => (
                <Animated.View
                  key={proof._id}
                  entering={FadeInDown.delay(100 + index * 30).duration(300)}
                >
                  <TouchableOpacity
                    style={styles.proofCard}
                    onPress={() => openProofDetail(proof)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.proofCardHeader}>
                      <View style={styles.proofCardUser}>
                        <View style={styles.proofCardAvatar}>
                          {proof.user?.profileImageUrl ? (
                            <Image source={{ uri: proof.user.profileImageUrl }} style={styles.proofCardAvatarImage} />
                          ) : (
                            <Text style={styles.proofCardAvatarText}>
                              {proof.user?.name?.charAt(0).toUpperCase() || "?"}
                            </Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.proofCardUserName}>{proof.user?.name || "Utilisateur"}</Text>
                          <Text style={styles.proofCardChallenge} numberOfLines={1}>
                            {proof.challenge?.title}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.proofCardBet}>
                        <Text style={styles.proofCardBetAmount}>{proof.participation?.betAmount}€</Text>
                      </View>
                    </View>

                    {(proof.proofType === "image" || proof.proofContent?.startsWith("http")) && (
                      <Image
                        source={{ uri: proof.proofContent }}
                        style={styles.proofCardImage}
                        resizeMode="cover"
                      />
                    )}

                    <View style={styles.proofCardFooter}>
                      <View style={styles.proofCardTime}>
                        <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.proofCardTimeText}>
                          {new Date(proof.submittedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                      </View>
                      <View style={styles.proofCardAction}>
                        <Text style={styles.proofCardActionText}>Valider</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

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
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Empty State
  emptyContainer: {
    paddingTop: Spacing.xxl * 2,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    maxWidth: "80%",
  },

  // List
  listHeader: {
    marginBottom: Spacing.md,
  },
  listHeaderText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  proofsList: {
    marginTop: Spacing.md,
  },
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadows.sm,
  },
  proofCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  proofCardUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  proofCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  proofCardAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  proofCardAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  proofCardUserName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  proofCardChallenge: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  proofCardBet: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  proofCardBetAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.accent,
  },
  proofCardImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.surfaceHighlight,
  },
  proofCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  proofCardTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  proofCardTimeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  proofCardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  proofCardActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Detail View
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  challengeMeta: {
    gap: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textTertiary,
    flex: 1,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  userMeta: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  submittedAt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  submittedAtText: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Proof Section
  proofSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  proofImageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
  },
  proofImage: {
    width: "100%",
    height: 300,
    backgroundColor: Colors.surfaceHighlight,
  },
  proofTextContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  proofText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  proofValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  proofValueText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Criteria
  criteriaSection: {
    marginBottom: Spacing.lg,
  },
  criteriaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  criteriaText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },

  // Comment
  commentSection: {
    marginBottom: Spacing.lg,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rejectButton: {
    backgroundColor: Colors.dangerMuted,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.danger,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  backToListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  backToListText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  bottomSpacer: {
    height: 40,
  },
});
