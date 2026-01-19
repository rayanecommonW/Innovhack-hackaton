/**
 * PACT Home Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React, { useState } from "react";
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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock data for demo
const MOCK_STATS = {
  totalWon: 145,
  totalLost: 30,
  streak: 7,
  completedChallenges: 12,
  level: 8,
  xp: 750,
  xpToNextLevel: 1000,
};

const MOCK_COMPLETED_DAYS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17];

const MOCK_ACTIVITIES = [
  { id: "1", userName: "Marie", action: "completed" as const, challengeTitle: "Sport 4x/semaine", timeAgo: "2min" },
  { id: "2", userName: "Lucas", action: "won" as const, challengeTitle: "Pas d'alcool", amount: 50, timeAgo: "15min" },
  { id: "3", userName: "Emma", action: "joined" as const, challengeTitle: "Méditation", timeAgo: "1h" },
  { id: "4", userName: "Thomas", action: "completed" as const, challengeTitle: "Lecture", timeAgo: "2h" },
  { id: "5", userName: "Julie", action: "failed" as const, challengeTitle: "Se lever tôt", amount: 20, timeAgo: "3h" },
];

export default function HomeScreen() {
  const { user, userId, isLoading: authLoading } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const activePacts = participations?.filter((p: any) => p.status === "active") || [];

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

  // Welcome Screen
  if (showWelcome) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.welcomeContainer, welcomeContainerStyle]}>
          <Animated.View entering={ZoomIn.delay(100).duration(600)}>
            <Image
              source={require("../../assets/images/logo_big.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
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

  // Loading
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    router.replace("/auth");
    return null;
  }

  // Main Home
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greetingLabel}>Bienvenue</Text>
            <Text style={styles.greetingName}>{user.name.split(" ")[0]}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.balanceBox}
            activeOpacity={0.8}
          >
            <Text style={styles.balanceAmount}>{user.balance.toFixed(0)}€</Text>
            <Text style={styles.balanceLabel}>Solde</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Card */}
        <StatsCard {...MOCK_STATS} userName={user.name.split(" ")[0]} />

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <TouchableOpacity
              onPress={() => router.push("/create-challenge")}
              style={styles.primaryAction}
              activeOpacity={0.8}
            >
              <View style={styles.primaryActionIcon}>
                <Ionicons name="add" size={24} color={Colors.white} />
              </View>
              <View style={styles.primaryActionText}>
                <Text style={styles.primaryActionTitle}>Créer un pact</Text>
                <Text style={styles.primaryActionSub}>Défie-toi ou tes amis</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              onPress={() => setShowJoinOptions(!showJoinOptions)}
              style={styles.secondaryAction}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryActionIcon}>
                <Ionicons name="people-outline" size={22} color={Colors.textSecondary} />
              </View>
              <View style={styles.secondaryActionText}>
                <Text style={styles.secondaryActionTitle}>Rejoindre un pact</Text>
                <Text style={styles.secondaryActionSub}>Communauté ou amis</Text>
              </View>
              <Ionicons
                name={showJoinOptions ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>

          {showJoinOptions && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.joinOptions}>
              <TouchableOpacity
                onPress={() => {
                  setShowJoinOptions(false);
                  router.push("/(tabs)/explore" as any);
                }}
                style={styles.joinOption}
                activeOpacity={0.7}
              >
                <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.joinOptionText}>Explorer la communauté</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.joinOptionDivider} />

              <TouchableOpacity
                onPress={() => {
                  setShowJoinOptions(false);
                  setShowJoinModal(true);
                }}
                style={styles.joinOption}
                activeOpacity={0.7}
              >
                <Ionicons name="key-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.joinOptionText}>Entrer un code ami</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Activity Feed */}
        <ActivityFeed activities={MOCK_ACTIVITIES} />

        {/* Streak Calendar */}
        <StreakCalendar completedDays={MOCK_COMPLETED_DAYS} currentStreak={MOCK_STATS.streak} />

        {/* Active Pacts */}
        {activePacts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.pactsSection}>
            <Text style={styles.sectionTitle}>Pacts actifs</Text>
            <View style={styles.pactsList}>
              {activePacts.map((pact: any, index: number) => (
                <Animated.View
                  key={pact._id}
                  entering={FadeInDown.delay(250 + index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => handleSubmitProof(pact._id)}
                    style={styles.pactCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pactInfo}>
                      <Text style={styles.pactTitle} numberOfLines={1}>
                        {pact.challenge?.title || "Pact"}
                      </Text>
                      <View style={styles.pactMeta}>
                        <Text style={styles.pactCategory}>
                          {pact.challenge?.category ? getCategoryName(pact.challenge.category) : ""}
                        </Text>
                        {pact.challenge?.endDate && (
                          <Countdown endDate={pact.challenge.endDate} compact />
                        )}
                      </View>
                    </View>
                    <View style={styles.pactRight}>
                      <Text style={styles.pactBet}>{pact.betAmount}€</Text>
                      <View style={styles.pactProofBtn}>
                        <Ionicons name="camera-outline" size={18} color={Colors.white} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
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
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <Animated.View entering={SlideInDown} style={styles.modalContent}>
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

  // Welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xxl,
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
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  greetingLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  balanceBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "flex-end",
    ...Shadows.sm,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },

  // Actions
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

  bottomSpacer: {
    height: 120,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
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
});
