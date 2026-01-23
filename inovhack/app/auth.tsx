/**
 * Authentication Screen - PACT Design System
 * Email+Password with username
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
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";

// Calculate age from birthdate
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";

type AuthMode = "signin" | "signup" | "verify" | "forgot" | "reset";

export default function AuthScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);

  // Age verification
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Legal warning popup after signup
  const [showLegalWarning, setShowLegalWarning] = useState(false);
  const [pendingSession, setPendingSession] = useState<string | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      // Will be redirected by AuthProvider/NavigationHandler
      router.replace("/(tabs)/home");
    }
  }, [isSignedIn]);

  // Email Sign In
  const handleEmailSignIn = async () => {
    if (!isSignInLoaded || !signIn || loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Erreur", "Connexion impossible");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorCode = error.errors?.[0]?.code;
      if (errorCode === "form_identifier_not_found") {
        Alert.alert("Erreur", "Aucun compte avec cet email");
      } else if (errorCode === "form_password_incorrect") {
        Alert.alert("Erreur", "Mot de passe incorrect");
      } else {
        Alert.alert("Erreur", error.errors?.[0]?.message || "Connexion impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Sign Up with username
  const handleEmailSignUp = async () => {
    if (!isSignUpLoaded || !signUp || loading) return;

    // Validation
    if (!firstName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert("Erreur", "Le pseudo doit faire entre 3 et 20 caractères");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Erreur", "Le pseudo ne peut contenir que des lettres, chiffres et underscore");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    // Age verification
    if (!birthDate) {
      Alert.alert("Erreur", "Entre ta date de naissance");
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 18) {
      Alert.alert(
        "Accès refusé",
        "Tu dois avoir 18 ans ou plus pour utiliser PACT. Cette app implique des engagements financiers."
      );
      return;
    }

    if (!ageConfirmed) {
      Alert.alert("Erreur", "Tu dois confirmer avoir 18 ans ou plus");
      return;
    }

    setLoading(true);
    try {
      // Create Clerk account with username and birthDate in unsafeMetadata
      await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        username: username.toLowerCase().trim(), // Clerk also stores username
        unsafeMetadata: {
          username: username.toLowerCase().trim(),
          birthDate: birthDate.getTime(),
          ageVerified: true,
          ageVerifiedAt: Date.now(),
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setMode("verify");
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorCode = error.errors?.[0]?.code;
      if (errorCode === "form_identifier_exists") {
        Alert.alert("Erreur", "Un compte existe déjà avec cet email");
      } else if (errorCode === "form_username_exists") {
        Alert.alert("Erreur", "Ce pseudo est déjà pris");
      } else if (errorCode === "form_password_pwned") {
        Alert.alert("Erreur", "Ce mot de passe est trop commun");
      } else {
        Alert.alert("Erreur", error.errors?.[0]?.message || "Inscription impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify Email
  const handleVerifyEmail = async () => {
    if (!isSignUpLoaded || !signUp || loading) return;

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      Alert.alert("Erreur", "Entre le code à 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      console.log("[Verify] Current signUp status:", signUp.status);

      // Check if already verified
      if (signUp.status === "complete") {
        console.log("[Verify] Already complete, activating session...");
        await setSignUpActive({ session: signUp.createdSessionId });
        router.replace("/setup-profile");
        return;
      }

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log("[Verify] Result status:", result.status);
      console.log("[Verify] Result:", JSON.stringify(result, null, 2));

      if (result.status === "complete") {
        console.log("[Verify] Complete! Showing legal warning...");
        setPendingSession(result.createdSessionId || null);
        setShowLegalWarning(true);
      } else if (result.status === "missing_requirements") {
        // Email verified but missing other requirements - this is OK, proceed
        console.log("[Verify] Missing requirements but email verified, checking session...");
        if (result.createdSessionId) {
          setPendingSession(result.createdSessionId);
          setShowLegalWarning(true);
        } else {
          // Try to complete signup
          const completeResult = await signUp.create({});
          console.log("[Verify] Complete result:", completeResult.status);
          if (completeResult.createdSessionId) {
            setPendingSession(completeResult.createdSessionId);
            setShowLegalWarning(true);
          } else {
            Alert.alert("Erreur", "Inscription incomplète. Réessaie.");
          }
        }
      } else {
        console.log("[Verify] Unknown status:", result.status);
        Alert.alert("Erreur", `Statut: ${result.status}. Réessaie.`);
      }
    } catch (error: any) {
      console.error("[Verify] Error:", error);
      const errorCode = error.errors?.[0]?.code;
      const errorMessage = error.errors?.[0]?.message;

      // Handle "already verified"
      if (errorCode === "verification_already_verified" ||
          error.message?.includes("already been verified")) {
        try {
          console.log("[Verify] Already verified, showing legal warning...");
          setPendingSession(signUp.createdSessionId || null);
          setShowLegalWarning(true);
        } catch (e) {
          Alert.alert("Erreur", "Session expirée. Reconnecte-toi.");
          setMode("signin");
          setPendingVerification(false);
        }
        return;
      }

      if (errorCode === "form_code_incorrect") {
        Alert.alert("Erreur", "Code incorrect");
      } else {
        Alert.alert("Erreur", errorMessage || "Vérification impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isSignUpLoaded || !signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Alert.alert("Envoyé", "Un nouveau code a été envoyé");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de renvoyer le code");
    }
  };

  // Handle legal warning acceptance
  const handleAcceptLegalWarning = async () => {
    if (pendingSession && setSignUpActive) {
      try {
        await setSignUpActive({ session: pendingSession });
        setShowLegalWarning(false);
        setPendingSession(null);
        router.replace("/setup-profile");
      } catch (error) {
        console.error("Error activating session:", error);
        Alert.alert("Erreur", "Impossible d'activer la session. Réessaie.");
      }
    }
  };

  // Forgot Password - Send reset code
  const handleForgotPassword = async () => {
    if (!isSignInLoaded || !signIn || loading) return;

    if (!email.trim()) {
      Alert.alert("Erreur", "Entre ton adresse email");
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setPendingPasswordReset(true);
      setMode("reset");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorCode = error.errors?.[0]?.code;
      if (errorCode === "form_identifier_not_found") {
        Alert.alert("Erreur", "Aucun compte avec cet email");
      } else {
        Alert.alert("Erreur", error.errors?.[0]?.message || "Impossible d'envoyer le code");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset Password - Verify code and set new password
  const handleResetPassword = async () => {
    if (!isSignInLoaded || !signIn || loading) return;

    if (!resetCode.trim() || resetCode.length !== 6) {
      Alert.alert("Erreur", "Entre le code à 6 chiffres");
      return;
    }

    if (!newPassword.trim() || newPassword.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword.trim(),
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        Alert.alert("Succès", "Ton mot de passe a été réinitialisé");
        router.replace("/(tabs)/home");
      } else if (result.status === "needs_second_factor") {
        Alert.alert("Erreur", "Authentification à deux facteurs requise");
      } else {
        Alert.alert("Erreur", "Réinitialisation impossible");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorCode = error.errors?.[0]?.code;
      if (errorCode === "form_code_incorrect") {
        Alert.alert("Erreur", "Code incorrect");
      } else if (errorCode === "form_password_pwned") {
        Alert.alert("Erreur", "Ce mot de passe est trop commun");
      } else {
        Alert.alert("Erreur", error.errors?.[0]?.message || "Réinitialisation impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend reset code
  const handleResendResetCode = async () => {
    if (!isSignInLoaded || !signIn) return;

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      Alert.alert("Envoyé", "Un nouveau code a été envoyé");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de renvoyer le code");
    }
  };

  // Forgot Password screen
  if (mode === "forgot") {
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
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setMode("signin");
                  setEmail("");
                }}
                style={styles.backLink}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textTertiary} />
                <Text style={styles.backLinkText}>Retour</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.verifySection}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-open-outline" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Entre ton email pour recevoir un code de réinitialisation
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ton@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading || !email.trim()}
                style={[
                  styles.primaryButton,
                  (loading || !email.trim()) && styles.primaryButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Envoyer le code</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Reset Password screen (after receiving code)
  if (mode === "reset" && pendingPasswordReset) {
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
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setMode("forgot");
                  setPendingPasswordReset(false);
                  setResetCode("");
                  setNewPassword("");
                }}
                style={styles.backLink}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textTertiary} />
                <Text style={styles.backLinkText}>Retour</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.verifySection}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Un code a été envoyé à
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code de vérification</Text>
                <View style={styles.codeInputContainer}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="000000"
                    placeholderTextColor={Colors.textLight}
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={Colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading || resetCode.length !== 6 || newPassword.length < 8}
                style={[
                  styles.primaryButton,
                  (loading || resetCode.length !== 6 || newPassword.length < 8) && styles.primaryButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Réinitialiser</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendResetCode} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Legal Warning Modal (shown after email verification)
  const LegalWarningModal = () => (
    <Modal
      visible={showLegalWarning}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.legalModalOverlay}>
        <View style={styles.legalModalContent}>
          <View style={styles.legalIconCircle}>
            <Ionicons name="warning-outline" size={40} color={Colors.warning} />
          </View>

          <Text style={styles.legalModalTitle}>Avertissement important</Text>

          <Text style={styles.legalModalText}>
            En utilisant PACT, je certifie que :
          </Text>

          <View style={styles.legalBulletList}>
            <View style={styles.legalBulletItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.legalBulletText}>
                J'ai fourni des informations <Text style={styles.legalBold}>véridiques</Text> (identité, date de naissance)
              </Text>
            </View>
            <View style={styles.legalBulletItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.legalBulletText}>
                J'ai <Text style={styles.legalBold}>18 ans ou plus</Text>
              </Text>
            </View>
            <View style={styles.legalBulletItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.legalBulletText}>
                J'utilise <Text style={styles.legalBold}>mon propre moyen de paiement</Text>
              </Text>
            </View>
          </View>

          <View style={styles.legalWarningBox}>
            <Ionicons name="alert-circle" size={24} color={Colors.danger} />
            <Text style={styles.legalWarningText}>
              Toute fraude (fausse identité, utilisation du compte/carte d'un tiers, mineur se faisant passer pour majeur) pourra entraîner la <Text style={styles.legalBold}>suspension définitive du compte</Text> et des <Text style={styles.legalBold}>poursuites judiciaires</Text>.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.legalAcceptButton}
            onPress={handleAcceptLegalWarning}
            activeOpacity={0.8}
          >
            <Text style={styles.legalAcceptButtonText}>
              Je comprends et j'accepte
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Verification screen
  if (mode === "verify" && pendingVerification) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <LegalWarningModal />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setMode("signup");
                  setPendingVerification(false);
                  setVerificationCode("");
                }}
                style={styles.backLink}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.textTertiary} />
                <Text style={styles.backLinkText}>Retour</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.verifySection}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Vérifie ton email</Text>
              <Text style={styles.subtitle}>
                Un code à 6 chiffres a été envoyé à
              </Text>
              <Text style={styles.emailHighlight}>{email}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
              <View style={styles.codeInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor={Colors.textLight}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleVerifyEmail}
                disabled={loading || verificationCode.length !== 6}
                style={[
                  styles.primaryButton,
                  (loading || verificationCode.length !== 6) && styles.primaryButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Vérifier</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResendCode} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main auth screen
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
          {/* Logo Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.logoSection}>
            <Image
              source={require("../assets/images/logo_big.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              {mode === "signin" ? "Content de te revoir" : "Rejoins la communauté"}
            </Text>
          </Animated.View>

          {/* Email Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            {mode === "signup" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ton prénom"
                    placeholderTextColor={Colors.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Pseudo</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.inputPrefix}>@</Text>
                    <TextInput
                      style={styles.inputNoBorder}
                      placeholder="tonpseudo"
                      placeholderTextColor={Colors.textMuted}
                      value={username}
                      onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ""))}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder={mode === "signup" ? "Minimum 8 caractères" : "••••••••"}
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {mode === "signup" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Répète ton mot de passe"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Date de naissance */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date de naissance</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                    <Text style={[styles.datePickerText, birthDate && styles.datePickerTextFilled]}>
                      {birthDate
                        ? birthDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : "Sélectionne ta date de naissance"}
                    </Text>
                  </TouchableOpacity>
                  {birthDate && calculateAge(birthDate) < 18 && (
                    <Text style={styles.ageWarning}>
                      Tu dois avoir 18 ans ou plus pour utiliser PACT
                    </Text>
                  )}
                </View>

                {/* DateTimePicker - Inline pour iOS, Dialog pour Android */}
                {showDatePicker && Platform.OS === "ios" && (
                  <View style={styles.datePickerInline}>
                    <DateTimePicker
                      value={birthDate || new Date(2000, 0, 1)}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setBirthDate(selectedDate);
                        }
                      }}
                      maximumDate={new Date()}
                      minimumDate={new Date(1920, 0, 1)}
                      style={{ height: 150 }}
                      textColor={Colors.textPrimary}
                    />
                    <TouchableOpacity
                      style={styles.datePickerDoneButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Valider</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {showDatePicker && Platform.OS === "android" && (
                  <DateTimePicker
                    value={birthDate || new Date(2000, 0, 1)}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (event.type === "set" && selectedDate) {
                        setBirthDate(selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                  />
                )}

                {/* Checkbox 18+ */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgeConfirmed(!ageConfirmed)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                    {ageConfirmed && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Je certifie avoir 18 ans ou plus et j'accepte les{" "}
                    <Text style={styles.checkboxLink} onPress={() => router.push("/legal/terms")}>
                      CGU
                    </Text>
                    {" "}et la{" "}
                    <Text style={styles.checkboxLink} onPress={() => router.push("/legal/privacy")}>
                      Politique de confidentialité
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === "signin" && (
              <TouchableOpacity
                onPress={() => setMode("forgot")}
                style={styles.forgotPasswordLink}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === "signin" ? "Se connecter" : "Créer mon compte"}
                </Text>
              )}
            </TouchableOpacity>

          </Animated.View>

          {/* Toggle Mode */}
          <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.toggleSection}>
            <Text style={styles.toggleText}>
              {mode === "signin" ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.toggleLink}>
                {mode === "signin" ? "S'inscrire" : "Se connecter"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    marginBottom: Spacing.lg,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  backLinkText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  // Verify
  verifySection: {
    alignItems: "center",
    marginTop: Spacing.lg,
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
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emailHighlight: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginTop: Spacing.xs,
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithPrefix: {
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
  inputNoBorder: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  codeInputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 12,
  },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
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
  linkButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  linkButtonText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textDecorationLine: "underline",
  },

  // Toggle
  toggleSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  toggleText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  toggleLink: {
    ...Typography.bodyMedium,
    color: Colors.accent,
    fontWeight: "600",
  },

  // Forgot Password
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: -Spacing.xs,
  },
  forgotPasswordText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },

  // Date picker
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  datePickerText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    flex: 1,
  },
  datePickerTextFilled: {
    color: Colors.textPrimary,
  },
  datePickerDoneText: {
    ...Typography.labelMedium,
    color: Colors.white,
    fontWeight: "600",
  },
  ageWarning: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  checkboxLink: {
    color: Colors.accent,
    fontWeight: "500",
  },

  // Date Picker Inline (iOS)
  datePickerInline: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    overflow: "hidden",
  },
  datePickerDoneButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  // Legal Warning Modal
  legalModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  legalModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Shadows.lg,
  },
  legalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.warningMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  legalModalTitle: {
    ...Typography.displaySmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  legalModalText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  legalBulletList: {
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  legalBulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  legalBulletText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  legalBold: {
    fontWeight: "700",
  },
  legalWarningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    width: "100%",
  },
  legalWarningText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    flex: 1,
    lineHeight: 20,
  },
  legalAcceptButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: "100%",
    alignItems: "center",
    ...Shadows.sm,
  },
  legalAcceptButtonText: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontWeight: "600",
  },
});
