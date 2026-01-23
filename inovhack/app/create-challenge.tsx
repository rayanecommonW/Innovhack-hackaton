/**
 * Create Challenge Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 * With precise end date/time picker (Paris timezone)
 */

import React, { useState, useMemo } from "react";
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import CategoryPickerModal from "../components/CategoryPickerModal";
import { CATEGORIES, getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getErrorMessage } from "../utils/errorHandler";

type PactType = "public" | "friends";

// Format date in French
const formatDateFr = (date: Date): string => {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${dayName} ${day} ${month} à ${hours}h${minutes}`;
};

export default function CreateChallengeScreen() {
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ title?: string; category?: string; minBet?: string }>();

  const createPact = useAction(api.challenges.createPactSimple);
  const autoSelectCategory = useAction(api.challenges.autoSelectCategory);

  const [title, setTitle] = useState(params.title || "");
  const [category, setCategory] = useState<string | null>(params.category || null);
  const [pactType, setPactType] = useState<PactType>("public");
  const [minBet, setMinBet] = useState(params.minBet || "10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  // Date/Time picker state
  const defaultEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default: 7 jours
    date.setHours(20, 0, 0, 0); // Default: 20h00
    return date;
  }, []);

  const [endDate, setEndDate] = useState(defaultEndDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  // Minimum end date: tomorrow
  const minEndDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }, []);

  // Auto-select category when title changes (with debounce via blur)
  const handleTitleBlur = async () => {
    if (!title.trim() || title.length < 3 || category) return;

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
      // Calculate duration in days from now to endDate
      const now = Date.now();
      const durationMs = endDate.getTime() - now;
      const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));

      const result = await createPact({
        title: title.trim(),
        category,
        type: pactType,
        creatorId: userId,
        minBet: parseInt(minBet) || 10,
        durationDays,
        endTimestamp: endDate.getTime(), // Pass precise end timestamp
      });

      // If friends pact, show invite code
      if (result.inviteCode) {
        setCreatedInviteCode(result.inviteCode);
      } else {
        router.back();
      }
    } catch (err) {
      Alert.alert("Oups!", getErrorMessage(err));
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
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Pact créé</Text>
            <Text style={styles.successSubtitle}>Partage ce code avec tes amis</Text>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{createdInviteCode}</Text>
            </View>

            <TouchableOpacity onPress={handleShareCode} style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={Colors.white} />
              <Text style={styles.shareButtonText}>Partager le code</Text>
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
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Créer un pact</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titre du défi</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Courir 5km chaque jour"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              onBlur={handleTitleBlur}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={styles.categoryButton}
            >
              {isAutoSelecting ? (
                <View style={styles.categoryLoading}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={styles.categoryLoadingText}>Sélection auto...</Text>
                </View>
              ) : category ? (
                <View style={styles.categorySelected}>
                  <View style={styles.categoryDot} />
                  <Text style={styles.categoryButtonText}>
                    {getCategoryName(category)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.categoryButtonPlaceholder}>
                  Choisir une catégorie
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Type (Public/Friends) */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type de pact</Text>
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
                  size={22}
                  color={pactType === "public" ? Colors.white : Colors.textSecondary}
                />
                <Text style={[
                  styles.typeButtonText,
                  pactType === "public" && styles.typeButtonTextSelected,
                ]}>
                  Public
                </Text>
                <Text style={[
                  styles.typeButtonSubtext,
                  pactType === "public" && styles.typeButtonSubtextSelected,
                ]}>
                  Tout le monde
                </Text>
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
                  size={22}
                  color={pactType === "friends" ? Colors.white : Colors.textSecondary}
                />
                <Text style={[
                  styles.typeButtonText,
                  pactType === "friends" && styles.typeButtonTextSelected,
                ]}>
                  Amis
                </Text>
                <Text style={[
                  styles.typeButtonSubtext,
                  pactType === "friends" && styles.typeButtonSubtextSelected,
                ]}>
                  Sur invitation
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Min Bet */}
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Engagement minimum</Text>
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={styles.inputInner}
                placeholder="10"
                placeholderTextColor={Colors.textMuted}
                value={minBet}
                onChangeText={setMinBet}
                keyboardType="numeric"
              />
              <View style={styles.inputSuffix}>
                <Text style={styles.inputSuffixText}>€</Text>
              </View>
            </View>
          </Animated.View>

          {/* End Date/Time Picker */}
          <Animated.View entering={FadeInDown.delay(170).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date et heure de fin</Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === "ios") {
                  setPickerMode("date");
                  setShowDatePicker(!showDatePicker);
                } else {
                  setPickerMode("date");
                  setShowDatePicker(true);
                }
              }}
              style={styles.datePickerButton}
            >
              <View style={styles.datePickerContent}>
                <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
                <Text style={styles.datePickerText}>{formatDateFr(endDate)}</Text>
              </View>
              <Ionicons name={showDatePicker && Platform.OS === "ios" ? "chevron-up" : "chevron-down"} size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* iOS Inline Date Picker */}
            {Platform.OS === "ios" && showDatePicker && (
              <Animated.View entering={FadeInDown.duration(200)} style={styles.inlineDatePicker}>
                {/* Mode Toggle */}
                <View style={styles.dateTimeToggle}>
                  <TouchableOpacity
                    onPress={() => setPickerMode("date")}
                    style={[styles.toggleButton, pickerMode === "date" && styles.toggleButtonActive]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={pickerMode === "date" ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.toggleButtonText, pickerMode === "date" && styles.toggleButtonTextActive]}>Date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPickerMode("time")}
                    style={[styles.toggleButton, pickerMode === "time" && styles.toggleButtonActive]}
                  >
                    <Ionicons name="time-outline" size={18} color={pickerMode === "time" ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.toggleButtonText, pickerMode === "time" && styles.toggleButtonTextActive]}>Heure</Text>
                  </TouchableOpacity>
                </View>

                <DateTimePicker
                  value={endDate}
                  mode={pickerMode}
                  display="spinner"
                  minimumDate={minEndDate}
                  locale="fr-FR"
                  onChange={(event, date) => {
                    if (date) setEndDate(date);
                  }}
                  style={{ height: 150 }}
                  textColor={Colors.textPrimary}
                  themeVariant="light"
                />

                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Valider</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <Text style={styles.datePickerHint}>
              Les participants auront jusqu'à cette date pour soumettre leurs preuves
            </Text>
          </Animated.View>

          {/* Date Picker (Android) */}
          {Platform.OS === "android" && showDatePicker && (
            <DateTimePicker
              value={endDate}
              mode={pickerMode}
              display="spinner"
              minimumDate={minEndDate}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (event.type === "set" && date) {
                  setEndDate(date);
                  if (pickerMode === "date") {
                    // Show time picker after date
                    setTimeout(() => {
                      setPickerMode("time");
                      setShowDatePicker(true);
                    }, 100);
                  }
                }
              }}
            />
          )}

          {/* Info Box */}
          <Animated.View entering={FadeInDown.delay(170).duration(400)} style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              {pactType === "friends"
                ? "Un code d'invitation sera généré pour partager avec tes amis."
                : "Ton pact sera visible par tout le monde dans l'Explorer."
              }
            </Text>
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !title.trim() || !category}
              style={[
                styles.submitButton,
                (isSubmitting || !title.trim() || !category) && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="add" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Créer le pact</Text>
                </>
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

  // Input Groups
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textPrimary,
    ...Shadows.xs,
  },

  // Category Button
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadows.xs,
  },
  categoryLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryLoadingText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  categorySelected: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  categoryButtonPlaceholder: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textMuted,
  },

  // Type Row
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    ...Shadows.xs,
  },
  typeButtonSelected: {
    backgroundColor: Colors.accent,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  typeButtonTextSelected: {
    color: Colors.white,
  },
  typeButtonSubtext: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  typeButtonSubtextSelected: {
    color: "rgba(255,255,255,0.7)",
  },

  // Row Inputs
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.xs,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  inputSuffix: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopRightRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  inputSuffixText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    color: Colors.info,
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

  // Date Picker
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadows.xs,
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  datePickerHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  // Inline Date Picker (iOS)
  inlineDatePicker: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  dateTimeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  datePickerDoneButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },

  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  successContent: {
    alignItems: "center",
    width: "100%",
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  codeContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.accent,
    letterSpacing: 6,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    width: "100%",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  doneButton: {
    paddingVertical: Spacing.md,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
});
