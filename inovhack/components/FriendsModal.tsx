/**
 * Friends Modal - LUMA Inspired Design
 * Clean, elegant social interface
 */

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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { router } from "expo-router";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
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
        Alert.alert("Super!", "Vous etes maintenant amis!");
      } else {
        Alert.alert("Envoye!", "Demande d'ami envoyee");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleAcceptRequest = async (requestId: Id<"friendships">) => {
    try {
      await acceptFriendRequest({ requestId, userId });
      Alert.alert("Accepte!", "Vous etes maintenant amis!");
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

  const handleViewFriendProfile = (friendId: string) => {
    onClose();
    setTimeout(() => {
      router.push({ pathname: "/friend-profile", params: { friendId } });
    }, 300);
  };

  const handleSetUsername = async () => {
    if (!newUsername.trim()) return;
    setIsSettingUsername(true);
    try {
      await setUsername({ userId, username: newUsername.trim() });
      Alert.alert("Super!", "Ton pseudo a ete mis a jour");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setIsSettingUsername(false);
    }
  };

  const renderAvatar = (name: string, imageUrl?: string) => {
    if (imageUrl) {
      return <Image source={{ uri: imageUrl }} style={styles.avatar} />;
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Username setting */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.usernameSection}>
              <Text style={styles.sectionLabel}>Ton pseudo</Text>
              <View style={styles.usernameInputRow}>
                <View style={styles.usernameInputWrapper}>
                  <Text style={styles.usernameAt}>@</Text>
                  <TextInput
                    style={styles.usernameInput}
                    placeholder="pseudo"
                    placeholderTextColor={Colors.textMuted}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSetUsername}
                  disabled={isSettingUsername || !newUsername.trim() || newUsername === userUsername}
                  style={[
                    styles.saveButton,
                    (!newUsername.trim() || newUsername === userUsername) && styles.saveButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  {isSettingUsername ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Ionicons name="checkmark" size={18} color={Colors.white} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.usernameHint}>
                Les amis peuvent te trouver avec ce pseudo
              </Text>
            </Animated.View>

            {/* Friends list */}
            <Animated.View entering={FadeInDown.delay(150)}>
              <Text style={styles.sectionLabel}>Mes amis ({friends?.length || 0})</Text>
              {friends === undefined ? (
                <ActivityIndicator color={Colors.accent} style={styles.loader} />
              ) : friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Pas encore d'amis</Text>
                  <Text style={styles.emptySubtitle}>Cherche des amis avec leur pseudo</Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {friends.map((friend: any, index: number) => (
                    <Animated.View
                      key={friend._id}
                      entering={FadeInDown.delay(200 + index * 50)}
                    >
                      <TouchableOpacity
                        style={styles.friendCard}
                        onPress={() => handleViewFriendProfile(friend._id)}
                        activeOpacity={0.8}
                      >
                        {renderAvatar(friend.name, friend.profileImageUrl)}
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>{friend.name}</Text>
                          {friend.username && (
                            <Text style={styles.friendUsername}>@{friend.username}</Text>
                          )}
                          <View style={styles.friendStats}>
                            <Text style={styles.friendStatText}>
                              {friend.badgeCount || 0} badge{(friend.badgeCount || 0) !== 1 ? "s" : ""}
                            </Text>
                            <Text style={styles.friendStatSeparator}>·</Text>
                            <Text style={styles.friendStatText}>
                              {friend.totalWins || 0} victoire{(friend.totalWins || 0) !== 1 ? "s" : ""}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        );

      case "requests":
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Text style={styles.sectionLabel}>
                Demandes recues ({pendingRequests?.length || 0})
              </Text>
              {pendingRequests === undefined ? (
                <ActivityIndicator color={Colors.accent} style={styles.loader} />
              ) : pendingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="mail-outline" size={32} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucune demande</Text>
                  <Text style={styles.emptySubtitle}>Les demandes d'ami apparaitront ici</Text>
                </View>
              ) : (
                <View style={styles.requestsList}>
                  {pendingRequests.map((request: any, index: number) => (
                    <Animated.View
                      key={request._id}
                      entering={FadeInDown.delay(150 + index * 50)}
                      style={styles.requestCard}
                    >
                      {renderAvatar(request.user.name, request.user.profileImageUrl)}
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
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark" size={18} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRejectRequest(request._id)}
                          style={styles.rejectButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        );

      case "search":
        return (
          <View style={styles.searchTab}>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par pseudo..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {searchQuery.length < 2 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="person-add-outline" size={32} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Rechercher des amis</Text>
                  <Text style={styles.emptySubtitle}>Tape au moins 2 caracteres</Text>
                </View>
              ) : searchResults === undefined ? (
                <ActivityIndicator color={Colors.accent} style={styles.loader} />
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucun resultat</Text>
                  <Text style={styles.emptySubtitle}>Essaie un autre pseudo</Text>
                </View>
              ) : (
                <View style={styles.searchResults}>
                  {searchResults.map((user: any, index: number) => (
                    <Animated.View
                      key={user._id}
                      entering={FadeInDown.delay(150 + index * 50)}
                      style={styles.searchResultCard}
                    >
                      {renderAvatar(user.name, user.profileImageUrl)}
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{user.name}</Text>
                        {user.username && (
                          <Text style={styles.friendUsername}>@{user.username}</Text>
                        )}
                      </View>
                      {user.status === "friend" ? (
                        <View style={styles.statusBadgeFriend}>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                          <Text style={styles.statusBadgeFriendText}>Ami</Text>
                        </View>
                      ) : user.status === "pending_sent" ? (
                        <View style={styles.statusBadgePending}>
                          <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                          <Text style={styles.statusBadgePendingText}>Envoye</Text>
                        </View>
                      ) : user.status === "pending_received" ? (
                        <View style={styles.statusBadgeReceived}>
                          <Text style={styles.statusBadgeReceivedText}>A accepter</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleSendRequest(user._id)}
                          style={styles.addFriendButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="person-add-outline" size={18} color={Colors.white} />
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setActiveTab("friends")}
              style={[styles.tab, activeTab === "friends" && styles.tabActive]}
              activeOpacity={0.7}
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
              onPress={() => setActiveTab("requests")}
              style={[styles.tab, activeTab === "requests" && styles.tabActive]}
              activeOpacity={0.7}
            >
              <View style={styles.tabWithBadge}>
                <Ionicons
                  name={activeTab === "requests" ? "mail" : "mail-outline"}
                  size={18}
                  color={activeTab === "requests" ? Colors.accent : Colors.textTertiary}
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
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === "search" ? "search" : "search-outline"}
                size={18}
                color={activeTab === "search" ? Colors.accent : Colors.textTertiary}
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
  },
  backdrop: {
    height: 80,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
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
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: "600",
  },
  tabWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: Colors.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    flex: 1,
  },

  // Section Label
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },

  // Username section
  usernameSection: {
    marginBottom: Spacing.xl,
  },
  usernameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  usernameInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  usernameAt: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
    marginRight: Spacing.xs,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
    padding: 0,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  usernameHint: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Loader
  loader: {
    padding: Spacing.xl,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Friends list
  friendsList: {
    gap: Spacing.sm,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
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
  friendInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  friendUsername: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginTop: 2,
  },
  friendStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  friendStatText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textMuted,
  },
  friendStatSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dangerMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
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
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dangerMuted,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchTab: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textPrimary,
    padding: 0,
  },
  searchResults: {
    gap: Spacing.sm,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Status badges
  statusBadgeFriend: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusBadgeFriendText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.success,
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusBadgePendingText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  statusBadgeReceived: {
    backgroundColor: Colors.infoMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeReceivedText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.info,
  },
  addFriendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
});
