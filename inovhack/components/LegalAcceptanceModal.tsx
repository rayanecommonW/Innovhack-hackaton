/**
 * Legal Acceptance Modal
 * Modal obligatoire pour accepter les CGU et la Politique de Confidentialité
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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

interface LegalAcceptances {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  natureAccepted: boolean;
  ageVerified: boolean;
}

interface LegalAcceptanceModalProps {
  visible: boolean;
  onAccept: (acceptances: LegalAcceptances) => void;
  onDecline?: () => void;
}

export default function LegalAcceptanceModal({
  visible,
  onAccept,
  onDecline,
}: LegalAcceptanceModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedNature, setAcceptedNature] = useState(false);
  const [acceptedAge, setAcceptedAge] = useState(false);

  const allAccepted = acceptedTerms && acceptedPrivacy && acceptedNature && acceptedAge;

  const handleAccept = () => {
    if (allAccepted) {
      onAccept({
        termsAccepted: acceptedTerms,
        privacyAccepted: acceptedPrivacy,
        natureAccepted: acceptedNature,
        ageVerified: acceptedAge,
      });
    }
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
                <Ionicons name="shield-checkmark" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Conditions d'utilisation</Text>
              <Text style={styles.subtitle}>
                Veuillez lire et accepter les conditions suivantes pour continuer
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Important Notice */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.noticeBox}
              >
                <Ionicons name="information-circle" size={20} color={Colors.info} />
                <Text style={styles.noticeText}>
                  PACT est une plateforme de <Text style={styles.bold}>contrats d'engagement personnel</Text>.
                  Vous vous engagez à atteindre vos propres objectifs en déposant une caution
                  motivationnelle que vous récupérez en cas de réussite.
                </Text>
              </Animated.View>

              {/* Key Points */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Text style={styles.sectionTitle}>Points essentiels</Text>

                <View style={styles.keyPoint}>
                  <View style={styles.keyPointIcon}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  </View>
                  <View style={styles.keyPointContent}>
                    <Text style={styles.keyPointTitle}>Pas de jeu de hasard</Text>
                    <Text style={styles.keyPointText}>
                      Vous contrôlez 100% du résultat. Votre réussite dépend uniquement de vos
                      actions, jamais du hasard.
                    </Text>
                  </View>
                </View>

                <View style={styles.keyPoint}>
                  <View style={styles.keyPointIcon}>
                    <Ionicons name="wallet" size={18} color={Colors.warning} />
                  </View>
                  <View style={styles.keyPointContent}>
                    <Text style={styles.keyPointTitle}>Engagements financiers</Text>
                    <Text style={styles.keyPointText}>
                      Votre caution est bloquée pendant la durée du défi. En cas d'échec,
                      elle est redistribuée aux participants ayant réussi.
                    </Text>
                  </View>
                </View>

                <View style={styles.keyPoint}>
                  <View style={styles.keyPointIcon}>
                    <Ionicons name="eye" size={18} color={Colors.info} />
                  </View>
                  <View style={styles.keyPointContent}>
                    <Text style={styles.keyPointTitle}>Transparence</Text>
                    <Text style={styles.keyPointText}>
                      Commission de 5% sur les redistributions publiques, 3% entre amis.
                      Aucuns frais cachés.
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Checkboxes */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.checkboxesContainer}
              >
                <Checkbox checked={acceptedTerms} onToggle={() => setAcceptedTerms(!acceptedTerms)}>
                  J'ai lu et j'accepte les{" "}
                  <Text
                    style={styles.link}
                    onPress={() => router.push("/legal/terms")}
                  >
                    Conditions Générales d'Utilisation
                  </Text>
                </Checkbox>

                <Checkbox checked={acceptedPrivacy} onToggle={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                  J'ai lu et j'accepte la{" "}
                  <Text
                    style={styles.link}
                    onPress={() => router.push("/legal/privacy")}
                  >
                    Politique de Confidentialité
                  </Text>
                </Checkbox>

                <Checkbox checked={acceptedNature} onToggle={() => setAcceptedNature(!acceptedNature)}>
                  Je comprends que PACT est une plateforme d'engagement personnel et{" "}
                  <Text style={styles.bold}>non un jeu de hasard</Text>
                </Checkbox>

                <Checkbox checked={acceptedAge} onToggle={() => setAcceptedAge(!acceptedAge)}>
                  Je certifie avoir <Text style={styles.bold}>18 ans ou plus</Text> et être
                  capable juridiquement de contracter
                </Checkbox>
              </Animated.View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {onDecline && (
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={onDecline}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineText}>Refuser</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  !allAccepted && styles.acceptButtonDisabled,
                ]}
                onPress={handleAccept}
                disabled={!allAccepted}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.acceptText,
                  !allAccepted && styles.acceptTextDisabled,
                ]}>
                  Accepter et continuer
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={allAccepted ? Colors.white : Colors.textMuted}
                />
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
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
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

  // Notice
  noticeBox: {
    flexDirection: "row",
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
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

  // Key Points
  keyPoint: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  keyPointIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  keyPointContent: {
    flex: 1,
  },
  keyPointTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  keyPointText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
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
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },

  // Footer
  footer: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  declineButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  declineText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  acceptButtonDisabled: {
    backgroundColor: Colors.surface,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
  acceptTextDisabled: {
    color: Colors.textMuted,
  },
});
