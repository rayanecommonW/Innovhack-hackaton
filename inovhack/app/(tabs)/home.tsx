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
  BounceIn,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { getCategoryName } from "../../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const { user, userId, isLoading: authLoading } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinOptions, setShowJoinOptions] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Get user's active participations
  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  // Filter active pacts
  const activePacts = participations?.filter((p: any) => p.status === "active") || [];

  // Query for challenge by invite code (only when we have a 6-digit code)
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

  // Pulse animation for loading glow
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (authLoading) {
      pulseScale.value = withRepeat(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [authLoading]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          {/* Animated glow behind logo */}
          <Animated.View style={[styles.logoGlow, glowStyle]} />
          <Animated.Text
            entering={ZoomIn.duration(800).springify()}
            style={styles.logo}
          >
            PACT
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
            <View style={styles.loadingDots}>
              <Animated.View entering={BounceIn.delay(700)} style={styles.loadingDot} />
              <Animated.View entering={BounceIn.delay(800)} style={styles.loadingDot} />
              <Animated.View entering={BounceIn.delay(900)} style={styles.loadingDot} />
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          {/* Subtle background glow */}
          <View style={styles.welcomeGlow} />

          {/* Logo with dramatic entrance */}
          <Animated.Text
            entering={BounceIn.delay(100).duration(800)}
            style={styles.logo}
          >
            PACT
          </Animated.Text>

          {/* Tagline with staggered fade */}
          <Animated.Text
            entering={FadeInUp.delay(400).duration(600).springify()}
            style={styles.tagline}
          >
            Engage. Parie. Gagne.
          </Animated.Text>

          {/* CTA button with slide up */}
          <Animated.View entering={SlideInDown.delay(700).duration(500).springify()}>
            <TouchableOpacity
              onPress={() => router.push("/auth")}
              style={styles.authButton}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>Commencer</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.black} />
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
      >
        {/* Header with Balance */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Text style={styles.greeting}>Hey {user.name.split(" ")[0]} 👋</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.balanceChip}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet" size={18} color={Colors.success} />
            <Text style={styles.balanceText}>{user.balance.toFixed(0)}€</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Active Pacts Section - TOP PRIORITY */}
        {activePacts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.activePactsSection}>
            <Text style={styles.sectionLabel}>MES PACTS EN COURS</Text>
            <View style={styles.activePactsList}>
              {activePacts.map((pact: any, index: number) => (
                <Animated.View
                  key={pact._id}
                  entering={SlideInDown.delay(150 + index * 50).springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleSubmitProof(pact._id)}
                    style={styles.activePactCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.activePactGlow} />
                    <View style={styles.activePactContent}>
                      <View style={styles.activePactMain}>
                        <Text style={styles.activePactTitle} numberOfLines={1}>
                          {pact.challenge?.title || "Pact"}
                        </Text>
                        <Text style={styles.activePactCategory}>
                          {pact.challenge?.category ? getCategoryName(pact.challenge.category) : ""}
                        </Text>
                      </View>
                      <View style={styles.activePactRight}>
                        <Text style={styles.activePactBet}>{pact.betAmount}€</Text>
                        <View style={styles.proofButton}>
                          <Ionicons name="camera" size={20} color={Colors.black} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Créer un Pact - BIG BUTTON */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              onPress={() => router.push("/create-challenge")}
              style={styles.mainButton}
              activeOpacity={0.85}
            >
              <View style={styles.mainButtonIcon}>
                <Ionicons name="add" size={32} color={Colors.black} />
              </View>
              <View style={styles.mainButtonTextContainer}>
                <Text style={styles.mainButtonText}>Créer un Pact</Text>
                <Text style={styles.mainButtonSubtext}>Défie-toi ou tes amis</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Rejoindre un Pact - BIG BUTTON that expands */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <TouchableOpacity
              onPress={() => setShowJoinOptions(!showJoinOptions)}
              style={[styles.mainButton, styles.joinMainButton]}
              activeOpacity={0.85}
            >
              <View style={[styles.mainButtonIcon, styles.joinMainButtonIcon]}>
                <Ionicons name="people" size={32} color={Colors.textPrimary} />
              </View>
              <View style={styles.mainButtonTextContainer}>
                <Text style={[styles.mainButtonText, styles.joinMainButtonText]}>Rejoindre un Pact</Text>
                <Text style={styles.mainButtonSubtext}>Communauté ou amis</Text>
              </View>
              <Ionicons
                name={showJoinOptions ? "chevron-up" : "chevron-down"}
                size={24}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Join Options - Expandable */}
          {showJoinOptions && (
            <Animated.View
              entering={FadeInDown.duration(200).springify()}
              style={styles.joinOptionsContainer}
            >
              {/* Pact Communautaire */}
              <TouchableOpacity
                onPress={() => {
                  setShowJoinOptions(false);
                  router.push("/(tabs)/explore" as any);
                }}
                style={styles.joinOptionButton}
                activeOpacity={0.85}
              >
                <View style={styles.joinOptionIcon}>
                  <Ionicons name="globe" size={24} color={Colors.info} />
                </View>
                <View style={styles.joinOptionTextContainer}>
                  <Text style={styles.joinOptionText}>Pact Communautaire</Text>
                  <Text style={styles.joinOptionSubtext}>Rejoins des inconnus</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>

              {/* Pact Entre Amis */}
              <TouchableOpacity
                onPress={() => {
                  setShowJoinOptions(false);
                  setShowJoinModal(true);
                }}
                style={styles.joinOptionButton}
                activeOpacity={0.85}
              >
                <View style={[styles.joinOptionIcon, styles.joinOptionIconFriends]}>
                  <Ionicons name="heart" size={24} color={Colors.accent} />
                </View>
                <View style={styles.joinOptionTextContainer}>
                  <Text style={styles.joinOptionText}>Pact Entre Amis</Text>
                  <Text style={styles.joinOptionSubtext}>Code à 6 chiffres</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Join by Code Modal */}
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
          <Animated.View
            entering={SlideInDown.springify()}
            style={styles.modalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejoindre un ami</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Entre le code à 6 chiffres</Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
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
                styles.modalSubmitButton,
                (isSearching || inviteCode.length !== 6) && styles.modalSubmitButtonDisabled,
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Rejoindre</Text>
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
    paddingHorizontal: Spacing.xxxl,
  },
  logo: {
    fontSize: 64,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  logoGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.success,
  },
  loadingDots: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  welcomeGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.success,
    opacity: 0.1,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.huge,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.huge,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },
  authButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.success,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.success,
  },
  // Active Pacts Section
  activePactsSection: {
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    ...Typography.labelSmall,
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  activePactsList: {
    gap: Spacing.md,
  },
  activePactCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    overflow: "hidden",
    ...Shadows.md,
  },
  activePactGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accent,
  },
  activePactContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  activePactMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  activePactTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  activePactCategory: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  activePactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  activePactBet: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.success,
  },
  proofButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  // Main Actions
  actionsContainer: {
    gap: Spacing.lg,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.lg,
  },
  joinMainButton: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  mainButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  joinMainButtonIcon: {
    backgroundColor: Colors.surfaceHighlight,
  },
  mainButtonTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  mainButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.black,
  },
  joinMainButtonText: {
    color: Colors.textPrimary,
  },
  mainButtonSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  // Join Options
  joinOptionsContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  joinOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  joinOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.infoMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  joinOptionIconFriends: {
    backgroundColor: Colors.accentMuted,
  },
  joinOptionTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  joinOptionText: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  joinOptionSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  bottomSpacer: {
    height: 120,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
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
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  codeInputContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeInput: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 12,
  },
  modalSubmitButton: {
    backgroundColor: Colors.textPrimary,
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
});
