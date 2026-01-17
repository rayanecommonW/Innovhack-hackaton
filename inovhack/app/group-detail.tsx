import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
  Image,
  Modal,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [selectedProof, setSelectedProof] = useState<{ url: string; userName: string } | null>(null);

  const group = useQuery(
    api.groups.getGroup,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  const tasks = useQuery(
    api.groups.getGroupTasks,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId } : "skip"
  );

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  const shareInviteCode = async (code: string) => {
    try {
      await Share.share({
        message: `Rejoins mon groupe sur PACT!\n\nCode: ${code}\n\nTélécharge l'app et entre ce code!`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleAddFriend = async (memberId: Id<"users">) => {
    if (!userId) return;
    try {
      const result = await sendFriendRequest({ userId, friendId: memberId });
      if (result.status === "accepted") {
        Alert.alert("Super!", "Vous êtes maintenant amis!");
      } else {
        Alert.alert("Envoyé!", "Demande d'ami envoyée");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handleSubmitProof = (taskId: Id<"groupTasks">) => {
    if (!userId || !groupId) return;
    router.push({
      pathname: "/submit-group-proof",
      params: { taskId, groupId },
    });
  };

  const isFriend = (memberId: string) => {
    return friends?.some((f: any) => f._id === memberId);
  };

  if (!groupId || group === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Groupe introuvable</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>{group.members.length} membres</Text>
        </View>
        <TouchableOpacity
          onPress={() => shareInviteCode(group.inviteCode)}
          style={styles.headerShareButton}
        >
          <Ionicons name="share-social" size={22} color={Colors.success} />
        </TouchableOpacity>
      </View>

      {/* Invite Code Banner */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.inviteCodeBanner}>
        <View>
          <Text style={styles.inviteCodeLabel}>Code d'invitation</Text>
          <Text style={styles.inviteCodeText}>{group.inviteCode}</Text>
        </View>
        <TouchableOpacity
          onPress={() => shareInviteCode(group.inviteCode)}
          style={styles.shareCodeButton}
        >
          <Ionicons name="copy-outline" size={20} color={Colors.black} />
          <Text style={styles.shareCodeButtonText}>Copier</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab("tasks")}
          style={[styles.tab, activeTab === "tasks" && styles.tabActive]}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === "tasks" ? Colors.textPrimary : Colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "tasks" && styles.tabTextActive]}>
            Tâches
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("members")}
          style={[styles.tab, activeTab === "members" && styles.tabActive]}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === "members" ? Colors.textPrimary : Colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "members" && styles.tabTextActive]}>
            Membres
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "tasks" ? (
          <>
            {tasks === undefined ? (
              <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.xxl }} />
            ) : tasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkbox-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>Pas encore de tâches</Text>
                <Text style={styles.emptyStateText}>
                  Ajoute une tâche pour commencer à défier tes amis!
                </Text>
              </View>
            ) : (
              tasks.map((task: any, index: number) => {
                const userProgress = task.progress.find((p: any) => p.userId === userId);
                const isCompleted = userProgress?.completed || false;

                return (
                  <Animated.View
                    key={task._id}
                    entering={FadeInUp.delay(100 + index * 60).springify()}
                    style={styles.taskCard}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleRow}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.taskFrequencyBadge}>
                          <Text style={styles.taskFrequencyText}>
                            {FREQUENCY_LABELS[task.frequency]}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskBetRow}>
                        <Text style={styles.taskBetLabel}>Mise:</Text>
                        <Text style={styles.taskBetAmount}>{task.betAmount}€</Text>
                      </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.taskProgress}>
                      <Text style={styles.taskProgressLabel}>PROGRESSION</Text>
                      <View style={styles.progressGrid}>
                        {task.progress.map((p: any) => (
                          <TouchableOpacity
                            key={p.userId}
                            style={[
                              styles.progressItem,
                              p.completed && styles.progressItemCompleted,
                            ]}
                            onPress={() => p.proofUrl && setSelectedProof({ url: p.proofUrl, userName: p.userName })}
                            activeOpacity={p.proofUrl ? 0.7 : 1}
                          >
                            {p.proofUrl ? (
                              <Image
                                source={{ uri: p.proofUrl }}
                                style={styles.proofThumbnail}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.progressAvatar,
                                  p.completed && styles.progressAvatarCompleted,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.progressAvatarText,
                                    p.completed && styles.progressAvatarTextCompleted,
                                  ]}
                                >
                                  {p.userName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.progressName} numberOfLines={1}>
                              {p.userName}
                            </Text>
                            {p.completed && (
                              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            )}
                            {p.proofUrl && (
                              <Ionicons name="image" size={14} color={Colors.info} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.taskStats}>
                      <View style={styles.taskStatItem}>
                        <Text style={styles.taskStatValue}>{task.completedCount}</Text>
                        <Text style={styles.taskStatLabel}>Complété</Text>
                      </View>
                      <View style={styles.taskStatDivider} />
                      <View style={styles.taskStatItem}>
                        <Text style={[styles.taskStatValue, styles.taskStatValueGain]}>
                          +{task.potentialGain}€
                        </Text>
                        <Text style={styles.taskStatLabel}>Gains potentiels</Text>
                      </View>
                    </View>

                    {/* Submit Proof Button */}
                    {!isCompleted && (
                      <TouchableOpacity
                        onPress={() => handleSubmitProof(task._id)}
                        style={styles.completeButton}
                      >
                        <Ionicons name="camera" size={20} color={Colors.black} />
                        <Text style={styles.completeButtonText}>Soumettre une preuve</Text>
                      </TouchableOpacity>
                    )}
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                        <Text style={styles.completedBadgeText}>Complété aujourd'hui</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })
            )}
          </>
        ) : (
          <>
            {/* Members Tab */}
            <View style={styles.membersList}>
              {group.members.map((member: any, index: number) => {
                const isCurrentUser = member.userId === userId;
                const isAlreadyFriend = isFriend(member.userId);

                return (
                  <Animated.View
                    key={member._id}
                    entering={FadeInUp.delay(100 + index * 60).springify()}
                    style={styles.memberCard}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {isCurrentUser && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>Toi</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.memberRoleRow}>
                        {member.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Ionicons name="star" size={12} color={Colors.accent} />
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {!isCurrentUser && (
                      isAlreadyFriend ? (
                        <View style={styles.friendBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                          <Text style={styles.friendBadgeText}>Ami</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleAddFriend(member.userId)}
                          style={styles.addFriendButton}
                        >
                          <Ionicons name="person-add" size={18} color={Colors.black} />
                        </TouchableOpacity>
                      )
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Proof Image Modal */}
      <Modal
        visible={selectedProof !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProof(null)}
      >
        <View style={styles.proofModalOverlay}>
          <View style={styles.proofModalContent}>
            <View style={styles.proofModalHeader}>
              <Text style={styles.proofModalTitle}>Preuve de {selectedProof?.userName}</Text>
              <TouchableOpacity
                onPress={() => setSelectedProof(null)}
                style={styles.proofModalClose}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {selectedProof?.url && (
              <Image
                source={{ uri: selectedProof.url }}
                style={styles.proofModalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
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
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.textTertiary,
  },
  backButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  headerShareButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  // Invite Code Banner
  inviteCodeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inviteCodeLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  shareCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  shareCodeButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
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
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  // Task Card
  taskCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  taskHeader: {
    marginBottom: Spacing.lg,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    flex: 1,
  },
  taskFrequencyBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  taskFrequencyText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  taskBetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  taskBetLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  taskBetAmount: {
    ...Typography.labelLarge,
    color: Colors.success,
  },
  // Progress
  taskProgress: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  taskProgressLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  progressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressItemCompleted: {
    backgroundColor: Colors.successMuted,
    borderColor: Colors.success,
  },
  progressAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  progressAvatarCompleted: {
    backgroundColor: Colors.success,
  },
  progressAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressAvatarTextCompleted: {
    color: Colors.black,
  },
  progressName: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
    maxWidth: 80,
  },
  // Stats
  taskStats: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  taskStatItem: {
    flex: 1,
    alignItems: "center",
  },
  taskStatValue: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  taskStatValueGain: {
    color: Colors.success,
  },
  taskStatLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  taskStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  // Complete Button
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  completeButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.successMuted,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  completedBadgeText: {
    ...Typography.labelMedium,
    color: Colors.success,
  },
  // Members
  membersList: {
    gap: Spacing.md,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  memberName: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  youBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  youBadgeText: {
    ...Typography.labelSmall,
    color: Colors.black,
    fontSize: 10,
  },
  memberRoleRow: {
    marginTop: Spacing.xs,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    ...Typography.labelSmall,
    color: Colors.accent,
    fontSize: 10,
  },
  friendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  friendBadgeText: {
    ...Typography.labelSmall,
    color: Colors.success,
  },
  addFriendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpacer: {
    height: 120,
  },
  // Proof styles
  proofThumbnail: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHighlight,
  },
  // Proof Modal
  proofModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  proofModalContent: {
    width: SCREEN_WIDTH - Spacing.xxl * 2,
    maxHeight: "80%",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  proofModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  proofModalTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  proofModalClose: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  proofModalImage: {
    width: "100%",
    height: 400,
    backgroundColor: Colors.surface,
  },
});
