/**
 * Chat Screen - Messages between pact participants
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../constants/theme";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const challenge = useQuery(
    api.challenges.getChallenge,
    id ? { challengeId: id as Id<"challenges"> } : "skip"
  );

  const messages = useQuery(
    api.chat.getMessages,
    id ? { challengeId: id as Id<"challenges">, limit: 100 } : "skip"
  );

  const sendMessage = useMutation(api.chat.sendMessage);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !id || isSending) return;

    const messageText = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        challengeId: id as Id<"challenges">,
        userId,
        content: messageText,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number) => {
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
        month: "short",
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages?.reduce((groups: any, msg: any) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
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
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => router.push(`/challenge/${id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {messages?.length || 0} messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/challenge/${id}`)}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {!messages || messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptySubtitle}>
                Sois le premier à écrire dans ce pact !
              </Text>
            </View>
          ) : (
            Object.entries(groupedMessages || {}).map(([dateKey, msgs]: [string, any]) => (
              <View key={dateKey}>
                {/* Date Separator */}
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{formatDate(msgs[0].createdAt)}</Text>
                  <View style={styles.dateLine} />
                </View>

                {/* Messages for this date */}
                {msgs.map((msg: any, index: number) => {
                  const isOwn = msg.userId === userId;
                  const isSystem = msg.type === "system";

                  if (isSystem) {
                    return (
                      <Animated.View
                        key={msg._id}
                        entering={FadeInUp.delay(index * 20).duration(200)}
                        style={styles.systemMessage}
                      >
                        <Text style={styles.systemMessageText}>{msg.content}</Text>
                      </Animated.View>
                    );
                  }

                  return (
                    <Animated.View
                      key={msg._id}
                      entering={FadeInUp.delay(index * 20).duration(200)}
                      style={[
                        styles.messageWrapper,
                        isOwn ? styles.messageWrapperOwn : styles.messageWrapperOther,
                      ]}
                    >
                      {!isOwn && (
                        <TouchableOpacity
                          onPress={() => router.push(`/user/${msg.userId}`)}
                          style={styles.avatarContainer}
                        >
                          {msg.user?.profileImageUrl ? (
                            <Image
                              source={{ uri: msg.user.profileImageUrl }}
                              style={styles.avatar}
                            />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarText}>
                                {(msg.user?.name || "A")[0].toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                      <View style={[
                        styles.messageBubble,
                        isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                      ]}>
                        {!isOwn && (
                          <Text style={styles.senderName}>{msg.user?.name || "Anonyme"}</Text>
                        )}
                        <Text style={[
                          styles.messageText,
                          isOwn && styles.messageTextOwn,
                        ]}>
                          {msg.content}
                        </Text>
                        <Text style={[
                          styles.messageTime,
                          isOwn && styles.messageTimeOwn,
                        ]}>
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>
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
              style={styles.textInput}
              placeholder="Écrire un message..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              style={[
                styles.sendButton,
                (!message.trim() || isSending) && styles.sendButtonDisabled,
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  headerInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
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
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Date Separator
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
    fontWeight: "500",
  },

  // System Message
  systemMessage: {
    alignSelf: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginVertical: Spacing.sm,
  },
  systemMessageText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },

  // Message Wrapper
  messageWrapper: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    maxWidth: "85%",
  },
  messageWrapperOwn: {
    alignSelf: "flex-end",
  },
  messageWrapperOther: {
    alignSelf: "flex-start",
  },

  // Avatar
  avatarContainer: {
    marginRight: Spacing.sm,
    alignSelf: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },

  // Message Bubble
  messageBubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxWidth: "100%",
  },
  messageBubbleOwn: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.xs,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageTimeOwn: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  // Input
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
