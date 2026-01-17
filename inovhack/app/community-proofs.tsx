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
  Typography,
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

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Connecte-toi pour voter</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Valider les preuves</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Badge count */}
      {proofsToVote && proofsToVote.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.countBadge}>
          <Ionicons name="documents" size={20} color={Colors.accent} />
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
            <Ionicons name="checkmark-circle" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucune preuve a valider</Text>
            <Text style={styles.emptySubtitle}>
              Les preuves de tes pacts apparaitront ici
            </Text>
          </View>
        ) : (
          proofsToVote.map((proof: any, index: number) => (
            <Animated.View
              key={proof._id}
              entering={FadeInUp.delay(150 + index * 50).springify()}
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
                  <View>
                    <Text style={styles.userName}>{proof.userName}</Text>
                    <Text style={styles.challengeTitle} numberOfLines={1}>
                      {proof.challengeTitle}
                    </Text>
                  </View>
                </View>
                <View style={styles.voteCount}>
                  <View style={styles.voteItem}>
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                    <Text style={styles.voteNumber}>{proof.approveCount || 0}</Text>
                  </View>
                  <View style={styles.voteItem}>
                    <Ionicons name="close" size={14} color={Colors.danger} />
                    <Text style={styles.voteNumber}>{proof.vetoCount || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Proof Description */}
              <Text style={styles.proofDesc}>
                {proof.proofDescription || "Preuve soumise"}
              </Text>

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
                    <Ionicons name="document" size={48} color={Colors.accent} />
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
                  style={[styles.voteButton, styles.approveButton]}
                  disabled={votingProofId === proof._id}
                >
                  {votingProofId === proof._id ? (
                    <ActivityIndicator size="small" color={Colors.black} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.black} />
                      <Text style={styles.approveText}>Valider</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmVeto(proof._id)}
                  style={[styles.voteButton, styles.vetoButton]}
                  disabled={votingProofId === proof._id}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  <Text style={styles.vetoText}>Veto</Text>
                </TouchableOpacity>
              </View>

              {/* Timestamp */}
              <Text style={styles.timestamp}>
                Soumis le {new Date(proof.submittedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
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
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accentMuted,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  countText: {
    ...Typography.labelMedium,
    color: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.massive,
    gap: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textTertiary,
  },
  loginButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  loginButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  proofCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  avatarText: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  userName: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  challengeTitle: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    maxWidth: SCREEN_WIDTH - 200,
  },
  voteCount: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  voteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  voteNumber: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  proofDesc: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  proofPreview: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  proofImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  pdfPreview: {
    height: 120,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pdfText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  textPreview: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  proofText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  voteButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  approveText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  vetoButton: {
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  vetoText: {
    ...Typography.labelLarge,
    color: Colors.danger,
  },
  timestamp: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  bottomSpacer: {
    height: 100,
  },
});
