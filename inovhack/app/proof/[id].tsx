/**
 * Proof Detail Page
 * View proof with comments, reactions, and votes
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

const EMOJIS = ["🔥", "💪", "👏", "❤️", "😮"];

export default function ProofDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const proofId = id as Id<"proofs">;

  const proof = useQuery(
    api.proofs.getProofDetail,
    proofId ? { proofId } : "skip"
  );

  const userVote = useQuery(
    api.proofs.hasUserVoted,
    proofId && userId ? { proofId, userId } : "skip"
  );

  const userReaction = useQuery(
    api.proofs.getUserReaction,
    proofId && userId ? { proofId, userId } : "skip"
  );

  const addComment = useMutation(api.proofs.addComment);
  const addReaction = useMutation(api.proofs.addReaction);
  const voteOnProof = useMutation(api.proofs.voteOnProof);

  const handleSendComment = async () => {
    if (!userId || !comment.trim()) return;

    setSending(true);
    try {
      await addComment({
        proofId,
        userId,
        content: comment.trim(),
      });
      setComment("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible d'envoyer le commentaire");
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!userId) return;

    try {
      await addReaction({
        proofId,
        userId,
        emoji,
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleVote = async (voteType: "approve" | "reject") => {
    if (!userId) return;

    try {
      await voteOnProof({
        proofId,
        voterId: userId,
        voteType,
      });
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de voter");
    }
  };

  if (!proof) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Preuve</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = proof.userId === userId;
  const canVote = !isOwner && proof.communityValidation === "pending" && !userVote;
  const showVoteSection = proof.communityValidation !== undefined;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Preuve</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: proof.userId } })}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatar}>
                {proof.user?.profileImageUrl ? (
                  <Image source={{ uri: proof.user.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {proof.user?.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{proof.user?.name || "Utilisateur"}</Text>
                <Text style={styles.challengeTitle} numberOfLines={1}>
                  {proof.challenge?.title}
                </Text>
              </View>
              <Text style={styles.proofTime}>
                {new Date(proof.submittedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Proof Content */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.proofSection}>
            {proof.proofType === "image" || proof.proofContent?.startsWith("http") ? (
              <View style={styles.proofImageContainer}>
                <Image
                  source={{ uri: proof.proofContent }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.proofTextContainer}>
                <Text style={styles.proofText}>{proof.proofContent}</Text>
              </View>
            )}
          </Animated.View>

          {/* Reactions */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.reactionsSection}>
            <View style={styles.reactionCounts}>
              {Object.entries(proof.reactionCounts || {}).map(([emoji, count]) => (
                <View key={emoji} style={styles.reactionCount}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionNumber}>{count as number}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reactionButtons}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReaction(emoji)}
                  style={[
                    styles.reactionButton,
                    userReaction === emoji && styles.reactionButtonActive,
                  ]}
                >
                  <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Validation Status */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Validation organisateur</Text>
              <View style={[
                styles.statusBadge,
                proof.organizerValidation === "approved" && styles.statusApproved,
                proof.organizerValidation === "rejected" && styles.statusRejected,
                proof.organizerValidation === "pending" && styles.statusPending,
              ]}>
                <Text style={[
                  styles.statusText,
                  proof.organizerValidation === "approved" && styles.statusTextApproved,
                  proof.organizerValidation === "rejected" && styles.statusTextRejected,
                ]}>
                  {proof.organizerValidation === "approved" && "Validée"}
                  {proof.organizerValidation === "rejected" && "Refusée"}
                  {proof.organizerValidation === "pending" && "En attente"}
                </Text>
              </View>
            </View>

            {showVoteSection && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Vote communautaire</Text>
                <View style={styles.voteProgress}>
                  <View style={styles.voteBar}>
                    <View
                      style={[
                        styles.voteBarApprove,
                        { flex: proof.approveCount || 0 },
                      ]}
                    />
                    <View
                      style={[
                        styles.voteBarReject,
                        { flex: proof.rejectCount || 0 },
                      ]}
                    />
                  </View>
                  <Text style={styles.voteCount}>
                    {proof.approveCount || 0} / {proof.requiredVotes} votes
                  </Text>
                </View>
              </View>
            )}

            {canVote && (
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  onPress={() => handleVote("reject")}
                  style={[styles.voteButton, styles.voteButtonReject]}
                >
                  <Ionicons name="close" size={20} color={Colors.danger} />
                  <Text style={styles.voteButtonRejectText}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleVote("approve")}
                  style={[styles.voteButton, styles.voteButtonApprove]}
                >
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                  <Text style={styles.voteButtonApproveText}>Valider</Text>
                </TouchableOpacity>
              </View>
            )}

            {userVote && (
              <View style={styles.votedBadge}>
                <Ionicons
                  name={userVote === "approve" ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={userVote === "approve" ? Colors.success : Colors.danger}
                />
                <Text style={styles.votedText}>
                  Tu as voté: {userVote === "approve" ? "Approuver" : "Refuser"}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Comments */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Commentaires ({proof.comments?.length || 0})
            </Text>

            {proof.comments?.length === 0 ? (
              <Text style={styles.noComments}>Aucun commentaire pour le moment</Text>
            ) : (
              <View style={styles.commentsList}>
                {proof.comments?.map((comment: any) => (
                  <View key={comment._id} style={styles.commentCard}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: "/user/[id]", params: { id: comment.userId } })}
                    >
                      <View style={styles.commentAvatar}>
                        {comment.user?.profileImageUrl ? (
                          <Image source={{ uri: comment.user.profileImageUrl }} style={styles.commentAvatarImage} />
                        ) : (
                          <Text style={styles.commentAvatarText}>
                            {comment.user?.name?.charAt(0).toUpperCase() || "?"}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{comment.user?.name || "Utilisateur"}</Text>
                        <Text style={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={!comment.trim() || sending}
            style={[
              styles.sendButton,
              (!comment.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },

  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  challengeTitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  proofTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Proof Section
  proofSection: {
    marginBottom: Spacing.lg,
  },
  proofImageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
  },
  proofImage: {
    width: "100%",
    height: 350,
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

  // Reactions
  reactionsSection: {
    marginBottom: Spacing.lg,
  },
  reactionCounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reactionCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    ...Shadows.xs,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionNumber: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  reactionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  reactionButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.xs,
  },
  reactionButtonActive: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  reactionButtonEmoji: {
    fontSize: 20,
  },

  // Status
  statusSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusPending: {
    backgroundColor: Colors.warningMuted,
  },
  statusApproved: {
    backgroundColor: Colors.successMuted,
  },
  statusRejected: {
    backgroundColor: Colors.dangerMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.warning,
  },
  statusTextApproved: {
    color: Colors.success,
  },
  statusTextRejected: {
    color: Colors.danger,
  },
  voteProgress: {
    alignItems: "flex-end",
  },
  voteBar: {
    flexDirection: "row",
    width: 100,
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  voteBarApprove: {
    backgroundColor: Colors.success,
  },
  voteBarReject: {
    backgroundColor: Colors.danger,
  },
  voteCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  voteButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  voteButtonReject: {
    backgroundColor: Colors.dangerMuted,
  },
  voteButtonRejectText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.danger,
  },
  voteButtonApprove: {
    backgroundColor: Colors.success,
  },
  voteButtonApproveText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  votedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  votedText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Comments
  commentsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  noComments: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  commentsList: {
    gap: Spacing.md,
  },
  commentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Shadows.xs,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },

  bottomSpacer: {
    height: 20,
  },
});
