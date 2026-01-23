/**
 * Proof Status Screen - View submitted proof and chat with organizer
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function ProofStatusScreen() {
  const { proofId } = useLocalSearchParams<{ proofId: string }>();
  const { userId } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const proofDetail = useQuery(
    api.proofs.getProofDetail,
    proofId ? { proofId: proofId as any } : "skip"
  );

  const sendMessage = useMutation(api.proofs.sendProofMessage);

  const handleSendMessage = async () => {
    if (!message.trim() || !proofId || !userId) return;

    setIsSending(true);
    try {
      await sendMessage({
        proofId: proofId as any,
        userId,
        message: message.trim(),
      });
      setMessage("");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (proofDetail?.messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [proofDetail?.messages?.length]);

  if (!proofDetail) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const getStatusInfo = () => {
    switch (proofDetail.status) {
      case "pending":
        return {
          icon: "time",
          color: Colors.warning,
          bgColor: Colors.warningMuted,
          label: "En attente de validation",
          description: "L'organisateur doit encore vérifier ta preuve",
        };
      case "approved":
        return {
          icon: "checkmark-circle",
          color: Colors.success,
          bgColor: Colors.successMuted,
          label: "Approuvée",
          description: "Ta preuve a été validée !",
        };
      case "rejected":
        return {
          icon: "close-circle",
          color: Colors.danger,
          bgColor: Colors.dangerMuted,
          label: "Refusée",
          description: proofDetail.reviewComment || "L'organisateur a refusé ta preuve",
        };
      default:
        return {
          icon: "help-circle",
          color: Colors.textMuted,
          bgColor: Colors.surfaceHighlight,
          label: "Statut inconnu",
          description: "",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Ma preuve</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Challenge Info */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>{proofDetail.challenge?.title}</Text>
            <Text style={styles.challengeDescription} numberOfLines={2}>
              {proofDetail.challenge?.description}
            </Text>
          </Animated.View>

          {/* Status Badge */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.statusCard, { backgroundColor: statusInfo.bgColor, borderColor: statusInfo.color }]}
          >
            <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
              <Text style={styles.statusDescription}>{statusInfo.description}</Text>
            </View>
          </Animated.View>

          {/* Proof Content */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.proofCard}>
            <Text style={styles.proofLabel}>Ta preuve</Text>
            {proofDetail.proofContent?.startsWith("http") ? (
              <Image
                source={{ uri: proofDetail.proofContent }}
                style={styles.proofImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.proofText}>{proofDetail.proofContent}</Text>
            )}
            <Text style={styles.proofDate}>
              Soumis le {new Date(proofDetail.submittedAt || proofDetail._creationTime).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Animated.View>

          {/* Organizer Info */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.organizerCard}>
            <Text style={styles.organizerLabel}>Organisateur</Text>
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatar}>
                {proofDetail.challenge?.creator?.profileImageUrl ? (
                  <Image
                    source={{ uri: proofDetail.challenge.creator.profileImageUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {proofDetail.challenge?.creator?.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <Text style={styles.organizerName}>
                {proofDetail.challenge?.creator?.name || "Organisateur"}
              </Text>
            </View>
          </Animated.View>

          {/* Chat Section */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.chatSection}>
            <Text style={styles.chatLabel}>Messages</Text>
            {proofDetail.messages && proofDetail.messages.length > 0 ? (
              <View style={styles.messagesList}>
                {proofDetail.messages.map((msg: any, index: number) => {
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
                          <Text style={styles.messageSender}>{msg.user?.name || "Organisateur"}</Text>
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
                <Ionicons name="chatbubbles-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.noMessagesText}>Aucun message</Text>
                <Text style={styles.noMessagesHint}>Envoie un message à l'organisateur</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Écrire un message..."
            placeholderTextColor={Colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Status Card
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Proof Card
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
    height: 200,
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

  // Organizer Card
  organizerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  organizerLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },

  // Chat Section
  chatSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noMessagesText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  noMessagesHint: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Input Container
  inputContainer: {
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
    maxHeight: 100,
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
});
