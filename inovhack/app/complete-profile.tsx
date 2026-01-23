/**
 * Complete Profile Screen
 * Shown after OAuth signup to set username
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";

export default function CompleteProfileScreen() {
  const { user, userId } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const updateUser = useMutation(api.users.updateUser);

  // Check if username is already taken
  const existingUser = useQuery(
    api.users.getUserByUsername,
    username.length >= 3 ? { username: username.toLowerCase().trim() } : "skip"
  );

  // If user already has username, redirect
  useEffect(() => {
    if (user?.username) {
      router.replace("/(tabs)/home");
    }
  }, [user?.username]);

  const isUsernameTaken = existingUser !== null && existingUser !== undefined && existingUser._id !== userId;
  const isUsernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);

  const handleContinue = async () => {
    if (!userId || !isUsernameValid) return;

    if (isUsernameTaken) {
      Alert.alert("Erreur", "Ce pseudo est déjà pris");
      return;
    }

    setLoading(true);
    try {
      await updateUser({
        userId,
        username: username.toLowerCase().trim(),
      });
      router.replace("/setup-profile");
    } catch (error: any) {
      console.error("Error updating username:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le pseudo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.title}>Choisis ton pseudo</Text>
            <Text style={styles.subtitle}>
              C'est comme ça que les autres te verront sur PACT
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pseudo</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tonpseudo"
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ""))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  autoFocus
                />
              </View>

              {/* Validation feedback */}
              {username.length > 0 && (
                <View style={styles.feedback}>
                  {username.length < 3 ? (
                    <Text style={styles.feedbackError}>Minimum 3 caractères</Text>
                  ) : isUsernameTaken ? (
                    <Text style={styles.feedbackError}>Ce pseudo est déjà pris</Text>
                  ) : isUsernameValid ? (
                    <Text style={styles.feedbackSuccess}>Pseudo disponible</Text>
                  ) : null}
                </View>
              )}
            </View>

            <Text style={styles.hint}>
              Uniquement lettres, chiffres et underscore (_)
            </Text>

            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading || !isUsernameValid || isUsernameTaken}
              style={[
                styles.primaryButton,
                (loading || !isUsernameValid || isUsernameTaken) && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* User info preview */}
          {user && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.previewSection}>
              <Text style={styles.previewLabel}>Connecté en tant que</Text>
              <Text style={styles.previewName}>{user.name}</Text>
              <Text style={styles.previewEmail}>{user.email}</Text>
            </Animated.View>
          )}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displaySmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Form
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputPrefix: {
    ...Typography.bodyLarge,
    color: Colors.textTertiary,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  feedback: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  feedbackError: {
    ...Typography.bodySmall,
    color: Colors.danger,
  },
  feedbackSuccess: {
    ...Typography.bodySmall,
    color: Colors.success,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },

  // Button
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontWeight: "600",
  },

  // Preview
  previewSection: {
    marginTop: Spacing.xxl,
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
  },
  previewLabel: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  previewName: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  previewEmail: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
});
