/**
 * Validate Proofs Screen - For organizers to validate submitted proofs
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
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
import { getErrorMessage } from "../utils/errorHandler";

export default function ValidateProofsScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const pendingProofs = useQuery(
    api.proofs.getProofsToValidateAsOrganizer,
    userId ? { organizerId: userId } : "skip"
  );

  // Get proof detail with messages when a proof is selected
  const proofDetail = useQuery(
    api.proofs.getProofDetail,
    selectedProof ? { proofId: selectedProof._id } : "skip"
  );

  const validateProof = useMutation(api.proofs.validateProofAsOrganizer);
  const sendMessage = useMutation(api.proofs.sendProofMessage);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedProof || !userId) return;

    setIsSendingMessage(true);
    try {
      await sendMessage({
        proofId: selectedProof._id,
        userId,
        message: message.trim(),
      });
      setMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleValidate = async (decision: "approved" | "rejected") => {
    if (!selectedProof || !userId) return;

    setIsSubmitting(true);
    try {
      await validateProof({
        proofId: selectedProof._id,
        organizerId: userId,
        decision,
        comment: comment.trim() || undefined,
      });
      Alert.alert(
        "Succès",
        decision === "approved" ? "Preuve validée !" : "Preuve refusée"
      );
      setSelectedProof(null);
      setComment("");
    } catch (err: any) {
      Alert.alert("Oups!", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Detail view for selected proof
  if (selectedProof) {
    const messages = proofDetail?.messages || [];

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedProof(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Vérifier la preuve</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* User Info */}
            <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.userCard}>
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
                <Text style={styles.userPact}>{selectedProof.challenge?.title}</Text>
              </View>
            </Animated.View>

            {/* Proof Content */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.proofCard}>
              <Text style={styles.proofLabel}>Preuve soumise</Text>
              {selectedProof.proofContent?.startsWith("http") ? (
                <Image source={{ uri: selectedProof.proofContent }} style={styles.proofImage} resizeMode="contain" />
              ) : (
                <Text style={styles.proofText}>{selectedProof.proofContent}</Text>
              )}
              <Text style={styles.proofDate}>
                Soumis le {new Date(selectedProof.submittedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Animated.View>

            {/* Chat Section */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.chatSection}>
              <Text style={styles.chatLabel}>Messages avec le participant</Text>
              {messages.length > 0 ? (
                <View style={styles.messagesList}>
                  {messages.map((msg: any, index: number) => {
                    const isMe = msg.userId === userId;
                    return (
                      <View
                        key={msg._id || index}
                        style={[
                          styles.messageRow,
                          isMe ? styles.messageRowRight : styles.messageRowLeft,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                          ]}
                        >
                          {!isMe && (
                            <Text style={styles.messageSender}>{msg.user?.name || "Participant"}</Text>
                          )}
                          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                            {msg.message}
                          </Text>
                          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                            {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noMessages}>
                  <Ionicons name="chatbubbles-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.noMessagesText}>Aucun message</Text>
                </View>
              )}
            </Animated.View>

            {/* Comment Input for validation */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.commentSection}>
              <Text style={styles.commentLabel}>Commentaire de validation (optionnel)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajouter un commentaire pour la validation..."
                placeholderTextColor={Colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={2}
              />
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleValidate("rejected")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="close" size={22} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Refuser</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleValidate("approved")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={22} color={Colors.white} />
                    <Text style={styles.actionButtonText}>Valider</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Envoyer un message..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // List view
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Preuves à vérifier</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {!pendingProofs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : pendingProofs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune preuve en attente</Text>
            <Text style={styles.emptyText}>Les preuves soumises apparaîtront ici</Text>
          </View>
        ) : (
          <View style={styles.proofsList}>
            {pendingProofs.map((proof: any, index: number) => (
              <Animated.View
                key={proof._id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <TouchableOpacity
                  style={styles.proofItem}
                  onPress={() => setSelectedProof(proof)}
                  activeOpacity={0.8}
                >
                  <View style={styles.proofItemAvatar}>
                    {proof.user?.profileImageUrl ? (
                      <Image source={{ uri: proof.user.profileImageUrl }} style={styles.smallAvatar} />
                    ) : (
                      <Text style={styles.smallAvatarText}>
                        {proof.user?.name?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    )}
                  </View>
                  <View style={styles.proofItemContent}>
                    <Text style={styles.proofItemName}>{proof.user?.name || "Utilisateur"}</Text>
                    <Text style={styles.proofItemChallenge} numberOfLines={1}>
                      {proof.challenge?.title}
                    </Text>
                    <Text style={styles.proofItemDate}>
                      {new Date(proof.submittedAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <View style={styles.proofItemBadge}>
                    <Ionicons name="time" size={16} color={Colors.warning} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
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
    paddingBottom: Spacing.xxl,
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

  // Loading & Empty
  loadingContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: Spacing.xxl * 2,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Proofs List
  proofsList: {
    gap: Spacing.sm,
  },
  proofItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  proofItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  smallAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  smallAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  proofItemContent: {
    flex: 1,
  },
  proofItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  proofItemChallenge: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  proofItemDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  proofItemBadge: {
    width: 32,
    height: 32,
    backgroundColor: Colors.warningMuted,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  // Detail View
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.accent,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  userPact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Proof Card
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  proofLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  proofImage: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    marginBottom: Spacing.sm,
  },
  proofText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  proofDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Comment
  commentSection: {
    marginBottom: Spacing.lg,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
    ...Shadows.xs,
  },

  // Actions
  actionsRow: {
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
    gap: Spacing.sm,
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Keyboard View
  keyboardView: {
    flex: 1,
  },

  // Chat Section
  chatSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  chatLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  messagesList: {
    gap: Spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  messageBubbleOther: {
    backgroundColor: Colors.surfaceHighlight,
    borderBottomLeftRadius: 4,
  },
  messageBubbleMe: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: "right",
  },
  messageTimeMe: {
    color: "rgba(255,255,255,0.7)",
  },
  noMessages: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  noMessagesText: {
    fontSize: 14,
    color: Colors.textMuted,
  },

  // Message Input
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: Spacing.lg,
  },
});
