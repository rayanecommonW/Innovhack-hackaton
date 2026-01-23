/**
 * PACT Home Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { Asset } from "expo-asset";

// Preload logo image
const logoImage = require("../../assets/images/logo_big.png");
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  ZoomIn,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { getCategoryName } from "../../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  BorderWidth,
  Shadows,
} from "../../constants/theme";
import StatsCard from "../../components/StatsCard";
import StreakCalendar from "../../components/StreakCalendar";
import ActivityFeed from "../../components/ActivityFeed";
import Countdown from "../../components/Countdown";
import MyCreatedPacts from "../../components/MyCreatedPacts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper to format time ago
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

export default function HomeScreen() {
  const { user, userId, isLoading: authLoading } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [showNewUserJoinOptions, setShowNewUserJoinOptions] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo image on mount
  useEffect(() => {
    Asset.loadAsync(logoImage).then(() => setLogoLoaded(true));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  // Real user stats
  const userStats = useQuery(
    api.stats.getUserStats,
    userId ? { userId } : "skip"
  );

  // Real user level & XP
  const userLevel = useQuery(
    api.stats.getUserLevel,
    userId ? { userId } : "skip"
  );

  // Real completed days for streak calendar
  const completedDays = useQuery(
    api.stats.getCompletedDays,
    userId ? { userId } : "skip"
  );

  // Pending proofs to validate (for organizers)
  const pendingProofsToValidate = useQuery(
    api.proofs.getProofsToValidateAsOrganizer,
    userId ? { organizerId: userId } : "skip"
  );

  // My pending proofs (awaiting validation)
  const myPendingProofs = useQuery(
    api.proofs.getMyPendingProofs,
    userId ? { userId } : "skip"
  );

  // User profile with image
  const userProfile = useQuery(
    api.users.getPublicProfile,
    userId ? { userId } : "skip"
  );

  // Unread messages count
  const unreadMessages = useQuery(
    api.directMessages.getUnreadCount,
    userId ? { userId } : "skip"
  );

  // Real activity feed
  const activityFeed = useQuery(
    api.feed.getGlobalFeed,
    { limit: 10 }
  );

  // Public/sponsored pacts to discover
  const publicChallenges = useQuery(api.challenges.getPublicChallenges, {});

  const activePacts = participations?.filter((p: any) => p.status === "active") || [];

  // Blinking animation for urgent sections
  const blinkOpacity = useSharedValue(1);

  useEffect(() => {
    if (activePacts.length > 0 || (pendingProofsToValidate && pendingProofsToValidate.length > 0)) {
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [activePacts.length, pendingProofsToValidate?.length]);

  const blinkingBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(239, 68, 68, ${blinkOpacity.value})`,
  }));

  // Transform activity feed to component format
  const activities = (activityFeed || []).map((activity: any) => {
    const actionMap: Record<string, "completed" | "joined" | "failed" | "won"> = {
      "joined_pact": "joined",
      "won_pact": "won",
      "lost_pact": "failed",
      "submitted_proof": "completed",
    };
    return {
      id: activity._id,
      userName: activity.user?.name || "Utilisateur",
      action: actionMap[activity.type] || "joined",
      challengeTitle: activity.metadata?.challengeTitle || "Pact",
      amount: activity.metadata?.amount,
      timeAgo: formatTimeAgo(activity.createdAt),
    };
  }).filter((a: any) => a.action);

  const challengeByCode = useQuery(
    api.challenges.getChallengeByInviteCode,
    inviteCode.length === 6 ? { inviteCode } : "skip"
  );

  const handleJoinByCode = () => {
    if (inviteCode.length !== 6) {
      Alert.alert("Erreur", "Code à 6 chiffres requis");
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      if (challengeByCode) {
        setShowJoinModal(false);
        setInviteCode("");
        setIsSearching(false);
        router.push({ pathname: "/join-challenge", params: { challengeId: challengeByCode._id } });
      } else {
        setIsSearching(false);
        Alert.alert("Erreur", "Aucun pact trouvé avec ce code");
      }
    }, 500);
  };

  const handleCloseModal = () => {
    setShowJoinModal(false);
    setInviteCode("");
    setIsSearching(false);
  };

  const handleSubmitProof = (participationId: string) => {
    router.push({ pathname: "/submit-proof", params: { participationId } });
  };

  const welcomeOpacity = useSharedValue(1);

  const welcomeContainerStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));

  const handleCommencer = () => {
    setIsTransitioning(true);
    welcomeOpacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(setShowWelcome)(false);
      if (!user) {
        runOnJS(router.push)("/auth");
      }
    });
  };

  // Redirect to auth if not logged in - MUST be before any conditional returns
  useEffect(() => {
    if (!authLoading && !user && !showWelcome) {
      router.replace("/auth");
    }
  }, [authLoading, user, showWelcome]);

  // Welcome Screen
  if (showWelcome) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.welcomeContainer, welcomeContainerStyle]}>
          <Animated.View entering={ZoomIn.delay(100).duration(600)}>
            {logoLoaded && (
              <Animated.Image
                entering={FadeIn.duration(300)}
                source={logoImage}
                style={styles.logoImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(logoLoaded ? 400 : 100).duration(400)}>
            <TouchableOpacity
              onPress={handleCommencer}
              style={styles.ctaButton}
              activeOpacity={0.8}
              disabled={isTransitioning}
            >
              <Text style={styles.ctaButtonText}>Commencer</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Loading or not authenticated
  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Main Home
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header - Profile, Balance, Messages */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.headerLeft}
            activeOpacity={0.8}
          >
            <View style={styles.headerAvatar}>
              {userProfile?.profileImageUrl ? (
                <Image source={{ uri: userProfile.profileImageUrl }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarText}>
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              )}
            </View>
            <View style={styles.headerUserInfo}>
              <Text style={styles.headerUsername}>
                @{userProfile?.username || user.name?.toLowerCase().replace(/\s/g, "") || "user"}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <View style={styles.balanceBox}>
              <Text style={styles.balanceAmount}>{user.balance.toFixed(0)}€</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/conversations")}
              style={styles.messagesButton}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={24} color={Colors.textPrimary} />
              {(unreadMessages ?? 0) > 0 && (
                <View style={styles.messagesBadge}>
                  <Text style={styles.messagesBadgeText}>
                    {(unreadMessages ?? 0) > 9 ? "9+" : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* URGENT: Active Pacts at TOP in RED - Reminder to submit proof */}
        {activePacts.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={[styles.urgentPactsSection, blinkingBorderStyle]}
          >
            <View style={styles.urgentHeader}>
              <Ionicons name="warning" size={18} color={Colors.danger} />
              <Text style={styles.urgentTitle}>Preuves à soumettre</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>{activePacts.length}</Text>
              </View>
            </View>
            <View style={styles.urgentPactsList}>
              {activePacts.slice(0, 3).map((pact: any, index: number) => (
                <TouchableOpacity
                  key={pact._id}
                  onPress={() => handleSubmitProof(pact._id)}
                  style={styles.urgentPactCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.urgentPactInfo}>
                    <Text style={styles.urgentPactTitle} numberOfLines={1}>
                      {pact.challenge?.title || "Pact"}
                    </Text>
                    {pact.challenge?.endDate && (
                      <Countdown endDate={pact.challenge.endDate} compact />
                    )}
                  </View>
                  <View style={styles.urgentPactAction}>
                    <Ionicons name="camera" size={18} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
              {activePacts.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push("/my-pacts")}
                  style={styles.seeAllUrgent}
                >
                  <Text style={styles.seeAllUrgentText}>Voir tous ({activePacts.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* ORGANIZER: Proofs to validate */}
        {pendingProofsToValidate && pendingProofsToValidate.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(90).duration(400)}
            style={[styles.organizerProofsSection, blinkingBorderStyle]}
          >
            <TouchableOpacity
              onPress={() => router.push("/validate-proofs")}
              style={styles.organizerProofsCard}
              activeOpacity={0.8}
            >
              <View style={styles.organizerProofsIcon}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.danger} />
              </View>
              <View style={styles.organizerProofsInfo}>
                <Text style={styles.organizerProofsTitle}>Preuves à vérifier</Text>
                <Text style={styles.organizerProofsDesc}>
                  {pendingProofsToValidate.length} preuve{pendingProofsToValidate.length > 1 ? "s" : ""} en attente
                </Text>
              </View>
              <View style={styles.organizerProofsBadge}>
                <Text style={styles.organizerProofsBadgeText}>{pendingProofsToValidate.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* MY PENDING PROOFS: Proofs awaiting validation */}
        {myPendingProofs && myPendingProofs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(95).duration(400)} style={styles.myPendingProofsSection}>
            <View style={styles.myPendingProofsHeader}>
              <Ionicons name="time" size={18} color={Colors.info} />
              <Text style={styles.myPendingProofsTitle}>Mes preuves en attente</Text>
              <View style={styles.myPendingProofsBadge}>
                <Text style={styles.myPendingProofsBadgeText}>{myPendingProofs.length}</Text>
              </View>
            </View>
            <View style={styles.myPendingProofsList}>
              {myPendingProofs.slice(0, 3).map((proof: any) => (
                <TouchableOpacity
                  key={proof._id}
                  onPress={() => router.push({ pathname: "/proof-status", params: { proofId: proof._id } })}
                  style={styles.myPendingProofCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.myPendingProofInfo}>
                    <Text style={styles.myPendingProofTitle} numberOfLines={1}>
                      {proof.challenge?.title || "Pact"}
                    </Text>
                    <Text style={styles.myPendingProofOrganizer} numberOfLines={1}>
                      En attente de {proof.organizer?.name || "l'organisateur"}
                    </Text>
                  </View>
                  <View style={styles.myPendingProofStatus}>
                    <Ionicons name="hourglass" size={16} color={Colors.info} />
                  </View>
                </TouchableOpacity>
              ))}
              {myPendingProofs.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push("/my-proofs")}
                  style={styles.seeAllPending}
                >
                  <Text style={styles.seeAllPendingText}>Voir toutes ({myPendingProofs.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* 4 Main Action Buttons - Always visible for everyone */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.mainActionsSection}>
          <View style={styles.mainActionsGrid}>
            {/* Create Pact */}
            <TouchableOpacity
              style={[styles.bigActionCard, styles.bigActionPrimary]}
              onPress={() => router.push("/create-challenge")}
              activeOpacity={0.85}
            >
              <View style={styles.bigActionIconBox}>
                <Ionicons name="add-circle" size={32} color={Colors.white} />
              </View>
              <Text style={styles.bigActionTitle}>Créer un pact</Text>
              <Text style={styles.bigActionSub}>Lance ton défi</Text>
            </TouchableOpacity>

            {/* Join Pact */}
            <TouchableOpacity
              style={[styles.bigActionCard, styles.bigActionSecondary]}
              onPress={() => setShowNewUserJoinOptions(!showNewUserJoinOptions)}
              activeOpacity={0.85}
            >
              <View style={[styles.bigActionIconBox, styles.bigActionIconSecondary]}>
                <Ionicons name="enter" size={32} color={Colors.accent} />
              </View>
              <Text style={[styles.bigActionTitle, styles.bigActionTitleDark]}>Rejoindre un pact</Text>
              <Text style={styles.bigActionSubDark}>Communauté ou ami</Text>
            </TouchableOpacity>

            {/* Create Group */}
            <TouchableOpacity
              style={[styles.bigActionCard, styles.bigActionTertiary]}
              onPress={() => router.push({ pathname: "/(tabs)/groups", params: { action: "create" } })}
              activeOpacity={0.85}
            >
              <View style={[styles.bigActionIconBox, styles.bigActionIconTertiary]}>
                <Ionicons name="people-circle" size={32} color={Colors.info} />
              </View>
              <Text style={[styles.bigActionTitle, styles.bigActionTitleDark]}>Créer un groupe</Text>
              <Text style={styles.bigActionSubDark}>Défis réguliers</Text>
            </TouchableOpacity>

            {/* Join Group */}
            <TouchableOpacity
              style={[styles.bigActionCard, styles.bigActionQuaternary]}
              onPress={() => router.push({ pathname: "/(tabs)/groups", params: { action: "join" } })}
              activeOpacity={0.85}
            >
              <View style={[styles.bigActionIconBox, styles.bigActionIconQuaternary]}>
                <Ionicons name="people" size={32} color={Colors.success} />
              </View>
              <Text style={[styles.bigActionTitle, styles.bigActionTitleDark]}>Rejoindre un groupe</Text>
              <Text style={styles.bigActionSubDark}>Avec un code</Text>
            </TouchableOpacity>
          </View>

          {/* Join Pact Options */}
          {showNewUserJoinOptions && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.newUserJoinOptions}>
              <TouchableOpacity
                onPress={() => {
                  setShowNewUserJoinOptions(false);
                  router.push("/(tabs)/explore");
                }}
                style={styles.joinOptionCard}
                activeOpacity={0.8}
              >
                <View style={[styles.joinOptionIconBox, { backgroundColor: Colors.infoMuted }]}>
                  <Ionicons name="globe-outline" size={22} color={Colors.info} />
                </View>
                <View style={styles.joinOptionContent}>
                  <Text style={styles.joinOptionTitle}>Pacts communautaires</Text>
                  <Text style={styles.joinOptionDesc}>Explore les défis publics</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowNewUserJoinOptions(false);
                  setShowJoinModal(true);
                }}
                style={styles.joinOptionCard}
                activeOpacity={0.8}
              >
                <View style={[styles.joinOptionIconBox, { backgroundColor: Colors.accentMuted }]}>
                  <Ionicons name="key-outline" size={22} color={Colors.accent} />
                </View>
                <View style={styles.joinOptionContent}>
                  <Text style={styles.joinOptionTitle}>Pact d'un ami</Text>
                  <Text style={styles.joinOptionDesc}>Entre un code d'invitation</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Activity Feed - Only show if there's activity */}
        {activities.length > 0 && (
          <ActivityFeed activities={activities} />
        )}

        {/* Stats Card - Only show if user has participated in pacts */}
        {userStats && (userStats.totalPacts > 0 || userStats.currentStreak > 0) && userLevel && (
          <StatsCard
            totalWon={userStats.totalEarnings || 0}
            totalLost={userStats.totalBet - (userStats.totalEarnings || 0)}
            streak={userStats.currentStreak}
            completedChallenges={userStats.wonPacts + userStats.lostPacts}
            level={userLevel.level}
            xp={userLevel.xp}
            xpToNextLevel={userLevel.xpToNextLevel}
          />
        )}

        {/* Streak Calendar - Only show if user has activity this month */}
        {completedDays && completedDays.length > 0 && (
          <StreakCalendar
            completedDays={completedDays}
            currentStreak={userStats?.currentStreak || 0}
          />
        )}

        {/* My Created Pacts */}
        {userId && (
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.createdPactsSection}>
            <MyCreatedPacts userId={userId} limit={2} />
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Code d'invitation</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Entre le code à 6 chiffres de ton ami</Text>

            <View style={styles.codeBox}>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={Colors.textLight}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              onPress={handleJoinByCode}
              disabled={isSearching || inviteCode.length !== 6}
              style={[
                styles.modalSubmit,
                (isSearching || inviteCode.length !== 6) && styles.modalSubmitDisabled,
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.modalSubmitText}>Rejoindre</Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalBottomSpacer} />
          </View>
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

  // Welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  logoImage: {
    width: 300,
    height: 300,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.white,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Main
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  headerUserInfo: {
    justifyContent: "center",
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  balanceBox: {
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.success,
  },
  messagesButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  messagesBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  messagesBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },

  // Urgent Pacts (at top in red)
  urgentPactsSection: {
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  urgentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.danger,
  },
  urgentBadge: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
  urgentPactsList: {
    gap: Spacing.sm,
  },
  urgentPactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  urgentPactInfo: {
    flex: 1,
  },
  urgentPactTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  urgentPactAction: {
    width: 36,
    height: 36,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  seeAllUrgent: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  seeAllUrgentText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.danger,
  },

  // Organizer Proofs Section
  organizerProofsSection: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  organizerProofsCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  organizerProofsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  organizerProofsInfo: {
    flex: 1,
  },
  organizerProofsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.danger,
  },
  organizerProofsDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  organizerProofsBadge: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  organizerProofsBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },

  // My Pending Proofs Section
  myPendingProofsSection: {
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  myPendingProofsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  myPendingProofsTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.info,
  },
  myPendingProofsBadge: {
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  myPendingProofsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
  myPendingProofsList: {
    gap: Spacing.sm,
  },
  myPendingProofCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  myPendingProofInfo: {
    flex: 1,
  },
  myPendingProofTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  myPendingProofOrganizer: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  myPendingProofStatus: {
    width: 32,
    height: 32,
    backgroundColor: Colors.infoMuted,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  seeAllPending: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  seeAllPendingText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.info,
  },

  // Main Actions Section
  mainActionsSection: {
    marginBottom: Spacing.lg,
  },

  // Actions (old - kept for compatibility)
  actionsSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  primaryActionIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  primaryActionSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.xs,
  },
  secondaryActionIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionText: {
    flex: 1,
  },
  secondaryActionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  secondaryActionSub: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Join Options
  joinOptions: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadows.xs,
  },
  joinOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  joinOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textPrimary,
  },
  joinOptionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.xxl,
  },

  // Pacts Section
  pactsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pactsList: {
    gap: Spacing.sm,
  },
  pactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  pactInfo: {
    flex: 1,
    gap: 4,
  },
  pactTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  pactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pactCategory: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  pactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  pactBet: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.success,
  },
  pactProofBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },

  createdPactsSection: {
    marginBottom: Spacing.lg,
  },

  // New User Section - Big Action Buttons
  newUserSection: {
    marginBottom: Spacing.xl,
  },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  welcomeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },
  mainActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bigActionCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    ...Shadows.md,
  },
  bigActionPrimary: {
    backgroundColor: Colors.accent,
  },
  bigActionSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  bigActionTertiary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.info,
  },
  bigActionQuaternary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  bigActionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  bigActionIconSecondary: {
    backgroundColor: Colors.accentMuted,
  },
  bigActionIconTertiary: {
    backgroundColor: Colors.infoMuted,
  },
  bigActionIconQuaternary: {
    backgroundColor: Colors.successMuted,
  },
  bigActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 2,
  },
  bigActionTitleDark: {
    color: Colors.textPrimary,
  },
  bigActionSub: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  bigActionSubDark: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  exploreLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  exploreLinkText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // New User Join Options
  newUserJoinOptions: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  joinOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  joinOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  joinOptionContent: {
    flex: 1,
  },
  joinOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  joinOptionDesc: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Tips Section
  tipsSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  tipNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  bottomSpacer: {
    height: 120,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 36,
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
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  modalClose: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSub: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  codeBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 6,
  },
  modalSubmit: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  modalBottomSpacer: {
    height: Platform.OS === "ios" ? 20 : 10,
  },
});
