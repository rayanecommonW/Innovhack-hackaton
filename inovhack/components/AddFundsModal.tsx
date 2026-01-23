/**
 * Add Funds Modal - LUMA Inspired Design
 * Clean, elegant, minimal payment interface
 * With integrated financial disclaimer for legal compliance
 *
 * Supports both:
 * - Real Stripe payments (development build)
 * - Simulated payments (Expo Go for testing)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import FinancialDisclaimerModal from "./FinancialDisclaimerModal";
import Constants from "expo-constants";

// Check if we're in Expo Go (no native Stripe support)
const isExpoGo = Constants.appOwnership === "expo";

// Conditionally import Stripe (only works in development builds)
let useStripe: any = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
});

if (!isExpoGo) {
  try {
    const stripe = require("@stripe/stripe-react-native");
    useStripe = stripe.useStripe;
  } catch (e) {
    console.log("Stripe native module not available, using simulation mode");
  }
}

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: Id<"users">;
  onSuccess?: () => void;
}

type PaymentMethod = "card" | "apple_pay" | "google_pay";

const QUICK_AMOUNTS = [10, 25, 50, 100];

export default function AddFundsModal({
  visible,
  onClose,
  userId,
  onSuccess,
}: AddFundsModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Stripe hooks (will be mocked in Expo Go)
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Convex - use simulation for Expo Go, real action for dev build
  const addFundsSimulated = useMutation(api.users.addFunds);
  const createPaymentIntent = useAction(api.stripeActions.createDepositPaymentIntent);

  // Check if user has made deposits before (for disclaimer display)
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const isIOS = Platform.OS === "ios";
  const mobilePay = isIOS ? "apple_pay" : "google_pay";
  const mobilePayLabel = isIOS ? "Apple Pay" : "Google Pay";
  const mobilePayIcon = isIOS ? "logo-apple" : "logo-google";

  // Show disclaimer before first deposit (or if balance is 0)
  const isFirstDeposit = !user?.balance || user.balance === 0;

  const handleAddFunds = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }
    if (numAmount < 5) {
      Alert.alert("Erreur", "Montant minimum: 5€");
      return;
    }
    if (numAmount > 1000) {
      Alert.alert("Erreur", "Montant maximum: 1000€");
      return;
    }
    if (!selectedMethod) {
      Alert.alert("Erreur", "Choisis un moyen de paiement");
      return;
    }

    // Show financial disclaimer for first-time depositors
    if (isFirstDeposit) {
      setShowDisclaimer(true);
      return;
    }

    await processPayment(numAmount);
  };

  const processPayment = async (numAmount: number) => {
    setIsProcessing(true);

    try {
      // In Expo Go, use simulated payment
      if (isExpoGo) {
        await processSimulatedPayment(numAmount);
        return;
      }

      // Real Stripe payment flow for development builds
      // 1. Create PaymentIntent on server
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        userId,
        amount: numAmount,
      });

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "PACT",
        applePay: selectedMethod === "apple_pay" ? {
          merchantCountryCode: "FR",
        } : undefined,
        googlePay: selectedMethod === "google_pay" ? {
          merchantCountryCode: "FR",
          testEnv: true,
        } : undefined,
        style: "alwaysDark",
        returnURL: "pact://stripe-redirect",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present Payment Sheet to user
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === "Canceled") {
          return;
        }
        throw new Error(paymentError.message);
      }

      // 4. Payment successful - webhook will handle the rest
      Alert.alert(
        "Paiement en cours",
        `Ton dépôt de ${numAmount}€ est en cours de traitement. Tu seras notifié une fois confirmé.`
      );
      setAmount("");
      setSelectedMethod(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Payment error:", err);
      Alert.alert("Erreur", err.message || "Erreur lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulated payment for Expo Go testing
  const processSimulatedPayment = async (numAmount: number) => {
    try {
      // Simulate payment delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use the simulated addFunds mutation
      await addFundsSimulated({
        userId,
        amount: numAmount,
        method: selectedMethod!,
        reference: `SIM_${Date.now()}`,
      });

      Alert.alert(
        "Succès (Mode Test)",
        `${numAmount}€ ajoutés à ton solde.\n\n⚠️ Paiement simulé - Expo Go ne supporte pas Stripe natif.`
      );
      setAmount("");
      setSelectedMethod(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur lors du paiement simulé");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisclaimerConfirm = () => {
    setShowDisclaimer(false);
    const numAmount = parseFloat(amount);
    processPayment(numAmount);
  };

  const handleDisclaimerCancel = () => {
    setShowDisclaimer(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount("");
      setSelectedMethod(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View entering={SlideInDown.springify()} style={styles.container}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter des fonds</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isProcessing}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.amountSection}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currency}>€</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!isProcessing}
              />
            </View>
          </Animated.View>

          {/* Quick Amounts */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                onPress={() => setAmount(quickAmount.toString())}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountSelected,
                ]}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextSelected,
                  ]}
                >
                  {quickAmount}€
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Payment Methods */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionLabel}>Moyen de paiement</Text>
            <View style={styles.methodsGrid}>
              {/* Card */}
              <TouchableOpacity
                onPress={() => setSelectedMethod("card")}
                style={[
                  styles.methodCard,
                  selectedMethod === "card" && styles.methodCardSelected,
                ]}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.methodIconBox,
                  selectedMethod === "card" && styles.methodIconBoxSelected,
                ]}>
                  <Ionicons
                    name="card-outline"
                    size={22}
                    color={selectedMethod === "card" ? Colors.white : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === "card" && styles.methodLabelSelected,
                  ]}
                >
                  Carte
                </Text>
              </TouchableOpacity>

              {/* Apple/Google Pay */}
              <TouchableOpacity
                onPress={() => setSelectedMethod(mobilePay)}
                style={[
                  styles.methodCard,
                  selectedMethod === mobilePay && styles.methodCardSelected,
                ]}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.methodIconBox,
                  selectedMethod === mobilePay && styles.methodIconBoxSelected,
                ]}>
                  <Ionicons
                    name={mobilePayIcon as any}
                    size={22}
                    color={selectedMethod === mobilePay ? Colors.white : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === mobilePay && styles.methodLabelSelected,
                  ]}
                >
                  {mobilePayLabel}
                </Text>
              </TouchableOpacity>

            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(250)}>
            <TouchableOpacity
              onPress={handleAddFunds}
              disabled={isProcessing || !amount || !selectedMethod}
              style={[
                styles.submitButton,
                (isProcessing || !amount || !selectedMethod) && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    Ajouter {amount || "0"}€
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.securityText}>Paiement securise et chiffre</Text>
          </View>
        </Animated.View>

        {/* Financial Disclaimer Modal */}
        <FinancialDisclaimerModal
          visible={showDisclaimer}
          amount={parseFloat(amount) || 0}
          onConfirm={handleDisclaimerConfirm}
          onCancel={handleDisclaimerCancel}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },

  // Amount
  amountSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    fontSize: 32,
    fontWeight: "500",
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: "600",
    color: Colors.textPrimary,
    minWidth: 80,
    textAlign: "center",
    letterSpacing: -1,
  },

  // Quick Amounts
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  quickAmountTextSelected: {
    color: Colors.white,
  },

  // Section Label
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },

  // Methods
  methodsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  methodIconBoxSelected: {
    backgroundColor: Colors.accent,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  methodLabelSelected: {
    color: Colors.accent,
    fontWeight: "600",
  },

  // Submit Button
  submitButton: {
    flexDirection: "row",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Security Notice
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textMuted,
  },
});
