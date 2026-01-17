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
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

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
      Alert.alert("Erreur", `Mise minimum: ${challenge?.minBet}€`);
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
      Alert.alert("Erreur", err.message || "Erreur");
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
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejoindre</Text>
        </Animated.View>

        {/* Challenge Info */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeGoal}>{challenge.goal}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pot?.participantCount || 0}</Text>
              <Text style={styles.statLabel}>participants</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{pot?.total || 0}€</Text>
              <Text style={styles.statLabel}>pot total</Text>
            </View>
          </View>
        </Animated.View>

        {alreadyJoined ? (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.joinedCard}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
            <Text style={styles.joinedText}>Tu participes déjà</Text>
          </Animated.View>
        ) : (
          <>
            {/* Bet Input */}
            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.betSection}>
              <Text style={styles.inputLabel}>TA MISE</Text>
              <View style={styles.betInputContainer}>
                <Text style={styles.betCurrency}>€</Text>
                <TextInput
                  style={styles.betInput}
                  placeholder={challenge.minBet.toString()}
                  placeholderTextColor={Colors.textTertiary}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.balanceText}>Solde: {user?.balance.toFixed(0)}€</Text>
            </Animated.View>

            {/* Quick Amounts */}
            <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.quickAmounts}>
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
            </Animated.View>

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TouchableOpacity
                onPress={handleJoin}
                disabled={isSubmitting}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.black} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Miser {betAmount || challenge.minBet}€
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  challengeCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  challengeGoal: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  joinedCard: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  joinedText: {
    ...Typography.headlineSmall,
    color: Colors.success,
  },
  betSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  betInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  betCurrency: {
    ...Typography.headlineLarge,
    color: Colors.textTertiary,
    marginRight: Spacing.md,
  },
  betInput: {
    flex: 1,
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    padding: 0,
    textAlign: "center",
  },
  balanceText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  quickAmountText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  quickAmountTextSelected: {
    color: Colors.black,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
});
