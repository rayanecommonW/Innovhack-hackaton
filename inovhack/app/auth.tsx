import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Entre ton email");
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("Erreur", "Entre ton nom");
      return;
    }

    setLoading(true);
    try {
      const success = isLogin
        ? await login(email.trim())
        : await signup(name.trim(), email.trim());

      if (success) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Erreur", "Une erreur est survenue");
      }
    } catch (error) {
      Alert.alert("Erreur", "Connexion impossible");
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
        <View style={styles.content}>
          {/* Back */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
            <Text style={styles.logo}>PACT</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ton nom"
                  placeholderTextColor={Colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? "Connexion" : "Créer"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {isLogin ? "Pas de compte ? Créer" : "Déjà un compte ? Connexion"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.huge,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: Spacing.huge,
  },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 10,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
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
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  toggleText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
});
