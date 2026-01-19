/**
 * Join Sponsored Challenge Screen - Clean & Minimal
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function JoinSponsoredScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    brandName: string;
    brandLogo: string;
    brandColor: string;
    minBet: string;
    reward: string;
    category: string;
    duration: string;
  }>();

  const { user, userId } = useAuth();
  const joinSponsoredChallenge = useMutation(api.participations.joinSponsoredChallenge);

  const [betAmount, setBetAmount] = useState(params.minBet || "10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minBet = parseInt(params.minBet || "10");
  const rewardText = params.reward || "Récompense offerte";
  const quickAmounts = [minBet, minBet * 2, minBet * 3];

  const handleJoin = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Connexion requise");
      router.push("/auth");
      return;
    }

    const amount = parseInt(betAmount);
    if (!amount || amount < minBet) {
      Alert.alert("Erreur", `Mise minimum: ${minBet}€`);
      return;
    }

    if (user && amount > user.balance) {
      Alert.alert("Erreur", "Solde insuffisant. Ajoute des fonds depuis ton profil.");
      return;
    }

    setIsSubmitting(true);

    try {
      await joinSponsoredChallenge({
        sponsoredId: params.id || "",
        title: params.title || "",
        brandName: params.brandName || "",
        category: params.category || "other",
        minBet: minBet,
        reward: 0, // Text rewards handled separately
        rewardText: rewardText,
        durationDays: parseInt(params.duration?.replace(/\D/g, "") || "30"),
        userId,
        betAmount: amount,
      });
      Alert.alert(
        "Félicitations !",
        `Tu as rejoint le pact "${params.title}". Bonne chance !`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!params.title) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Pact sponsorisé</Text>
          </Animated.View>

          {/* Sponsor Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sponsorCard}>
            <View style={styles.brandRow}>
              <Image
                source={{ uri: params.brandLogo }}
                style={styles.brandLogoLarge}
              />
              <View style={styles.brandInfo}>
                <Text style={[styles.brandNameLarge, { color: params.brandColor }]}>
                  {params.brandName}
                </Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.partnerBadgeText}>Partenaire officiel</Text>
                </View>
              </View>
            </View>

            <Text style={styles.challengeTitle}>{params.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="folder-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.metaText}>{getCategoryName(params.category || "other")}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.metaText}>{params.duration}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Big Reward Card */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <View style={styles.rewardIconBig}>
                <Ionicons name="gift" size={28} color={Colors.white} />
              </View>
              <View style={styles.rewardTextSection}>
                <Text style={styles.rewardLabel}>Récompense</Text>
                <Text style={styles.rewardAmountHuge} numberOfLines={2}>{rewardText}</Text>
              </View>
            </View>
            <Text style={styles.rewardDescription}>
              Offert par {params.brandName} si tu réussis le défi !
            </Text>
          </Animated.View>

          {/* Bet Section */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.betSection}>
            <Text style={styles.sectionTitle}>Choisis ta mise</Text>
            <Text style={styles.sectionSubtitle}>Minimum {minBet}€</Text>

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
              <Text style={styles.balanceText}>
                Ton solde: {user?.balance?.toFixed(0) || 0}€
              </Text>
            </View>
          </Animated.View>

          {/* Warning Box */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.warningBox}>
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
                    Rejoindre pour {betAmount || minBet}€
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

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

  // Sponsor Card
  sponsorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  brandLogoLarge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  brandInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  brandNameLarge: {
    fontSize: 18,
    fontWeight: "600",
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  partnerBadgeText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.success,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
  },

  // Reward Card
  rewardCard: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rewardIconBig: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardTextSection: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
  },
  rewardAmountHuge: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 24,
  },
  rewardDescription: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
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
