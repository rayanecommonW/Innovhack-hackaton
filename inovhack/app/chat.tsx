/**
 * Chat Screen - Direct messaging with a friend
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

export default function ChatScreen() {
  const { userId } = useAuth();
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get messages
  const chatData = useQuery(
    api.directMessages.getMessages,
    userId && partnerId
      ? { userId: userId as Id<"users">, partnerId: partnerId as Id<"users"> }
      : "skip"
  );

  // Send message mutation
  const sendMessage = useMutation(api.directMessages.sendMessage);

  // Mark as read mutation
  const markAsRead = useMutation(api.directMessages.markAsRead);

  // Mark messages as read when opening chat
  useEffect(() => {
    if (userId && partnerId) {
      markAsRead({
        userId: userId as Id<"users">,
        partnerId: partnerId as Id<"users">,
      });
    }
  }, [userId, partnerId, chatData?.messages?.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatData?.messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !partnerId || sending) return;

    setSending(true);
    try {
      await sendMessage({
        senderId: userId as Id<"users">,
        receiverId: partnerId as Id<"users">,
        content: message.trim(),
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

  if (!chatData) {
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

  const messageGroups = groupMessagesByDate(chatData.messages || []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerUser}>
          <View style={styles.headerAvatar}>
            {chatData.partner?.profileImageUrl ? (
              <Image
                source={{ uri: chatData.partner.profileImageUrl }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <Text style={styles.headerAvatarText}>
                {chatData.partner?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </View>
          <Text style={styles.headerName}>{chatData.partner?.name || "Utilisateur"}</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

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
              <Text style={styles.emptyTitle}>Commencez la conversation</Text>
              <Text style={styles.emptyText}>
                Envoyez un message à {chatData.partner?.name || "cet utilisateur"}
              </Text>
            </View>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <View key={group.date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{group.date}</Text>
                </View>
                {group.messages.map((msg, msgIndex) => (
                  <Animated.View
                    key={msg._id}
                    entering={FadeInUp.delay(msgIndex * 30).duration(200)}
                    style={[
                      styles.messageBubble,
                      msg.isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.isFromMe ? styles.messageTextSent : styles.messageTextReceived,
                      ]}
                    >
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        msg.isFromMe ? styles.messageTimeSent : styles.messageTimeReceived,
                      ]}
                    >
                      {formatTime(msg.createdAt)}
                    </Text>
                  </Animated.View>
                ))}
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
  headerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
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
