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
  Dimensions,
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
  ZoomIn,
  FadeIn,
  BounceIn,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
          <Animated.View entering={BounceIn.delay(100)}>
            <Ionicons name="people" size={64} color={Colors.textTertiary} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.emptyTitle}>
            Connecte-toi
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(300)}>
            <TouchableOpacity
              onPress={() => router.push("/auth")}
              style={styles.authButton}
            >
              <Text style={styles.authButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </Animated.View>
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
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Groupes</Text>
            <Text style={styles.headerSubtitle}>Défie tes amis au quotidien</Text>
          </View>
          {/* Show + button in header when user has groups */}
          {hasGroups && (
            <TouchableOpacity
              onPress={() => setShowActionMenu(true)}
              style={styles.headerAddButton}
            >
              <Ionicons name="add" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Show big buttons only when no groups */}
        {!hasGroups && groups !== undefined && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.actionButton}
              activeOpacity={0.85}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="add" size={32} color={Colors.textPrimary} />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <Text style={styles.actionButtonText}>Créer</Text>
                <Text style={styles.actionButtonSubtext}>Nouveau groupe</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              style={styles.actionButton}
              activeOpacity={0.85}
            >
              <View style={styles.actionButtonIcon}>
                <Ionicons name="enter" size={32} color={Colors.textPrimary} />
              </View>
              <View style={styles.actionButtonTextContainer}>
                <Text style={styles.actionButtonText}>Rejoindre</Text>
                <Text style={styles.actionButtonSubtext}>Avec un code</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Groups List */}
        {groups === undefined ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={Colors.success} size="large" />
          </View>
        ) : groups.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Pas encore de groupe</Text>
            <Text style={styles.emptyText}>
              Crée un groupe et invite tes amis pour commencer!
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group: any, index: number) => (
              <Animated.View
                key={group._id}
                entering={FadeInUp.delay(100 + index * 80).springify()}
              >
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/group-detail", params: { groupId: group._id } })}
                  style={styles.groupCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <Ionicons name="people" size={14} color={Colors.textTertiary} />
                        <Text style={styles.groupMetaText}>
                          {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
                        </Text>
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
                      <Ionicons name="share-social" size={20} color={Colors.success} />
                    </TouchableOpacity>
                  </View>

                  {/* Tasks Count */}
                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{group.taskCount || 0}</Text>
                      <Text style={styles.statLabel}>Tâches actives</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, styles.statValueMoney]}>
                        +{(group.taskCount || 0) * 10}€
                      </Text>
                      <Text style={styles.statLabel}>Gains potentiels</Text>
                    </View>
                  </View>

                  {/* Add Task Button */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openTaskModal(group._id);
                    }}
                    style={styles.addTaskButton}
                  >
                    <Ionicons name="add-circle" size={20} color={Colors.success} />
                    <Text style={styles.addTaskText}>Ajouter une tâche</Text>
                  </TouchableOpacity>

                  {/* View Details Indicator */}
                  <View style={styles.viewDetailsIndicator}>
                    <Text style={styles.viewDetailsText}>Voir les détails</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Menu Modal (when user has groups) */}
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
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionMenuText}>Créer un groupe</Text>
            </TouchableOpacity>
            <View style={styles.actionMenuDivider} />
            <TouchableOpacity
              onPress={openJoinModal}
              style={styles.actionMenuItem}
            >
              <View style={styles.actionMenuIcon}>
                <Ionicons name="enter" size={24} color={Colors.textPrimary} />
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
            entering={SlideInDown.springify()}
            style={styles.modalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un groupe</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
                placeholderTextColor={Colors.textTertiary}
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
                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
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
                  <ActivityIndicator color={Colors.black} />
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
            entering={SlideInDown.springify()}
            style={styles.modalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejoindre un groupe</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
                placeholderTextColor={Colors.textTertiary}
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
                  <ActivityIndicator color={Colors.black} />
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
            entering={SlideInDown.springify()}
            style={styles.modalContainerLarge}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle tâche</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
                placeholderTextColor={Colors.textTertiary}
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
                  placeholderTextColor={Colors.textTertiary}
                  value={taskBet}
                  onChangeText={setTaskBet}
                  keyboardType="numeric"
                />
                <Text style={styles.betCurrency}>€</Text>
              </View>

              <View style={styles.taskInfoBox}>
                <Ionicons name="information-circle" size={20} color={Colors.info} />
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
                  <ActivityIndicator color={Colors.black} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  headerAddButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Big Action Buttons (when no groups)
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  actionButtonTextContainer: {
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  actionButtonSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  // Loading & Empty
  loadingSection: {
    padding: Spacing.huge,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  authButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  authButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  // Groups List
  groupsList: {
    gap: Spacing.lg,
  },
  groupCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  groupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  groupMetaText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  adminBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  adminBadgeText: {
    ...Typography.labelSmall,
    color: Colors.success,
    fontSize: 10,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  // Group Stats
  groupStats: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statValueMoney: {
    color: Colors.success,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  // Add Task Button
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.success,
    borderStyle: "dashed",
  },
  addTaskText: {
    ...Typography.labelMedium,
    color: Colors.success,
  },
  viewDetailsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  viewDetailsText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  bottomSpacer: {
    height: 120,
  },
  // Action Menu Modal
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  actionMenuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: "100%",
    maxWidth: 320,
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
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenuText: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  modalContainerLarge: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
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
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  codeInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  frequencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  frequencyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frequencyButtonActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  frequencyButtonText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: Colors.black,
  },
  betInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  betInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.success,
  },
  betCurrency: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.success,
    paddingRight: Spacing.lg,
  },
  taskInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  taskInfoText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.info,
  },
  modalSubmitButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  // Friends Selection in Create Modal
  friendsSelectionSection: {
    marginBottom: Spacing.xl,
  },
  friendsSelectionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  friendSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  friendSelectionItemSelected: {
    backgroundColor: Colors.successMuted,
    borderColor: Colors.success,
  },
  friendSelectionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  friendSelectionAvatarSelected: {
    backgroundColor: Colors.success,
  },
  friendSelectionAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  friendSelectionAvatarTextSelected: {
    color: Colors.black,
  },
  friendSelectionName: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    maxWidth: 100,
  },
  friendSelectionNameSelected: {
    color: Colors.success,
  },
  selectedFriendsCount: {
    ...Typography.bodySmall,
    color: Colors.success,
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
