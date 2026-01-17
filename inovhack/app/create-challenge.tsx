import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import CategoryPickerModal from "../components/CategoryPickerModal";
import { CATEGORIES, getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

type PactType = "public" | "friends";

export default function CreateChallengeScreen() {
  const { userId } = useAuth();
  const createPact = useAction(api.challenges.createPactSimple);
  const autoSelectCategory = useAction(api.challenges.autoSelectCategory);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [pactType, setPactType] = useState<PactType>("public");
  const [minBet, setMinBet] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  // Auto-select category when title changes (with debounce via blur)
  const handleTitleBlur = async () => {
    if (!title.trim() || title.length < 3) return;

    setIsAutoSelecting(true);
    try {
      const selectedCategory = await autoSelectCategory({
        title: title.trim(),
        categories: CATEGORIES,
      });
      setCategory(selectedCategory);
    } catch (err) {
      // Fallback silently
    } finally {
      setIsAutoSelecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Connexion requise");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Erreur", "Ajoute un titre");
      return;
    }

    if (!category) {
      Alert.alert("Erreur", "Choisis une catégorie");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createPact({
        title: title.trim(),
        category,
        type: pactType,
        creatorId: userId,
        minBet: parseInt(minBet) || 10,
        durationDays: parseInt(durationDays) || 7,
      });

      // If friends pact, show invite code
      if (result.inviteCode) {
        setCreatedInviteCode(result.inviteCode);
      } else {
        router.back();
      }
    } catch (err) {
      Alert.alert("Erreur", "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareCode = async () => {
    if (!createdInviteCode) return;

    try {
      await Share.share({
        message: `Rejoins mon Pact "${title}" avec le code: ${createdInviteCode}`,
      });
    } catch (err) {
      // Ignore
    }
  };

  const handleDone = () => {
    setCreatedInviteCode(null);
    router.back();
  };

  // Success screen with invite code
  if (createdInviteCode) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.springify()} style={styles.successContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Pact créé</Text>
            <Text style={styles.successSubtitle}>Partage ce code avec tes amis</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{createdInviteCode}</Text>
            </View>

            <TouchableOpacity onPress={handleShareCode} style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={Colors.black} />
              <Text style={styles.shareButtonText}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Terminé</Text>
            </TouchableOpacity>
          </Animated.View>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Créer</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TITRE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Courir 5km chaque jour"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              onBlur={handleTitleBlur}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CATÉGORIE</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={styles.categoryButton}
            >
              {isAutoSelecting ? (
                <ActivityIndicator size="small" color={Colors.textTertiary} />
              ) : category ? (
                <Text style={styles.categoryButtonText}>
                  {getCategoryName(category)}
                </Text>
              ) : (
                <Text style={styles.categoryButtonPlaceholder}>
                  99+ catégories...
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Type (Public/Friends) - Icons only */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TYPE</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setPactType("public")}
                style={[
                  styles.typeButton,
                  pactType === "public" && styles.typeButtonSelected,
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={28}
                  color={pactType === "public" ? Colors.black : Colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPactType("friends")}
                style={[
                  styles.typeButton,
                  pactType === "friends" && styles.typeButtonSelected,
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={pactType === "friends" ? Colors.black : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Min Bet & Duration */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>MISE MIN (€)</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={Colors.textTertiary}
                value={minBet}
                onChangeText={setMinBet}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>DURÉE (JOURS)</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                placeholderTextColor={Colors.textTertiary}
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
              />
            </View>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <Text style={styles.submitButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelect={setCategory}
        selectedCategory={category}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
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
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  categoryButtonPlaceholder: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  bottomSpacer: {
    height: 40,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  successContent: {
    alignItems: "center",
    width: "100%",
  },
  successIcon: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xxl,
  },
  codeContainer: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    width: "100%",
  },
  shareButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  doneButton: {
    paddingVertical: Spacing.lg,
  },
  doneButtonText: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },
});
