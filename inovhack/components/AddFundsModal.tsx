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
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: Id<"users">;
  onSuccess?: () => void;
}

type PaymentMethod = "card" | "crypto" | "apple_pay" | "google_pay";

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

  const addFunds = useMutation(api.users.addFunds);

  const isIOS = Platform.OS === "ios";
  const mobilePay = isIOS ? "apple_pay" : "google_pay";
  const mobilePayLabel = isIOS ? "Apple Pay" : "Google Pay";
  const mobilePayIcon = isIOS ? "logo-apple" : "logo-google";

  const handleAddFunds = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }
    if (!selectedMethod) {
      Alert.alert("Erreur", "Choisis un moyen de paiement");
      return;
    }

    setIsProcessing(true);

    try {
      // Simuler un délai de traitement (en prod, ici on appellerait Stripe/etc.)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await addFunds({
        userId,
        amount: numAmount,
        method: selectedMethod,
        reference: `TXN_${Date.now()}`,
      });

      Alert.alert("Succès", `${numAmount}€ ajoutés à ton solde`);
      setAmount("");
      setSelectedMethod(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur lors du paiement");
    } finally {
      setIsProcessing(false);
    }
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
        <View style={styles.container}>
          <View style={styles.handle} />
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter des fonds</Text>
            <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currency}>€</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!isProcessing}
              />
            </View>
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                onPress={() => setAmount(quickAmount.toString())}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountSelected,
                ]}
                disabled={isProcessing}
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
          </View>

          {/* Payment Methods */}
          <Text style={styles.sectionLabel}>MOYEN DE PAIEMENT</Text>
          <View style={styles.methodsGrid}>
            {/* Card */}
            <TouchableOpacity
              onPress={() => setSelectedMethod("card")}
              style={[
                styles.methodCard,
                selectedMethod === "card" && styles.methodCardSelected,
              ]}
              disabled={isProcessing}
            >
              <Ionicons
                name="card"
                size={28}
                color={selectedMethod === "card" ? Colors.black : Colors.textPrimary}
              />
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
            >
              <Ionicons
                name={mobilePayIcon as any}
                size={28}
                color={selectedMethod === mobilePay ? Colors.black : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.methodLabel,
                  selectedMethod === mobilePay && styles.methodLabelSelected,
                ]}
              >
                {mobilePayLabel}
              </Text>
            </TouchableOpacity>

            {/* Crypto */}
            <TouchableOpacity
              onPress={() => setSelectedMethod("crypto")}
              style={[
                styles.methodCard,
                selectedMethod === "crypto" && styles.methodCardSelected,
              ]}
              disabled={isProcessing}
            >
              <Ionicons
                name="wallet"
                size={28}
                color={selectedMethod === "crypto" ? Colors.black : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.methodLabel,
                  selectedMethod === "crypto" && styles.methodLabelSelected,
                ]}
              >
                Crypto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Crypto Address Info */}
          {selectedMethod === "crypto" && (
            <View style={styles.cryptoInfo}>
              <Text style={styles.cryptoLabel}>Adresse USDC (Ethereum)</Text>
              <View style={styles.cryptoAddress}>
                <Text style={styles.cryptoAddressText} numberOfLines={1}>
                  0x742d35Cc6634C0532925a3b844Bc9e7595f...
                </Text>
                <TouchableOpacity>
                  <Ionicons name="copy-outline" size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleAddFunds}
            disabled={isProcessing || !amount || !selectedMethod}
            style={[
              styles.submitButton,
              (isProcessing || !amount || !selectedMethod) && styles.submitButtonDisabled,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <Text style={styles.submitButtonText}>
                Ajouter {amount || "0"}€
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
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
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  amountSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textTertiary,
    marginRight: Spacing.sm,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: "center",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
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
  quickAmountSelected: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  quickAmountText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  quickAmountTextSelected: {
    color: Colors.black,
  },
  sectionLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  methodsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  methodCard: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodCardSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  methodLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    textTransform: "none",
  },
  methodLabelSelected: {
    color: Colors.black,
  },
  cryptoInfo: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cryptoLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  cryptoAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cryptoAddressText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  submitButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
});
