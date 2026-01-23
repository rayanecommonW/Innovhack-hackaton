/**
 * Join Challenge Screen - Clean & Minimal
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
  Alert,
  StyleSheet,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import { getErrorMessage } from "../utils/errorHandler";

export default function JoinChallengeScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { user, userId } = useAuth();

  const challenge = useQuery(
    api.challenges.getChallenge,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip"
  );

  const pot = useQuery(
    api.participations.getChallengePot,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip"
  );

  const participation = useQuery(
    api.participations.getParticipation,
    challengeId && userId
      ? { challengeId: challengeId as Id<"challenges">, userId }
      : "skip"
  );

  const joinChallenge = useMutation(api.participations.joinChallenge);

  const [betAmount, setBetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!userId || !challengeId) {
      Alert.alert("Erreur", "Connexion requise");
      return;
    }

    const amount = parseInt(betAmount);
    if (!amount || amount < (challenge?.minBet || 0)) {
      Alert.alert("Erreur", `Engagement minimum: ${challenge?.minBet}€`);
      return;
    }

    if (user && amount > user.balance) {
      Alert.alert("Erreur", "Solde insuffisant");
      return;
    }

    setIsSubmitting(true);

    try {
      await joinChallenge({
        challengeId: challengeId as Id<"challenges">,
        userId,
        betAmount: amount,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Oups!", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const alreadyJoined = !!participation;
  const quickAmounts = [challenge.minBet, challenge.minBet * 2, challenge.minBet * 5];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rejoindre le pact</Text>
          </Animated.View>

          {/* Challenge Info */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.challengeCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {getCategoryName(challenge.category)}
              </Text>
            </View>

            <Text style={styles.challengeTitle}>{challenge.title}</Text>

            {challenge.description && (
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <View style={styles.statIconBox}>
                  <Ionicons name="people-outline" size={18} color={Colors.accent} />
                </View>
                <Text style={styles.statValue}>{pot?.participantCount || 0}</Text>
                <Text style={styles.statLabel}>participants</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.successMuted }]}>
                  <Ionicons name="wallet-outline" size={18} color={Colors.success} />
                </View>
                <Text style={[styles.statValue, { color: Colors.success }]}>{pot?.total || 0}€</Text>
                <Text style={styles.statLabel}>pot total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.warningMuted }]}>
                  <Ionicons name="time-outline" size={18} color={Colors.warning} />
                </View>
                <Text style={styles.statValue}>{challenge.durationDays || 7}j</Text>
                <Text style={styles.statLabel}>durée</Text>
              </View>
            </View>
          </Animated.View>

          {alreadyJoined ? (
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.joinedCard}>
              <View style={styles.joinedIconBox}>
                <Ionicons name="checkmark" size={32} color={Colors.success} />
              </View>
              <Text style={styles.joinedTitle}>Tu participes déjà</Text>
              <Text style={styles.joinedText}>Ton engagement: {participation?.betAmount}€</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              {/* Bet Section */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.betSection}>
                <Text style={styles.sectionTitle}>Choisis ton engagement</Text>
                <Text style={styles.sectionSubtitle}>Minimum {challenge.minBet}€</Text>

                {/* Quick Amounts */}
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setBetAmount(amount.toString())}
                      style={[
                        styles.quickAmountButton,
                        betAmount === amount.toString() && styles.quickAmountButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          betAmount === amount.toString() && styles.quickAmountTextSelected,
                        ]}
                      >
                        {amount}€
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Input */}
                <View style={styles.betInputContainer}>
                  <TextInput
                    style={styles.betInput}
                    placeholder="Autre montant"
                    placeholderTextColor={Colors.textMuted}
                    value={betAmount}
                    onChangeText={setBetAmount}
                    keyboardType="numeric"
                  />
                  <View style={styles.betCurrencyBox}>
                    <Text style={styles.betCurrency}>EUR</Text>
                  </View>
                </View>

                <View style={styles.balanceRow}>
                  <Ionicons name="wallet-outline" size={14} color={Colors.textTertiary} />
                  <Text style={styles.balanceText}>Ton solde: {user?.balance.toFixed(0)}€</Text>
                </View>
              </Animated.View>

              {/* Info Box */}
              <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
                <Text style={styles.infoText}>
                  Si tu réussis le défi, tu récupères ton engagement + une part du pot des perdants.
                </Text>
              </Animated.View>

              {/* Warning Box */}
              <Animated.View entering={FadeInDown.delay(190).duration(400)} style={styles.warningBox}>
                <Ionicons name="warning" size={20} color={Colors.danger} />
                <Text style={styles.warningText}>
                  Si tu ne soumets pas de preuve avant la fin du pact, ta participation sera automatiquement considérée comme perdue. L'argent sera reversé aux gagnants.
                </Text>
              </Animated.View>

              {/* Submit */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={isSubmitting || !betAmount}
                  style={[
                    styles.submitButton,
                    (isSubmitting || !betAmount) && styles.submitButtonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="flash" size={20} color={Colors.white} />
                      <Text style={styles.submitButtonText}>
                        S'engager {betAmount || challenge.minBet}€
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.accent,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  challengeDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIconBox: {
    width: 36,
    height: 36,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // Already Joined
  joinedCard: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  joinedIconBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  joinedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  joinedText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Bet Section
  betSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.accent,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },
  betInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  betInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
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
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    color: Colors.info,
    lineHeight: 18,
  },

  // Warning Box
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.danger,
    lineHeight: 18,
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  bottomSpacer: {
    height: 40,
  },
});
