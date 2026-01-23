/**
 * Proof Chat Screen - Messaging about a specific proof (user <-> organizer)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import { Id } from "../convex/_generated/dataModel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProofChatScreen() {
  const { userId } = useAuth();
  const { proofId } = useLocalSearchParams<{ proofId: string }>();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showProofDetail, setShowProofDetail] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get proof detail with messages
  const proofDetail = useQuery(
    api.proofs.getProofDetail,
    proofId ? { proofId: proofId as Id<"proofs"> } : "skip"
  );

  // Send message mutation
  const sendProofMessage = useMutation(api.proofs.sendProofMessage);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [proofDetail?.messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !proofId || sending) return;

    setSending(true);
    try {
      await sendProofMessage({
        proofId: proofId as Id<"proofs">,
        userId: userId as Id<"users">,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { date: string; messages: any[] }[] = [];
    let currentDate = "";

    for (const msg of messages) {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }

    return groups;
  };

  const isOrganizer = proofDetail?.challenge?.creatorId === userId;
  const partnerUser = isOrganizer ? proofDetail?.user : proofDetail?.challenge?.creator;

  if (!proofDetail) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Chargement...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const messageGroups = groupMessagesByDate(proofDetail.messages || []);

  // Extract proof image URL
  const proofImageUrl = proofDetail.proofContent?.startsWith("http")
    ? proofDetail.proofContent
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={() => setShowProofDetail(!showProofDetail)}>
          <View style={styles.headerAvatar}>
            {partnerUser?.profileImageUrl ? (
              <Image
                source={{ uri: partnerUser.profileImageUrl }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <Text style={styles.headerAvatarText}>
                {partnerUser?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{partnerUser?.name || "Utilisateur"}</Text>
            <Text style={styles.headerChallenge} numberOfLines={1}>
              {proofDetail.challenge?.title}
            </Text>
          </View>
          <Ionicons
            name={showProofDetail ? "chevron-up" : "chevron-down"}
            size={20}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.proofButton}
          onPress={() => router.push({ pathname: "/proof-detail", params: { proofId } })}
        >
          <Ionicons name="image-outline" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Proof Preview (collapsible) */}
      {showProofDetail && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.proofPreview}>
          {proofImageUrl ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/proof-detail", params: { proofId } })}
            >
              <Image source={{ uri: proofImageUrl }} style={styles.proofPreviewImage} />
            </TouchableOpacity>
          ) : (
            <View style={styles.proofPreviewText}>
              <Ionicons name="document-text-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.proofPreviewContent} numberOfLines={2}>
                {proofDetail.proofContent}
              </Text>
            </View>
          )}
          <View style={styles.proofPreviewStatus}>
            <View
              style={[
                styles.statusBadge,
                proofDetail.organizerValidation === "approved" && styles.statusApproved,
                proofDetail.organizerValidation === "rejected" && styles.statusRejected,
                proofDetail.organizerValidation === "pending" && styles.statusPending,
              ]}
            >
              <Text style={styles.statusText}>
                {proofDetail.organizerValidation === "approved"
                  ? "Validée"
                  : proofDetail.organizerValidation === "rejected"
                    ? "Refusée"
                    : "En attente"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailButton}
              onPress={() => router.push({ pathname: "/proof-detail", params: { proofId } })}
            >
              <Text style={styles.viewDetailText}>Voir les détails</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messageGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Pas encore de messages</Text>
              <Text style={styles.emptyText}>
                {isOrganizer
                  ? "Envoyez un message au participant"
                  : "Envoyez un message à l'organisateur"}
              </Text>
            </View>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <View key={group.date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{group.date}</Text>
                </View>
                {group.messages.map((msg, msgIndex) => {
                  const isFromMe = msg.userId === userId;
                  return (
                    <Animated.View
                      key={msg._id}
                      entering={FadeInUp.delay(msgIndex * 30).duration(200)}
                      style={[
                        styles.messageBubble,
                        isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isFromMe ? styles.messageTextSent : styles.messageTextReceived,
                        ]}
                      >
                        {msg.message}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isFromMe ? styles.messageTimeSent : styles.messageTimeReceived,
                        ]}
                      >
                        {formatTime(msg.createdAt)}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Écrivez un message..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerChallenge: {
    fontSize: 12,
    color: Colors.accent,
  },
  proofButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Proof Preview
  proofPreview: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  proofPreviewImage: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  proofPreviewText: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  proofPreviewContent: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  proofPreviewStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
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
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: "500",
  },

  // Keyboard
  keyboardView: {
    flex: 1,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
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

  // Date header
  dateHeader: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },

  // Message bubbles
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  messageBubbleSent: {
    alignSelf: "flex-end",
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.sm,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextSent: {
    color: Colors.white,
  },
  messageTextReceived: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeSent: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  messageTimeReceived: {
    color: Colors.textTertiary,
    textAlign: "left",
  },

  // Input
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
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
});
