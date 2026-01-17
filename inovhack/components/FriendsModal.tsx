import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: Id<"users">;
  userUsername?: string;
}

type TabType = "friends" | "requests" | "search";

export default function FriendsModal({
  visible,
  onClose,
  userId,
  userUsername,
}: FriendsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [newUsername, setNewUsername] = useState(userUsername || "");
  const [isSettingUsername, setIsSettingUsername] = useState(false);

  const friends = useQuery(api.friends.getFriends, { userId });
  const pendingRequests = useQuery(api.friends.getPendingRequests, { userId });
  const searchResults = useQuery(
    api.friends.searchUsers,
    searchQuery.length >= 2 ? { query: searchQuery, currentUserId: userId } : "skip"
  );

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.friends.rejectFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const setUsername = useMutation(api.friends.setUsername);

  useEffect(() => {
    if (userUsername) {
      setNewUsername(userUsername);
    }
  }, [userUsername]);

  const handleSendRequest = async (friendId: Id<"users">) => {
    try {
      const result = await sendFriendRequest({ userId, friendId });
      if (result.status === "accepted") {
        Alert.alert("Super!", "Vous êtes maintenant amis!");
      } else {
        Alert.alert("Envoyé!", "Demande d'ami envoyée");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleAcceptRequest = async (requestId: Id<"friendships">) => {
    try {
      await acceptFriendRequest({ requestId, userId });
      Alert.alert("Accepté!", "Vous êtes maintenant amis!");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleRejectRequest = async (requestId: Id<"friendships">) => {
    try {
      await rejectFriendRequest({ requestId, userId });
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleRemoveFriend = (friendId: Id<"users">, friendName: string) => {
    Alert.alert(
      "Supprimer l'ami",
      `Supprimer ${friendName} de tes amis?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend({ userId, friendId });
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  const handleSetUsername = async () => {
    if (!newUsername.trim()) return;
    setIsSettingUsername(true);
    try {
      await setUsername({ userId, username: newUsername.trim() });
      Alert.alert("Super!", "Ton pseudo a été mis à jour");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setIsSettingUsername(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Username setting */}
            <View style={styles.usernameSection}>
              <Text style={styles.usernameLabel}>Ton pseudo</Text>
              <View style={styles.usernameInputRow}>
                <Text style={styles.usernameAt}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  placeholder="pseudo"
                  placeholderTextColor={Colors.textTertiary}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={handleSetUsername}
                  disabled={isSettingUsername || !newUsername.trim() || newUsername === userUsername}
                  style={[
                    styles.usernameButton,
                    (!newUsername.trim() || newUsername === userUsername) && styles.usernameButtonDisabled,
                  ]}
                >
                  {isSettingUsername ? (
                    <ActivityIndicator color={Colors.black} size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color={Colors.black} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.usernameHint}>
                Les amis peuvent te trouver avec ce pseudo
              </Text>
            </View>

            {/* Friends list */}
            <Text style={styles.listTitle}>MES AMIS ({friends?.length || 0})</Text>
            {friends === undefined ? (
              <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.lg }} />
            ) : friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Pas encore d'amis</Text>
                <Text style={styles.emptyHint}>Cherche des amis avec leur pseudo!</Text>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {friends.map((friend: any) => (
                  <Animated.View
                    key={friend._id}
                    entering={FadeInDown.springify()}
                    style={styles.friendCard}
                  >
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>
                        {friend.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      {friend.username && (
                        <Text style={styles.friendUsername}>@{friend.username}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFriend(friend._id, friend.name)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={20} color={Colors.danger} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        );

      case "requests":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.listTitle}>
              DEMANDES REÇUES ({pendingRequests?.length || 0})
            </Text>
            {pendingRequests === undefined ? (
              <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.lg }} />
            ) : pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Aucune demande</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {pendingRequests.map((request: any) => (
                  <Animated.View
                    key={request._id}
                    entering={FadeInDown.springify()}
                    style={styles.requestCard}
                  >
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>
                        {request.user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{request.user.name}</Text>
                      {request.user.username && (
                        <Text style={styles.friendUsername}>@{request.user.username}</Text>
                      )}
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(request._id)}
                        style={styles.acceptButton}
                      >
                        <Ionicons name="checkmark" size={20} color={Colors.black} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(request._id)}
                        style={styles.rejectButton}
                      >
                        <Ionicons name="close" size={20} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        );

      case "search":
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={22} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par pseudo..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={22} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {searchQuery.length < 2 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>Tape au moins 2 caractères</Text>
                </View>
              ) : searchResults === undefined ? (
                <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.lg }} />
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>Aucun résultat</Text>
                </View>
              ) : (
                <View style={styles.searchResults}>
                  {searchResults.map((user: any) => (
                    <Animated.View
                      key={user._id}
                      entering={FadeInDown.springify()}
                      style={styles.searchResultCard}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{user.name}</Text>
                        {user.username && (
                          <Text style={styles.friendUsername}>@{user.username}</Text>
                        )}
                      </View>
                      {user.status === "friend" ? (
                        <View style={styles.statusBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                          <Text style={styles.statusBadgeText}>Ami</Text>
                        </View>
                      ) : user.status === "pending_sent" ? (
                        <View style={styles.statusBadgePending}>
                          <Ionicons name="time" size={16} color={Colors.textTertiary} />
                          <Text style={styles.statusBadgePendingText}>Envoyé</Text>
                        </View>
                      ) : user.status === "pending_received" ? (
                        <TouchableOpacity
                          onPress={() => {/* Will be handled by requests tab */}}
                          style={styles.statusBadgeReceived}
                        >
                          <Text style={styles.statusBadgeReceivedText}>À accepter</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendRequest(user._id)}
                          style={styles.addFriendButton}
                        >
                          <Ionicons name="person-add" size={18} color={Colors.black} />
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        );
    }
  };

  const requestCount = pendingRequests?.length || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.springify()}
          style={styles.container}
        >
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Amis</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setActiveTab("friends")}
              style={[styles.tab, activeTab === "friends" && styles.tabActive]}
            >
              <Ionicons
                name="people"
                size={20}
                color={activeTab === "friends" ? Colors.textPrimary : Colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>
                Amis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("requests")}
              style={[styles.tab, activeTab === "requests" && styles.tabActive]}
            >
              <View style={styles.tabWithBadge}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={activeTab === "requests" ? Colors.textPrimary : Colors.textTertiary}
                />
                {requestCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{requestCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabText, activeTab === "requests" && styles.tabTextActive]}>
                Demandes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("search")}
              style={[styles.tab, activeTab === "search" && styles.tabActive]}
            >
              <Ionicons
                name="search"
                size={20}
                color={activeTab === "search" ? Colors.textPrimary : Colors.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === "search" && styles.tabTextActive]}>
                Chercher
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {renderContent()}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.surfaceHighlight,
  },
  tabText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  tabWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: Colors.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  // Content
  content: {
    flex: 1,
    minHeight: 300,
  },
  // Username section
  usernameSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usernameLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  usernameInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  usernameAt: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.accent,
    marginRight: Spacing.xs,
  },
  usernameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    padding: 0,
  },
  usernameButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    opacity: 0.5,
  },
  usernameHint: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  // List
  listTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  emptyHint: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  // Friends list
  friendsList: {
    gap: Spacing.sm,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  friendInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  friendName: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  friendUsername: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  // Requests
  requestsList: {
    gap: Spacing.sm,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchResults: {
    gap: Spacing.sm,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusBadgeText: {
    ...Typography.labelSmall,
    color: Colors.success,
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusBadgePendingText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  statusBadgeReceived: {
    backgroundColor: Colors.infoMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  statusBadgeReceivedText: {
    ...Typography.labelSmall,
    color: Colors.info,
  },
  addFriendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
});
