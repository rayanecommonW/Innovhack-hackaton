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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

const categories = [
  { id: "sport", name: "Sport" },
  { id: "procrastination", name: "Productivité" },
  { id: "screen_time", name: "Screen Time" },
  { id: "social", name: "Social" },
];

export default function CreateChallengeScreen() {
  const { userId } = useAuth();
  const createChallenge = useAction(api.challenges.createChallengeWithAI);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("sport");
  const [goal, setGoal] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [minBet, setMinBet] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Erreur", "Connexion requise");
      return;
    }

    if (!title.trim() || !goal.trim() || !goalValue || !goalUnit.trim()) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    setIsSubmitting(true);

    try {
      await createChallenge({
        title: title.trim(),
        description: title.trim(),
        category,
        type: "public",
        creatorId: userId,
        goal: goal.trim(),
        goalValue: parseInt(goalValue),
        goalUnit: goalUnit.trim(),
        minBet: parseInt(minBet) || 10,
        durationDays: parseInt(durationDays) || 7,
      });
      router.back();
    } catch (err) {
      Alert.alert("Erreur", "Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              placeholder="Ex: 10K Steps Challenge"
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CATÉGORIE</Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.categoryChip,
                    category === cat.id && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Goal */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OBJECTIF</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Faire 10000 pas par jour"
              placeholderTextColor={Colors.textTertiary}
              value={goal}
              onChangeText={setGoal}
            />
          </Animated.View>

          {/* Goal Value & Unit */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>VALEUR</Text>
              <TextInput
                style={styles.input}
                placeholder="10000"
                placeholderTextColor={Colors.textTertiary}
                value={goalValue}
                onChangeText={setGoalValue}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>UNITÉ</Text>
              <TextInput
                style={styles.input}
                placeholder="pas"
                placeholderTextColor={Colors.textTertiary}
                value={goalUnit}
                onChangeText={setGoalUnit}
              />
            </View>
          </Animated.View>

          {/* Min Bet & Duration */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.rowInputs}>
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
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <Text style={styles.submitButtonText}>Créer le Pact</Text>
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
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  categoryText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.black,
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
});
