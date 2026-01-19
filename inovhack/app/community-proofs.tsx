/**
 * Community Proofs Validation Screen - LUMA Inspired Design
 * Clean, elegant interface for validating community proofs
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
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CommunityProofsScreen() {
  const { userId } = useAuth();
  const [votingProofId, setVotingProofId] = useState<string | null>(null);

  const proofsToVote = useQuery(
    api.votes.getProofsToVote,
    userId ? { userId } : "skip"
  );

  const voteOnProof = useMutation(api.votes.voteOnProof);

  const handleVote = async (proofId: string, voteType: "approve" | "veto") => {
    if (!userId) return;

    setVotingProofId(proofId);

    try {
      const result = await voteOnProof({
        proofId: proofId as any,
        voterId: userId,
        voteType,
      });

      if (result.status === "approved") {
        Alert.alert("Validee", "La preuve a ete validee par la communaute.");
      } else if (result.status === "rejected") {
        Alert.alert("Rejetee", "La preuve a ete rejetee.");
      } else {
        Alert.alert(
          "Vote enregistre",
          `Il reste ${result.votesNeeded} vote(s) pour valider.`
        );
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Erreur lors du vote");
    } finally {
      setVotingProofId(null);
    }
  };

  const confirmVeto = (proofId: string) => {
    Alert.alert(
      "Confirmer le veto",
      "Un veto rejette definitivement cette preuve. Es-tu sur ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Veto",
          style: "destructive",
          onPress: () => handleVote(proofId, "veto"),
        },
      ]
    );
  };

  const isImageUrl = (url: string) => {
    return (
      url.includes("convex.cloud") ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      url.startsWith("data:image")
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="log-in-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Connecte-toi pour voter</Text>
          <Text style={styles.emptySubtitle}>
            Tu dois etre connecte pour valider les preuves
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={styles.loginButton}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Subtitle */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.subtitleContainer}>
        <Text style={styles.subtitleText}>
          Valide les preuves de la communaute
        </Text>
      </Animated.View>

      {/* Badge count */}
      {proofsToVote && proofsToVote.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150)} style={styles.countBadge}>
          <View style={styles.countIcon}>
            <Ionicons name="documents-outline" size={16} color={Colors.accent} />
          </View>
          <Text style={styles.countText}>
            {proofsToVote.length} preuve{proofsToVote.length > 1 ? "s" : ""} a valider
          </Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {proofsToVote === undefined ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : proofsToVote.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucune preuve a valider</Text>
            <Text style={styles.emptySubtitle}>
              Les preuves de tes pacts apparaitront ici
            </Text>
          </View>
        ) : (
          proofsToVote.map((proof: any, index: number) => (
            <Animated.View
              key={proof._id}
              entering={FadeInUp.delay(200 + index * 80)}
              style={styles.proofCard}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {proof.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userTextInfo}>
                    <Text style={styles.userName}>{proof.userName}</Text>
                    <Text style={styles.challengeTitle} numberOfLines={1}>
                      {proof.challengeTitle}
                    </Text>
                  </View>
                </View>
                <View style={styles.voteStats}>
                  <View style={styles.voteStat}>
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                    <Text style={styles.voteStatNumber}>{proof.approveCount || 0}</Text>
                  </View>
                  <View style={styles.voteStat}>
                    <Ionicons name="close" size={14} color={Colors.danger} />
                    <Text style={styles.voteStatNumber}>{proof.vetoCount || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Proof Description */}
              {proof.proofDescription && (
                <Text style={styles.proofDesc}>{proof.proofDescription}</Text>
              )}

              {/* Proof Content Preview */}
              <View style={styles.proofPreview}>
                {isImageUrl(proof.proofContent) ? (
                  <Image
                    source={{ uri: proof.proofContent }}
                    style={styles.proofImage}
                    resizeMode="cover"
                  />
                ) : proof.proofContent.includes(".pdf") ? (
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document-outline" size={40} color={Colors.accent} />
                    <Text style={styles.pdfText}>Document PDF</Text>
                  </View>
                ) : (
                  <View style={styles.textPreview}>
                    <Text style={styles.proofText} numberOfLines={4}>
                      {proof.proofContent}
                    </Text>
                  </View>
                )}
              </View>

              {/* Vote Buttons */}
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  onPress={() => handleVote(proof._id, "approve")}
                  style={styles.approveButton}
                  disabled={votingProofId === proof._id}
                  activeOpacity={0.8}
                >
                  {votingProofId === proof._id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                      <Text style={styles.approveText}>Valider</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmVeto(proof._id)}
                  style={styles.vetoButton}
                  disabled={votingProofId === proof._id}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={20} color={Colors.danger} />
                  <Text style={styles.vetoText}>Rejeter</Text>
                </TouchableOpacity>
              </View>

              {/* Timestamp */}
              <View style={styles.timestampRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.timestamp}>
                  {formatDate(proof.submittedAt)}
                </Text>
              </View>
            </Animated.View>
          ))
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
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },

  // Subtitle
  subtitleContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Count Badge
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.accentMuted,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  countIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.massive,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
    maxWidth: 280,
  },

  // Login Button
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  // Proof Card
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginTop: 2,
    maxWidth: SCREEN_WIDTH - 200,
  },
  voteStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  voteStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteStatNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  proofDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },

  // Proof Preview
  proofPreview: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  proofImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  pdfPreview: {
    height: 120,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  textPreview: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
  },
  proofText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Vote Buttons
  voteButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
  },
  approveText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  vetoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  vetoText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.danger,
  },

  // Timestamp
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textMuted,
  },

  bottomSpacer: {
    height: 100,
  },
});
