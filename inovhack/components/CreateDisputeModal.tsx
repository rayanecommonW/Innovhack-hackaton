/**
 * CreateDisputeModal - Modal pour créer une contestation
 * Permet de contester une preuve d'un autre participant
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

interface CreateDisputeModalProps {
  visible: boolean;
  onClose: () => void;
  proofId: Id<"proofs">;
  userId: Id<"users">;
  targetUserName?: string;
  challengeTitle?: string;
}

const DISPUTE_REASONS = [
  { key: "fake_proof", label: "Preuve falsifiée", icon: "image-outline", description: "La preuve semble truquée" },
  { key: "wrong_date", label: "Mauvaise date", icon: "calendar-outline", description: "Hors période du pact" },
  { key: "not_matching", label: "Ne correspond pas", icon: "close-circle-outline", description: "Ne correspond pas à l'objectif" },
  { key: "cheating", label: "Triche", icon: "warning-outline", description: "Le participant a triché" },
  { key: "other", label: "Autre", icon: "ellipsis-horizontal-outline", description: "Autre raison" },
];

export default function CreateDisputeModal({
  visible,
  onClose,
  proofId,
  userId,
  targetUserName = "ce participant",
  challengeTitle = "ce pact",
}: CreateDisputeModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDispute = useMutation(api.disputes.createDispute);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Erreur", "Sélectionne un motif de contestation");
      return;
    }

    if (description.trim().length < 20) {
      Alert.alert("Erreur", "Ta description doit faire au moins 20 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      await createDispute({
        proofId,
        disputerId: userId,
        reason: selectedReason,
        description: description.trim(),
        evidence: evidence.trim() || undefined,
      });

      Alert.alert(
        "Contestation créée",
        "Ta contestation a été envoyée. Un administrateur PACT l'examinera.",
        [{ text: "OK", onPress: onClose }]
      );

      // Reset form
      setSelectedReason(null);
      setDescription("");
      setEvidence("");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de créer la contestation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason(null);
    setDescription("");
    setEvidence("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Contester une preuve</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              Tu contestes la preuve de <Text style={styles.bold}>{targetUserName}</Text> pour{" "}
              <Text style={styles.bold}>"{challengeTitle}"</Text>
            </Text>
          </View>

          {/* Reason Selection */}
          <Text style={styles.sectionTitle}>Motif de la contestation</Text>
          <View style={styles.reasonsGrid}>
            {DISPUTE_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.key && styles.reasonCardSelected,
                ]}
                onPress={() => setSelectedReason(reason.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.reasonIcon,
                  selectedReason === reason.key && styles.reasonIconSelected,
                ]}>
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={selectedReason === reason.key ? Colors.white : Colors.accent}
                  />
                </View>
                <Text style={[
                  styles.reasonLabel,
                  selectedReason === reason.key && styles.reasonLabelSelected,
                ]}>
                  {reason.label}
                </Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Explique pourquoi tu contestes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Décris en détail pourquoi tu penses que cette preuve est invalide..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>
            {description.length}/20 caractères minimum
          </Text>

          {/* Evidence (optional) */}
          <Text style={styles.sectionTitle}>Preuves supplémentaires (optionnel)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ajoute un lien ou une explication pour appuyer ta contestation..."
            placeholderTextColor={Colors.textMuted}
            value={evidence}
            onChangeText={setEvidence}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isSubmitting}
          />

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} />
            <Text style={styles.warningText}>
              Les contestations abusives peuvent entraîner des sanctions. Assure-toi d'avoir des raisons valables.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedReason || description.length < 20 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || description.length < 20 || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="flag-outline" size={20} color={Colors.white} />
                <Text style={styles.submitButtonText}>Soumettre la contestation</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "600",
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Reasons grid
  reasonsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  reasonCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  reasonIconSelected: {
    backgroundColor: Colors.accent,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  reasonLabelSelected: {
    color: Colors.accent,
  },
  reasonDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
    maxWidth: 100,
    textAlign: "right",
  },

  // Text area
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "right",
    marginBottom: Spacing.lg,
  },

  // Warning
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 18,
  },

  // Submit button
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
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
