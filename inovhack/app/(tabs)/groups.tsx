/**
 * Groups Screen - Clean & Minimal
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../../convex/_generated/dataModel";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  FadeIn,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { getErrorMessage } from "../../utils/errorHandler";

export default function GroupsScreen() {
  const { userId, user } = useAuth();
  const params = useLocalSearchParams<{ action?: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Id<"users">[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Handle action parameter from navigation
  useEffect(() => {
    if (params.action === "create") {
      const timer = setTimeout(() => setShowCreateModal(true), 300);
      return () => clearTimeout(timer);
    } else if (params.action === "join") {
      const timer = setTimeout(() => setShowJoinModal(true), 300);
      return () => clearTimeout(timer);
    }
  }, [params.action]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const groups = useQuery(
    api.groups.getMyGroups,
    userId ? { userId } : "skip"
  );

  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId } : "skip"
  );

  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);

  const hasGroups = groups && groups.length > 0;

  const handleCreateGroup = async () => {
    if (!userId || !groupName.trim()) return;
    setIsLoading(true);
    try {
      const result = await createGroup({
        name: groupName.trim(),
        creatorId: userId,
        memberIds: selectedFriends.length > 0 ? selectedFriends : undefined,
      });
      setShowCreateModal(false);
      setGroupName("");
      setSelectedFriends([]);

      Alert.alert(
        "Groupe créé!",
        `Code: ${result.inviteCode}`,
        [
          { text: "Partager", onPress: () => shareInviteCode(result.inviteCode) },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      Alert.alert("Oups!", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: Id<"users">) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleJoinGroup = async () => {
    if (!userId || inviteCode.length !== 6) return;
    setIsLoading(true);
    try {
      await joinGroup({ inviteCode: inviteCode.toUpperCase(), userId });
      setShowJoinModal(false);
      setInviteCode("");
      Alert.alert("Bienvenue!", "Tu as rejoint le groupe!");
    } catch (error: any) {
      Alert.alert("Oups!", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const shareInviteCode = async (code: string) => {
    try {
      await Share.share({
        message: `Rejoins mon groupe sur PACT!\n\nCode: ${code}`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  if (!userId || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptyText}>Connecte-toi pour accéder aux groupes</Text>
          <TouchableOpacity onPress={() => router.push("/auth")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.header}>
          <Text style={styles.headerTitle}>Groupes</Text>
          <Text style={styles.headerSubtitle}>Défie tes amis</Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <View style={styles.actionBtnIcon}>
              <Ionicons name="add" size={22} color={Colors.white} />
            </View>
            <Text style={styles.actionBtnText}>Créer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.8}
          >
            <View style={[styles.actionBtnIcon, styles.actionBtnIconSecondary]}>
              <Ionicons name="enter-outline" size={22} color={Colors.accent} />
            </View>
            <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Rejoindre</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Groups List */}
        {groups === undefined ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : groups.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>Crée un groupe et invite tes amis</Text>
          </Animated.View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group: any, index: number) => (
              <Animated.View
                key={group._id}
                entering={FadeInUp.delay(150 + index * 50).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/group-detail", params: { groupId: group._id } })}
                  style={styles.groupCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupCardMain}>
                    <View style={styles.groupAvatar}>
                      <Text style={styles.groupAvatarText}>
                        {group.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.groupMetaText}>{group.memberCount} membres</Text>
                        {group.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateModal(false)} />
          <Animated.View entering={SlideInDown.duration(300)} style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un groupe</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Nom du groupe</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Les Warriors"
                placeholderTextColor={Colors.textMuted}
                value={groupName}
                onChangeText={setGroupName}
              />

              {/* Friends Selection */}
              {friends && friends.length > 0 && (
                <View style={styles.friendsSection}>
                  <Text style={styles.inputLabel}>Inviter des amis</Text>
                  <View style={styles.friendsList}>
                    {friends.map((friend: any) => {
                      const isSelected = selectedFriends.includes(friend._id);
                      return (
                        <TouchableOpacity
                          key={friend._id}
                          onPress={() => toggleFriendSelection(friend._id)}
                          style={[styles.friendChip, isSelected && styles.friendChipSelected]}
                        >
                          <View style={[styles.friendChipAvatar, isSelected && styles.friendChipAvatarSelected]}>
                            {friend.profileImageUrl ? (
                              <Image source={{ uri: friend.profileImageUrl }} style={styles.friendChipImage} />
                            ) : (
                              <Text style={[styles.friendChipInitial, isSelected && styles.friendChipInitialSelected]}>
                                {friend.name.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <Text style={[styles.friendChipName, isSelected && styles.friendChipNameSelected]} numberOfLines={1}>
                            {friend.name}
                          </Text>
                          {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={isLoading || !groupName.trim()}
                style={[styles.submitBtn, (!groupName.trim() || isLoading) && styles.submitBtnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Créer le groupe</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowJoinModal(false)} />
          <Animated.View entering={SlideInDown.duration(300)} style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejoindre un groupe</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Code d'invitation</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              placeholderTextColor={Colors.textMuted}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase().slice(0, 6))}
              autoCapitalize="characters"
              maxLength={6}
            />

            <TouchableOpacity
              onPress={handleJoinGroup}
              disabled={isLoading || inviteCode.length !== 6}
              style={[styles.submitBtn, (inviteCode.length !== 6 || isLoading) && styles.submitBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Rejoindre</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingHorizontal: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Header
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnIconSecondary: {
    backgroundColor: Colors.accentMuted,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  actionBtnTextSecondary: {
    color: Colors.textPrimary,
  },

  // Loading & Empty
  loadingSection: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
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
  primaryBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  // Groups List
  groupsList: {
    gap: Spacing.sm,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  groupCardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  groupAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  groupMetaText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  adminBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.accent,
  },

  bottomSpacer: {
    height: 120,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  codeInput: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 24,
    fontWeight: "600",
    color: Colors.accent,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: Spacing.xl,
  },

  // Friends
  friendsSection: {
    marginBottom: Spacing.lg,
  },
  friendsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  friendChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  friendChipSelected: {
    backgroundColor: Colors.accent,
  },
  friendChipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  friendChipAvatarSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  friendChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  friendChipInitial: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  friendChipInitialSelected: {
    color: Colors.white,
  },
  friendChipName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    maxWidth: 80,
  },
  friendChipNameSelected: {
    color: Colors.white,
  },

  // Submit
  submitBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
});
