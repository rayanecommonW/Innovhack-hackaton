/**
 * Financial Disclaimer Modal
 * Affiché avant le premier dépôt pour clarifier la nature du service
 * Conforme aux exigences légales françaises
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

interface FinancialDisclaimerModalProps {
  visible: boolean;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function FinancialDisclaimerModal({
  visible,
  amount,
  onConfirm,
  onCancel,
}: FinancialDisclaimerModalProps) {
  const [understood, setUnderstood] = useState(false);
  const [acceptRisk, setAcceptRisk] = useState(false);

  const canConfirm = understood && acceptRisk;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      // Reset for next time
      setUnderstood(false);
      setAcceptRisk(false);
    }
  };

  const handleCancel = () => {
    setUnderstood(false);
    setAcceptRisk(false);
    onCancel();
  };

  const Checkbox = ({
    checked,
    onToggle,
    children,
  }: {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
      <Text style={styles.checkboxLabel}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet" size={28} color={Colors.warning} />
              </View>
              <Text style={styles.title}>Engagement financier</Text>
              <Text style={styles.subtitle}>
                Vous êtes sur le point de déposer {amount}€
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount Display */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.amountCard}
              >
                <Text style={styles.amountLabel}>Montant de l'engagement</Text>
                <Text style={styles.amountValue}>{amount}€</Text>
              </Animated.View>

              {/* Important Notice */}
              <Animated.View
                entering={FadeInDown.delay(150).duration(400)}
                style={styles.warningBox}
              >
                <Ionicons name="alert-circle" size={24} color={Colors.warning} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Ce n'est PAS un pari</Text>
                  <Text style={styles.warningText}>
                    PACT n'est pas un site de paris sportifs ou de jeux d'argent.
                    Votre engagement est une <Text style={styles.bold}>caution motivationnelle</Text> que
                    vous récupérez si vous atteignez votre objectif.
                  </Text>
                </View>
              </Animated.View>

              {/* Key Information */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <Text style={styles.sectionTitle}>Comment ça fonctionne</Text>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: Colors.successMuted }]}>
                      <Ionicons name="checkmark" size={16} color={Colors.success} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoTitle}>Si vous réussissez</Text>
                      <Text style={styles.infoText}>
                        Vous récupérez 100% de votre engagement + un bonus proportionnel
                        provenant des participants qui ont échoué.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: Colors.dangerMuted }]}>
                      <Ionicons name="close" size={16} color={Colors.danger} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoTitle}>Si vous échouez</Text>
                      <Text style={styles.infoText}>
                        Votre engagement est redistribué aux participants qui ont réussi
                        le défi (moins la commission PACT de 3-5%).
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={[styles.infoIcon, { backgroundColor: Colors.infoMuted }]}>
                      <Ionicons name="lock-closed" size={16} color={Colors.info} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoTitle}>Fonds bloqués</Text>
                      <Text style={styles.infoText}>
                        Votre engagement est bloqué pendant toute la durée du défi.
                        Aucun remboursement n'est possible une fois le pact commencé.
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Fee Breakdown */}
              <Animated.View
                entering={FadeInDown.delay(250).duration(400)}
                style={styles.feeBox}
              >
                <Text style={styles.feeTitle}>Commission PACT</Text>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Pacts publics</Text>
                  <Text style={styles.feeValue}>5%</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Pacts entre amis</Text>
                  <Text style={styles.feeValue}>3%</Text>
                </View>
                <Text style={styles.feeNote}>
                  La commission est prélevée uniquement sur les redistributions,
                  pas sur votre dépôt initial.
                </Text>
              </Animated.View>

              {/* Responsible Use */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={styles.responsibleBox}
              >
                <Ionicons name="heart" size={20} color={Colors.accent} />
                <View style={styles.responsibleContent}>
                  <Text style={styles.responsibleTitle}>Utilisation responsable</Text>
                  <Text style={styles.responsibleText}>
                    N'engagez que des sommes que vous pouvez vous permettre de perdre.
                    PACT est conçu pour vous motiver, pas pour vous mettre en difficulté
                    financière.
                  </Text>
                </View>
              </Animated.View>

              {/* Checkboxes */}
              <Animated.View
                entering={FadeInDown.delay(350).duration(400)}
                style={styles.checkboxesContainer}
              >
                <Checkbox checked={understood} onToggle={() => setUnderstood(!understood)}>
                  Je comprends que mon engagement de{" "}
                  <Text style={styles.bold}>{amount}€</Text> sera bloqué pendant
                  la durée du défi et potentiellement perdu si j'échoue
                </Checkbox>

                <Checkbox checked={acceptRisk} onToggle={() => setAcceptRisk(!acceptRisk)}>
                  Je confirme avoir les moyens de perdre cette somme et agir de
                  manière responsable
                </Checkbox>
              </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !canConfirm && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!canConfirm}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.confirmText,
                  !canConfirm && styles.confirmTextDisabled,
                ]}>
                  Confirmer le dépôt
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    maxHeight: "90%",
    ...Shadows.lg,
  },

  // Header
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warningMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Scroll
  scrollView: {
    paddingHorizontal: Spacing.lg,
  },

  // Amount Card
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },

  // Warning Box
  warningBox: {
    flexDirection: "row",
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // Info List
  infoList: {
    gap: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Fee Box
  feeBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  feeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  feeNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },

  // Responsible Box
  responsibleBox: {
    flexDirection: "row",
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  responsibleContent: {
    flex: 1,
  },
  responsibleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
    marginBottom: 4,
  },
  responsibleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Checkboxes
  checkboxesContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  confirmTextDisabled: {
    color: Colors.textMuted,
  },
});
