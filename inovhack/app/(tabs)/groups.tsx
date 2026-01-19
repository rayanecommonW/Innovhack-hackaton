/**
 * Groups Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
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

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export default function GroupsScreen() {
  const { userId, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskFrequency, setTaskFrequency] = useState("daily");
  const [taskBet, setTaskBet] = useState("5");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Id<"users">[]>([]);

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
  const createTask = useMutation(api.groups.createTask);

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
      const friendsAddedText = selectedFriends.length > 0
        ? `\n\n${selectedFriends.length} ami${selectedFriends.length > 1 ? "s" : ""} ajouté${selectedFriends.length > 1 ? "s" : ""} au groupe!`
        : "";
      Alert.alert(
        "Groupe créé!",
        `Code d'invitation: ${result.inviteCode}${friendsAddedText}\n\nPartage-le avec tes amis!`,
        [
          {
            text: "Partager",
            onPress: () => shareInviteCode(result.inviteCode),
          },
          { text: "OK" },
        ]
      );
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
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
      Alert.alert("Erreur", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!userId || !selectedGroupId || !taskTitle.trim()) return;
    setIsLoading(true);
    try {
      await createTask({
        groupId: selectedGroupId as any,
        title: taskTitle.trim(),
        frequency: taskFrequency,
        betAmount: parseFloat(taskBet) || 5,
        creatorId: userId,
      });
      setShowTaskModal(false);
      setTaskTitle("");
      setTaskBet("5");
      Alert.alert("Tâche créée!", "Tout le monde peut maintenant participer.");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const shareInviteCode = async (code: string) => {
    try {
      await Share.share({
        message: `Rejoins mon groupe sur PACT!\n\nCode: ${code}\n\nTélécharge l'app et entre ce code!`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const openTaskModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowTaskModal(true);
  };

  const openCreateModal = () => {
    setShowActionMenu(false);
    setShowCreateModal(true);
  };

  const openJoinModal = () => {
    setShowActionMenu(false);
    setShowJoinModal(true);
  };

  if (!userId || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.loginIconBox}>
            <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.loginTitle}>Connexion requise</Text>
          <Text style={styles.loginSubtitle}>Connecte-toi pour accéder aux groupes</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Groupes</Text>
            {hasGroups && (
              <TouchableOpacity
                onPress={() => setShowActionMenu(true)}
                style={styles.headerAddButton}
              >
                <Ionicons name="add" size={22} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerSubtitle}>Défie tes amis</Text>
        </Animated.View>

        {/* Big Action Buttons (when no groups) */}
        {!hasGroups && groups !== undefined && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.actionButton}
              activeOpacity={0.9}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="add" size={28} color={Colors.white} />
              </View>
              <Text style={styles.actionButtonText}>Créer</Text>
              <Text style={styles.actionButtonSubtext}>Nouveau groupe</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              style={[styles.actionButton, styles.actionButtonSecondary]}
              activeOpacity={0.9}
            >
              <View style={[styles.actionButtonIcon, styles.actionButtonIconSecondary]}>
                <Ionicons name="enter-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Rejoindre</Text>
              <Text style={styles.actionButtonSubtextSecondary}>Avec un code</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Groups List */}
        {groups === undefined ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : groups.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>
              Crée un groupe et invite tes amis
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group: any, index: number) => (
              <Animated.View
                key={group._id}
                entering={FadeInUp.delay(100 + index * 60).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/group-detail", params: { groupId: group._id } })}
                  style={styles.groupCard}
                  activeOpacity={0.9}
                >
                  {/* Group Header */}
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <View style={styles.membersBadge}>
                          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                          <Text style={styles.membersText}>
                            {group.memberCount}
                          </Text>
                        </View>
                        {group.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        shareInviteCode(group.inviteCode);
                      }}
                      style={styles.shareButton}
                    >
                      <Ionicons name="share-social-outline" size={18} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>

                  {/* Stats */}
                  <View style={styles.groupStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{group.taskCount || 0}</Text>
                      <Text style={styles.statLabel}>Tâches</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, styles.statValueMoney]}>
                        +{(group.taskCount || 0) * 10}€
                      </Text>
                      <Text style={styles.statLabel}>Potentiel</Text>
                    </View>
                  </View>

                  {/* Add Task */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openTaskModal(group._id);
                    }}
                    style={styles.addTaskButton}
                  >
                    <Ionicons name="add" size={18} color={Colors.accent} />
                    <Text style={styles.addTaskText}>Nouvelle tâche</Text>
                  </TouchableOpacity>

                  {/* View Details */}
                  <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>Voir détails</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable style={styles.actionMenuOverlay} onPress={() => setShowActionMenu(false)}>
          <Animated.View entering={FadeIn.duration(150)} style={styles.actionMenuContainer}>
            <TouchableOpacity
              onPress={openCreateModal}
              style={styles.actionMenuItem}
            >
              <View style={styles.actionMenuIcon}>
                <Ionicons name="add" size={20} color={Colors.white} />
              </View>
              <Text style={styles.actionMenuText}>Créer un groupe</Text>
            </TouchableOpacity>
            <View style={styles.actionMenuDivider} />
            <TouchableOpacity
              onPress={openJoinModal}
              style={styles.actionMenuItem}
            >
              <View style={[styles.actionMenuIcon, styles.actionMenuIconSecondary]}>
                <Ionicons name="enter-outline" size={20} color={Colors.accent} />
              </View>
              <Text style={styles.actionMenuText}>Rejoindre un groupe</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

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
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCreateModal(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={styles.modalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un groupe</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Nom du groupe</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Les Warriors"
                placeholderTextColor={Colors.textMuted}
                value={groupName}
                onChangeText={setGroupName}
                autoFocus
              />

              {/* Friends Selection */}
              {friends && friends.length > 0 && (
                <View style={styles.friendsSelectionSection}>
                  <Text style={styles.inputLabel}>Ajouter des amis (optionnel)</Text>
                  <View style={styles.friendsSelectionList}>
                    {friends.map((friend: any) => {
                      const isSelected = selectedFriends.includes(friend._id);
                      return (
                        <TouchableOpacity
                          key={friend._id}
                          onPress={() => toggleFriendSelection(friend._id)}
                          style={[
                            styles.friendSelectionItem,
                            isSelected && styles.friendSelectionItemSelected,
                          ]}
                          disabled={isLoading}
                        >
                          <View style={[
                            styles.friendSelectionAvatar,
                            isSelected && styles.friendSelectionAvatarSelected,
                          ]}>
                            <Text style={[
                              styles.friendSelectionAvatarText,
                              isSelected && styles.friendSelectionAvatarTextSelected,
                            ]}>
                              {friend.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[
                            styles.friendSelectionName,
                            isSelected && styles.friendSelectionNameSelected,
                          ]} numberOfLines={1}>
                            {friend.name}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedFriends.length > 0 && (
                    <Text style={styles.selectedFriendsCount}>
                      {selectedFriends.length} ami{selectedFriends.length > 1 ? "s" : ""} sélectionné{selectedFriends.length > 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={isLoading || !groupName.trim()}
                style={[
                  styles.modalSubmitButton,
                  (!groupName.trim() || isLoading) && styles.modalSubmitButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Créer le groupe</Text>
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
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowJoinModal(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={styles.modalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejoindre un groupe</Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Code d'invitation</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="ABC123"
                placeholderTextColor={Colors.textMuted}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase().slice(0, 6))}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={isLoading || inviteCode.length !== 6}
                style={[
                  styles.modalSubmitButton,
                  (inviteCode.length !== 6 || isLoading) && styles.modalSubmitButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Rejoindre</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTaskModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowTaskModal(false)}
          />
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={styles.modalContainerLarge}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle tâche</Text>
              <TouchableOpacity
                onPress={() => setShowTaskModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Titre de la tâche</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 10 000 pas"
                placeholderTextColor={Colors.textMuted}
                value={taskTitle}
                onChangeText={setTaskTitle}
              />

              <Text style={styles.inputLabel}>Fréquence</Text>
              <View style={styles.frequencyRow}>
                {(["daily", "weekly", "monthly", "yearly"] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => setTaskFrequency(freq)}
                    style={[
                      styles.frequencyButton,
                      taskFrequency === freq && styles.frequencyButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        taskFrequency === freq && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {FREQUENCY_LABELS[freq]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Ta mise</Text>
              <View style={styles.betInputRow}>
                <TextInput
                  style={styles.betInput}
                  placeholder="5"
                  placeholderTextColor={Colors.textMuted}
                  value={taskBet}
                  onChangeText={setTaskBet}
                  keyboardType="numeric"
                />
                <View style={styles.betCurrencyBox}>
                  <Text style={styles.betCurrency}>EUR</Text>
                </View>
              </View>

              <View style={styles.taskInfoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
                <Text style={styles.taskInfoText}>
                  Si tu rates, tu perds {taskBet}€. Si les autres ratent, tu gagnes leur mise!
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCreateTask}
                disabled={isLoading || !taskTitle.trim()}
                style={[
                  styles.modalSubmitButton,
                  (!taskTitle.trim() || isLoading) && styles.modalSubmitButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Créer la tâche</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
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
  loginIconBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  loginSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.white,
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
    marginBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  headerAddButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Action Buttons
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionButtonIconSecondary: {
    backgroundColor: Colors.accentMuted,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    color: Colors.textPrimary,
  },
  actionButtonSubtext: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  actionButtonSubtextSecondary: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Loading & Empty
  loadingSection: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
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
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Groups List
  groupsList: {
    gap: Spacing.md,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  groupInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  membersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  membersText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  adminBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.accent,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats
  groupStats: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statValueMoney: {
    color: Colors.success,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // Add Task
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.md,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  bottomSpacer: {
    height: 120,
  },

  // Action Menu Modal
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  actionMenuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: "100%",
    maxWidth: 320,
    ...Shadows.lg,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  actionMenuIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenuIconSecondary: {
    backgroundColor: Colors.accentMuted,
  },
  actionMenuText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: Colors.border,
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
  },
  modalContainerLarge: {
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
  modalCloseButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
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
    fontWeight: "400",
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
  frequencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  frequencyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
  },
  frequencyButtonActive: {
    backgroundColor: Colors.accent,
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: Colors.white,
  },
  betInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  betInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.accent,
  },
  betCurrencyBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  betCurrency: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  taskInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  taskInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    color: Colors.info,
  },
  modalSubmitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.white,
  },

  // Friends Selection
  friendsSelectionSection: {
    marginBottom: Spacing.lg,
  },
  friendsSelectionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  friendSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  friendSelectionItemSelected: {
    backgroundColor: Colors.accent,
  },
  friendSelectionAvatar: {
    width: 24,
    height: 24,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  friendSelectionAvatarSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  friendSelectionAvatarText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  friendSelectionAvatarTextSelected: {
    color: Colors.white,
  },
  friendSelectionName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    maxWidth: 80,
  },
  friendSelectionNameSelected: {
    color: Colors.white,
  },
  selectedFriendsCount: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.accent,
    marginTop: Spacing.sm,
  },
});
