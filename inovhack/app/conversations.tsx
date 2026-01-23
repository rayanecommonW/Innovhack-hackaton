/**
 * Conversations Screen - All messages (friends + proof conversations)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
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

type TabType = "friends" | "proofs";

export default function ConversationsScreen() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [refreshing, setRefreshing] = useState(false);

  // Get friend conversations
  const friendConversations = useQuery(
    api.directMessages.getConversations,
    userId ? { userId } : "skip"
  );

  // Get proof conversations (for organizers)
  const proofConversations = useQuery(
    api.directMessages.getProofConversations,
    userId ? { organizerId: userId } : "skip"
  );

  // Get friends list
  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId } : "skip"
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "maintenant";
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}j`;
  };

  const handleOpenConversation = (partnerId: string) => {
    router.push({ pathname: "/chat", params: { partnerId } });
  };

  const handleOpenProofChat = (proofId: string) => {
    router.push({ pathname: "/proof-chat", params: { proofId } });
  };

  const handleStartNewChat = (friendId: string) => {
    router.push({ pathname: "/chat", params: { partnerId: friendId } });
  };

  const renderFriendsTab = () => {
    // Merge friends with their conversation status
    const friendsWithConversations = (friends || []).map((friend: any) => {
      const conversation = (friendConversations || []).find(
        (c: any) => c.partnerId === friend._id
      );
      return {
        ...friend,
        hasConversation: !!conversation,
        lastMessage: conversation?.lastMessage,
        lastMessageAt: conversation?.lastMessageAt,
        unreadCount: conversation?.unreadCount || 0,
      };
    });

    // Sort: conversations first, then by last message time
    const sortedFriends = friendsWithConversations.sort((a: any, b: any) => {
      if (a.hasConversation && !b.hasConversation) return -1;
      if (!a.hasConversation && b.hasConversation) return 1;
      if (a.lastMessageAt && b.lastMessageAt) {
        return b.lastMessageAt - a.lastMessageAt;
      }
      return 0;
    });

    if (!friends) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      );
    }

    if (sortedFriends.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Pas encore d'amis</Text>
          <Text style={styles.emptyText}>
            Ajoute des amis pour commencer à discuter
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.conversationsList}>
        {sortedFriends.map((friend: any, index: number) => (
          <Animated.View key={friend._id} entering={FadeInDown.delay(index * 50).duration(300)}>
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => handleStartNewChat(friend._id)}
              activeOpacity={0.8}
            >
              <View style={styles.conversationAvatar}>
                {friend.profileImageUrl ? (
                  <Image source={{ uri: friend.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {friend.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
                {friend.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {friend.unreadCount > 9 ? "9+" : friend.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{friend.name}</Text>
                  {friend.lastMessageAt && (
                    <Text style={styles.conversationTime}>
                      {formatTimeAgo(friend.lastMessageAt)}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.conversationPreview,
                    friend.unreadCount > 0 && styles.conversationPreviewUnread,
                  ]}
                  numberOfLines={1}
                >
                  {friend.lastMessage || "Envoie un message..."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  const renderProofsTab = () => {
    if (!proofConversations) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      );
    }

    if (proofConversations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucune preuve</Text>
          <Text style={styles.emptyText}>
            Les conversations avec les participants apparaîtront ici
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.conversationsList}>
        {proofConversations.map((conv: any, index: number) => (
          <Animated.View key={conv.proofId} entering={FadeInDown.delay(index * 50).duration(300)}>
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => handleOpenProofChat(conv.proofId)}
              activeOpacity={0.8}
            >
              <View style={styles.conversationAvatar}>
                {conv.user?.profileImageUrl ? (
                  <Image source={{ uri: conv.user.profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {conv.user?.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{conv.user?.name || "Participant"}</Text>
                  <Text style={styles.conversationTime}>
                    {formatTimeAgo(conv.lastMessageAt)}
                  </Text>
                </View>
                <Text style={styles.conversationChallenge} numberOfLines={1}>
                  {conv.challenge?.title}
                </Text>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>
              <View style={styles.proofBadge}>
                <Ionicons name="image" size={16} color={Colors.info} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.tabActive]}
          onPress={() => setActiveTab("friends")}
        >
          <Ionicons
            name={activeTab === "friends" ? "people" : "people-outline"}
            size={18}
            color={activeTab === "friends" ? Colors.accent : Colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>
            Amis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "proofs" && styles.tabActive]}
          onPress={() => setActiveTab("proofs")}
        >
          <Ionicons
            name={activeTab === "proofs" ? "document-text" : "document-text-outline"}
            size={18}
            color={activeTab === "proofs" ? Colors.accent : Colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "proofs" && styles.tabTextActive]}>
            Preuves
          </Text>
          {(proofConversations?.length ?? 0) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{proofConversations?.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {activeTab === "friends" ? renderFriendsTab() : renderProofsTab()}
      </ScrollView>
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

  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Shadows.xs,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: "600",
  },
  tabBadge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
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

  // Conversations List
  conversationsList: {
    gap: Spacing.sm,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  conversationAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.accent,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  conversationChallenge: {
    fontSize: 12,
    color: Colors.accent,
    marginBottom: 2,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  conversationPreviewUnread: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  proofBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.infoMuted,
    justifyContent: "center",
    alignItems: "center",
  },
});
