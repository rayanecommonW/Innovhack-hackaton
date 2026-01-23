/**
 * Group Detail Screen - Clean & Modern
 * Shows all pacts from group members with countdown timers
 */

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
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
  Shadows,
} from "../constants/theme";
import { getErrorMessage } from "../utils/errorHandler";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<"pacts" | "members">("pacts");
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreatePactModal, setShowCreatePactModal] = useState(false);

  // Create pact form state
  const [pactTitle, setPactTitle] = useState("");
  const [pactDescription, setPactDescription] = useState("");
  const [pactMinBet, setPactMinBet] = useState("5"); // Mise minimum pour les autres
  const [pactMyBet, setPactMyBet] = useState("5"); // Ma propre mise
  const [pactDurationHours, setPactDurationHours] = useState("24");
  const [allowMembersToJoin, setAllowMembersToJoin] = useState(true);
  const [creating, setCreating] = useState(false);

  const group = useQuery(
    api.groups.getGroup,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  // Get all pacts in this group
  const groupPacts = useQuery(
    api.challenges.getGroupChallenges,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  const friends = useQuery(
    api.friends.getFriends,
    userId ? { userId } : "skip"
  );

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const createChallenge = useMutation(api.challenges.createChallenge);
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const removeMember = useMutation(api.groups.removeMember);

  // Check if current user is admin
  const currentUserMembership = group?.members?.find(
    (m: any) => m.userId === userId
  );
  const isAdmin = currentUserMembership?.role === "admin";

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const shareInviteCode = async (code: string) => {
    try {
      await Share.share({
        message: `Rejoins mon groupe "${group?.name}" sur PACT!\n\nCode: ${code}\n\nTélécharge l'app et entre ce code!`,
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
      Alert.alert("Oups!", getErrorMessage(error));
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Quitter le groupe",
      "Es-tu sûr de vouloir quitter ce groupe ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Quitter",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGroup({
                groupId: groupId as Id<"groups">,
                userId: userId as Id<"users">,
              });
              Alert.alert("Fait!", "Tu as quitté le groupe");
              router.back();
            } catch (error: any) {
              Alert.alert("Oups!", getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: Id<"users">, memberName: string) => {
    Alert.alert(
      "Exclure le membre",
      `Es-tu sûr de vouloir exclure ${memberName} du groupe ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Exclure",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember({
                groupId: groupId as Id<"groups">,
                adminId: userId as Id<"users">,
                memberId,
              });
              Alert.alert("Fait!", `${memberName} a été exclu du groupe`);
            } catch (error: any) {
              Alert.alert("Oups!", getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const handleCreatePact = () => {
    setShowCreatePactModal(true);
  };

  const handleSubmitGroupPact = async () => {
    if (!userId || !groupId) return;

    const title = pactTitle.trim();
    const description = pactDescription.trim();
    const minBet = parseFloat(pactMinBet);
    const myBet = parseFloat(pactMyBet);
    const duration = parseInt(pactDurationHours);

    if (!title) {
      Alert.alert("Erreur", "Donne un titre à ton pact");
      return;
    }

    if (isNaN(minBet) || minBet < 1) {
      Alert.alert("Erreur", "La mise minimum est de 1€");
      return;
    }

    if (isNaN(myBet) || myBet < 1) {
      Alert.alert("Erreur", "Ta mise doit être d'au moins 1€");
      return;
    }

    if (myBet < minBet) {
      Alert.alert("Erreur", "Ta mise doit être au moins égale à la mise minimum");
      return;
    }

    if (isNaN(duration) || duration < 1) {
      Alert.alert("Erreur", "La durée minimum est de 1 heure");
      return;
    }

    setCreating(true);
    try {
      const now = Date.now();
      const endDate = now + duration * 60 * 60 * 1000;

      await createChallenge({
        title,
        description: description || title,
        category: "fitness",
        type: "group",
        creatorId: userId as Id<"users">,
        groupId: groupId as Id<"groups">,
        proofType: "photo",
        proofDescription: "Envoie une photo comme preuve",
        proofValidationCriteria: "La photo doit montrer la réalisation du défi",
        minBet: minBet,
        creatorBetAmount: myBet, // Ma propre mise
        startDate: now,
        endDate,
        allowMembersToJoin,
      });

      Alert.alert("Pact créé! 🎉", "Ton pact de groupe a été créé avec succès");
      setShowCreatePactModal(false);
      setPactTitle("");
      setPactDescription("");
      setPactMinBet("5");
      setPactMyBet("5");
      setPactDurationHours("24");
      setAllowMembersToJoin(true);
    } catch (error: any) {
      Alert.alert("Oups!", getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleViewPact = (challengeId: string) => {
    router.push(`/challenge/${challengeId}`);
  };

  const isFriend = (memberId: string) => {
    return friends?.some((f: any) => f._id === memberId);
  };

  const formatTimeRemaining = (endDate: number): string => {
    const now = Date.now();
    const diff = endDate - now;

    if (diff <= 0) return "Terminé";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (!groupId || group === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Groupe introuvable</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Include "pending" pacts as active (waiting for participants or in progress)
  const activePacts = groupPacts?.filter((p: any) =>
    p.status === "active" || p.status === "pending"
  ) || [];
  const completedPacts = groupPacts?.filter((p: any) =>
    p.status === "completed" || p.status === "finalized"
  ) || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowShareModal(true)}
          style={styles.headerBtn}
        >
          <Ionicons name="share-social-outline" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{group.members.length}</Text>
          <Text style={styles.statLabel}>Membres</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activePacts.length}</Text>
          <Text style={styles.statLabel}>Pacts actifs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueSuccess]}>
            {completedPacts.length}
          </Text>
          <Text style={styles.statLabel}>Terminés</Text>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab("pacts")}
          style={[styles.tab, activeTab === "pacts" && styles.tabActive]}
        >
          <Ionicons
            name="flash"
            size={18}
            color={activeTab === "pacts" ? Colors.accent : Colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "pacts" && styles.tabTextActive]}>
            Pacts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("members")}
          style={[styles.tab, activeTab === "members" && styles.tabActive]}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === "members" ? Colors.accent : Colors.textTertiary}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {activeTab === "pacts" ? (
          <>
            {/* Create Pact Button */}
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <TouchableOpacity onPress={handleCreatePact} style={styles.createPactBtn}>
                <View style={styles.createPactIcon}>
                  <Ionicons name="add" size={24} color={Colors.white} />
                </View>
                <View style={styles.createPactContent}>
                  <Text style={styles.createPactTitle}>Créer un pact</Text>
                  <Text style={styles.createPactSubtitle}>Défie-toi dans ce groupe</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>

            {/* Active Pacts */}
            {activePacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pacts en cours</Text>
                {activePacts.map((pact: any, index: number) => {
                  const isMyPact = pact.creatorId === userId;
                  const hasJoined = pact.participants?.some((p: any) => p.userId === userId);

                  return (
                    <Animated.View
                      key={pact._id}
                      entering={FadeInUp.delay(200 + index * 50).duration(300)}
                    >
                      <TouchableOpacity
                        onPress={() => handleViewPact(pact._id)}
                        style={styles.pactCard}
                        activeOpacity={0.8}
                      >
                        <View style={styles.pactHeader}>
                          <View style={styles.pactCreator}>
                            <View style={styles.pactCreatorAvatar}>
                              {pact.creator?.profileImageUrl ? (
                                <Image
                                  source={{ uri: pact.creator.profileImageUrl }}
                                  style={styles.pactCreatorImage}
                                />
                              ) : (
                                <Text style={styles.pactCreatorInitial}>
                                  {pact.creator?.name?.charAt(0).toUpperCase() || "?"}
                                </Text>
                              )}
                            </View>
                            <View>
                              <Text style={styles.pactCreatorName}>
                                {isMyPact ? "Toi" : pact.creator?.name || "Utilisateur"}
                              </Text>
                              {isMyPact && (
                                <View style={styles.myPactBadge}>
                                  <Text style={styles.myPactBadgeText}>Ton pact</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={styles.pactTime}>
                            <Ionicons name="time-outline" size={14} color={Colors.warning} />
                            <Text style={styles.pactTimeText}>
                              {formatTimeRemaining(pact.endDate)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.pactTitle}>{pact.title}</Text>

                        <View style={styles.pactFooter}>
                          <View style={styles.pactStat}>
                            <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.pactStatText}>
                              {pact.currentParticipants || 1} participant{(pact.currentParticipants || 1) > 1 ? "s" : ""}
                            </Text>
                          </View>
                          <View style={styles.pactBet}>
                            <Text style={styles.pactBetText}>{pact.minBet}€</Text>
                          </View>
                        </View>

                        {!hasJoined && !isMyPact && (
                          <View style={styles.joinHint}>
                            <Text style={styles.joinHintText}>Appuie pour rejoindre</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {/* Completed Pacts */}
            {completedPacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pacts terminés</Text>
                {completedPacts.slice(0, 5).map((pact: any, index: number) => (
                  <Animated.View
                    key={pact._id}
                    entering={FadeInUp.delay(300 + index * 50).duration(300)}
                  >
                    <TouchableOpacity
                      onPress={() => handleViewPact(pact._id)}
                      style={[styles.pactCard, styles.pactCardCompleted]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pactHeader}>
                        <View style={styles.pactCreator}>
                          <View style={[styles.pactCreatorAvatar, styles.pactCreatorAvatarCompleted]}>
                            <Text style={styles.pactCreatorInitial}>
                              {pact.creator?.name?.charAt(0).toUpperCase() || "?"}
                            </Text>
                          </View>
                          <Text style={styles.pactCreatorName}>
                            {pact.creatorId === userId ? "Toi" : pact.creator?.name || "Utilisateur"}
                          </Text>
                        </View>
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        </View>
                      </View>
                      <Text style={[styles.pactTitle, styles.pactTitleCompleted]}>{pact.title}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {activePacts.length === 0 && completedPacts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="flash-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Aucun pact</Text>
                <Text style={styles.emptyText}>
                  Crée le premier pact pour défier le groupe!
                </Text>
              </View>
            )}
          </>
        ) : (
          /* Members Tab */
          <View style={styles.membersList}>
            {group.members.map((member: any, index: number) => {
              const isCurrentUser = member.userId === userId;
              const isAlreadyFriend = isFriend(member.userId);

              return (
                <Animated.View
                  key={member._id}
                  entering={FadeInUp.delay(100 + index * 50).duration(300)}
                >
                  <View style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      {member.profileImageUrl ? (
                        <Image source={{ uri: member.profileImageUrl }} style={styles.memberAvatarImage} />
                      ) : (
                        <Text style={styles.memberAvatarText}>
                          {member.name?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {isCurrentUser && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>Toi</Text>
                          </View>
                        )}
                        {member.role === "admin" && (
                          <View style={styles.adminBadge}>
                            <Ionicons name="star" size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                    {/* Actions for member */}
                    <View style={styles.memberActions}>
                      {!isCurrentUser && (
                        isAlreadyFriend ? (
                          <View style={styles.friendBadge}>
                            <Ionicons name="checkmark" size={14} color={Colors.success} />
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleAddFriend(member.userId)}
                            style={styles.addFriendBtn}
                          >
                            <Ionicons name="person-add-outline" size={18} color={Colors.accent} />
                          </TouchableOpacity>
                        )
                      )}

                      {/* Admin can exclude non-admin members */}
                      {isAdmin && !isCurrentUser && member.role !== "admin" && (
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(member.userId, member.name)}
                          style={styles.excludeBtn}
                        >
                          <Ionicons name="remove-circle-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Leave Group Button */}
            <TouchableOpacity
              onPress={handleLeaveGroup}
              style={styles.leaveGroupBtn}
            >
              <Ionicons name="exit-outline" size={20} color={Colors.danger} />
              <Text style={styles.leaveGroupText}>Quitter le groupe</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowShareModal(false)}
        >
          <Pressable style={styles.shareModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.shareModalTitle}>Inviter des amis</Text>
            <Text style={styles.shareModalSubtitle}>
              Partage ce code pour inviter tes amis à rejoindre le groupe
            </Text>

            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeLarge}>{group.inviteCode}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                shareInviteCode(group.inviteCode);
                setShowShareModal(false);
              }}
              style={styles.shareButton}
            >
              <Ionicons name="share-social" size={20} color={Colors.white} />
              <Text style={styles.shareButtonText}>Partager le code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowShareModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Group Pact Modal */}
      <Modal
        visible={showCreatePactModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreatePactModal(false)}
      >
        <SafeAreaView style={styles.createPactModalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.createPactModalHeader}>
              <TouchableOpacity
                onPress={() => setShowCreatePactModal(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.createPactModalTitle}>Nouveau pact</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.createPactScrollView}
              contentContainerStyle={styles.createPactScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Titre du pact</Text>
                <TextInput
                  style={styles.formInput}
                  value={pactTitle}
                  onChangeText={setPactTitle}
                  placeholder="Ex: Faire 30 min de sport"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={pactDescription}
                  onChangeText={setPactDescription}
                  placeholder="Détails du défi..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.formLabel}>Ma mise (€)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pactMyBet}
                    onChangeText={setPactMyBet}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.formLabel}>Mise min. (autres)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pactMinBet}
                    onChangeText={setPactMinBet}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Durée (heures)</Text>
                <TextInput
                  style={styles.formInput}
                  value={pactDurationHours}
                  onChangeText={setPactDurationHours}
                  keyboardType="numeric"
                  placeholder="24"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Autoriser les membres à rejoindre</Text>
                  <Text style={styles.switchDescription}>
                    Les autres membres du groupe pourront participer à ton pact
                  </Text>
                </View>
                <Switch
                  value={allowMembersToJoin}
                  onValueChange={setAllowMembersToJoin}
                  trackColor={{ false: Colors.border, true: Colors.accentMuted }}
                  thumbColor={allowMembersToJoin ? Colors.accent : Colors.textMuted}
                />
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={Colors.info} />
                <Text style={styles.infoText}>
                  Ta preuve sera validée par les membres du groupe. Il faut plus de 50% d'approbation pour gagner.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSubmitGroupPact}
                style={[styles.createPactButton, creating && styles.createPactButtonDisabled]}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="flash" size={20} color={Colors.white} />
                    <Text style={styles.createPactButtonText}>Créer le pact</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
    fontSize: 16,
    color: Colors.textTertiary,
  },
  backBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
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
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  inviteCodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  inviteCodeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.accent,
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statValueSuccess: {
    color: Colors.success,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: 4,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Create Pact Button
  createPactBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
    borderStyle: "dashed",
  },
  createPactIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  createPactContent: {
    flex: 1,
  },
  createPactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  createPactSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  // Pact Card
  pactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  pactCardCompleted: {
    opacity: 0.7,
  },
  pactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  pactCreator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pactCreatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pactCreatorAvatarCompleted: {
    backgroundColor: Colors.surfaceHighlight,
  },
  pactCreatorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pactCreatorInitial: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.accent,
  },
  pactCreatorName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  myPactBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    marginTop: 2,
  },
  myPactBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.accent,
  },
  pactTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pactTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.warning,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  pactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pactTitleCompleted: {
    color: Colors.textSecondary,
  },
  pactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pactStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pactStatText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  pactBet: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pactBetText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
  },
  joinHint: {
    backgroundColor: Colors.accentMuted,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  joinHintText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
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

  // Members
  membersList: {
    gap: Spacing.sm,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  memberAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  youBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.accent,
  },
  adminBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warningMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  friendBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  addFriendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  excludeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dangerMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  leaveGroupText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.danger,
  },

  bottomSpacer: {
    height: 100,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboard: {
    width: "100%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },

  // Share Modal
  shareModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
    alignItems: "center",
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  shareModalSubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  inviteCodeBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.accentMuted,
    borderStyle: "dashed",
  },
  inviteCodeLarge: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    width: "100%",
    marginBottom: Spacing.md,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textTertiary,
  },

  // Create Pact Modal
  createPactModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  createPactModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  createPactModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  closeModalBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  createPactScrollView: {
    flex: 1,
  },
  createPactScrollContent: {
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  createPactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  createPactButtonDisabled: {
    opacity: 0.6,
  },
  createPactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
