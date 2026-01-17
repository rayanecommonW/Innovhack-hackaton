import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

type ValidationState = "idle" | "validating" | "approved" | "rejected";

export default function SubmitProofScreen() {
  const { participationId } = useLocalSearchParams<{ participationId: string }>();

  const participation = useQuery(
    api.proofs.getParticipationForProof,
    participationId ? { participationId: participationId as Id<"participations"> } : "skip"
  );

  const challenge = useQuery(
    api.challenges.getChallenge,
    participation?.challengeId ? { challengeId: participation.challengeId } : "skip"
  );

  const existingProof = useQuery(
    api.proofs.getProofByParticipation,
    participationId ? { participationId: participationId as Id<"participations"> } : "skip"
  );

  const submitProof = useAction(api.proofs.submitAndValidateProof);

  const [proofContent, setProofContent] = useState("");
  const [proofValue, setProofValue] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationResult, setValidationResult] = useState<{ approved: boolean; comment: string } | null>(null);

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (validationState === "validating") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [validationState]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleSubmit = async () => {
    if (!participationId) {
      Alert.alert("Erreur", "Erreur de participation");
      return;
    }

    if (!proofContent.trim() && !proofValue) {
      Alert.alert("Erreur", "Fournis une preuve");
      return;
    }

    setValidationState("validating");

    try {
      const res = await submitProof({
        participationId: participationId as Id<"participations">,
        proofContent: proofContent.trim() || `Valeur: ${proofValue}`,
        proofValue: proofValue ? parseInt(proofValue) : undefined,
      });

      setValidationResult(res.validation);
      setValidationState(res.validation.approved ? "approved" : "rejected");
    } catch (err: any) {
      setValidationState("idle");
      Alert.alert("Erreur", err.message || "Erreur");
    }
  };

  if (!challenge || !participation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Validating State
  if (validationState === "validating") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={[styles.spinner, spinnerStyle]}>
            <View style={styles.spinnerInner} />
          </Animated.View>
          <Text style={styles.validatingTitle}>Validation en cours</Text>
          <Text style={styles.validatingSubtitle}>L'IA analyse ta preuve...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result State
  if (validationState === "approved" || validationState === "rejected") {
    const isApproved = validationResult?.approved;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : "close-circle"}
            size={64}
            color={isApproved ? Colors.success : Colors.danger}
          />
          <Text style={[styles.resultTitle, { color: isApproved ? Colors.success : Colors.danger }]}>
            {isApproved ? "Validé" : "Rejeté"}
          </Text>
          <Text style={styles.resultComment}>{validationResult?.comment}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Existing Proof State
  if (existingProof) {
    const isApproved = existingProof.aiValidation === "approved";
    const isPending = existingProof.aiValidation === "pending";
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : isPending ? "time" : "close-circle"}
            size={64}
            color={isApproved ? Colors.success : isPending ? Colors.warning : Colors.danger}
          />
          <Text style={[styles.resultTitle, { color: isApproved ? Colors.success : isPending ? Colors.warning : Colors.danger }]}>
            {isApproved ? "Validé" : isPending ? "En attente" : "Rejeté"}
          </Text>
          <Text style={styles.resultComment}>{existingProof.aiComment}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Form State
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soumettre</Text>
        </Animated.View>

        {/* Challenge Info */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeGoal}>{challenge.goal}</Text>
        </Animated.View>

        {/* Value Input */}
        {challenge.goalValue && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VALEUR ({challenge.goalUnit})</Text>
            <View style={styles.valueInputContainer}>
              <TextInput
                style={styles.valueInput}
                placeholder={challenge.goalValue.toString()}
                placeholderTextColor={Colors.textTertiary}
                value={proofValue}
                onChangeText={setProofValue}
                keyboardType="numeric"
              />
              <Text style={styles.valueUnit}>{challenge.goalUnit}</Text>
            </View>
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DESCRIPTION</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Décris ta preuve..."
            placeholderTextColor={Colors.textTertiary}
            value={proofContent}
            onChangeText={setProofContent}
            multiline
            numberOfLines={4}
          />
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Soumettre</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.info,
    borderTopColor: "transparent",
    marginBottom: Spacing.lg,
  },
  spinnerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.info,
    position: "absolute",
    top: -4,
    left: "50%",
    marginLeft: -4,
  },
  validatingTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  validatingSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  resultTitle: {
    ...Typography.headlineLarge,
  },
  resultComment: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  backButtonLarge: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
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
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  challengeGoal: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  valueInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueInput: {
    flex: 1,
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    padding: 0,
    textAlign: "center",
  },
  valueUnit: {
    ...Typography.labelLarge,
    color: Colors.textTertiary,
    marginLeft: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
});
