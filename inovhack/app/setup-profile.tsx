/**
 * Setup Profile Screen
 * Shown after signup to configure profile (photo, bio)
 * Has skip button for those who want to do it later
 */

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
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";

export default function SetupProfileScreen() {
  const { user, userId } = useAuth();
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralReferrer, setReferralReferrer] = useState<string | null>(null);

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const saveProfileImage = useMutation(api.users.saveProfileImage);
  const applyReferralCode = useMutation(api.referrals.applyReferralCode);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "Autorise l'accès aux photos pour changer ta photo de profil");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "Autorise l'accès à la caméra pour prendre une photo");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Erreur", "Impossible de prendre la photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Photo de profil",
      "Comment veux-tu ajouter ta photo ?",
      [
        { text: "Prendre une photo", onPress: handleTakePhoto },
        { text: "Choisir dans la galerie", onPress: handlePickImage },
        { text: "Annuler", style: "cancel" },
      ]
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage || !userId) return null;

    try {
      setUploadingImage(true);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the image
      const response = await fetch(profileImage);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await uploadResponse.json();

      // Save to user profile
      await saveProfileImage({ userId, storageId });

      return storageId;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCheckReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralValid(null);
      setReferralReferrer(null);
      return;
    }

    try {
      // We'll use the applyReferralCode to check validity
      // But for now, just set as valid if it's 6 chars
      const code = referralCode.toUpperCase().trim();
      if (code.length === 6) {
        setReferralValid(true);
      } else {
        setReferralValid(false);
      }
    } catch (error) {
      setReferralValid(false);
    }
  };

  const handleContinue = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Upload image if selected
      if (profileImage) {
        await uploadImage();
      }

      // Update bio if provided
      if (bio.trim()) {
        await updateProfile({
          userId,
          bio: bio.trim(),
        });
      }

      // Apply referral code if provided and valid
      if (referralCode.trim() && referralValid) {
        try {
          await applyReferralCode({
            userId,
            referralCode: referralCode.toUpperCase().trim(),
          });
        } catch (error: any) {
          // Don't block the flow, just log the error
          console.log("Referral code error:", error.message);
        }
      }

      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Skip Button */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerSection}>
            <Text style={styles.title}>Personnalise ton profil</Text>
            <Text style={styles.subtitle}>
              Ajoute une photo et une bio pour que les autres te reconnaissent
            </Text>
          </Animated.View>

          {/* Profile Photo */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.photoSection}>
            <TouchableOpacity
              onPress={showImageOptions}
              style={styles.photoButton}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.photoEditBadge}>
                <Ionicons name="pencil" size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Touche pour ajouter une photo</Text>
          </Animated.View>

          {/* User Info */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
            {user?.username && (
              <Text style={styles.userUsername}>@{user.username}</Text>
            )}
          </Animated.View>

          {/* Bio */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.bioInput}
                placeholder="Parle un peu de toi... (optionnel)"
                placeholderTextColor={Colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={160}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/160</Text>
            </View>

            {/* Referral Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Code de parrainage (optionnel)</Text>
              <View style={styles.referralInputRow}>
                <TextInput
                  style={[
                    styles.referralInput,
                    referralValid === true && styles.referralInputValid,
                    referralValid === false && styles.referralInputInvalid,
                  ]}
                  placeholder="Ex: ABC123"
                  placeholderTextColor={Colors.textMuted}
                  value={referralCode}
                  onChangeText={(text) => {
                    setReferralCode(text.toUpperCase());
                    if (text.length === 6) {
                      setReferralValid(true);
                    } else if (text.length > 0) {
                      setReferralValid(false);
                    } else {
                      setReferralValid(null);
                    }
                  }}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                {referralValid === true && (
                  <View style={styles.referralValidIcon}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  </View>
                )}
              </View>
              <Text style={styles.referralHint}>
                Tu as un code ? Entre-le pour recevoir 2€ de bonus !
              </Text>
            </View>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.buttonSection}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading || uploadingImage}
              style={[
                styles.primaryButton,
                (loading || uploadingImage) && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              {loading || uploadingImage ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Terminer</Text>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.laterButton}>
              <Text style={styles.laterButtonText}>Je ferai ça plus tard</Text>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Skip
  skipContainer: {
    position: "absolute",
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
  },

  // Header
  headerSection: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
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
    paddingHorizontal: Spacing.lg,
  },

  // Photo
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  photoButton: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceHighlight,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  photoHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // User Info
  userInfo: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  userName: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  userUsername: {
    ...Typography.bodyMedium,
    color: Colors.accent,
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
  bioInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
  },
  charCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: Spacing.xs,
  },

  // Referral
  referralInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  referralInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  referralInputValid: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}10`,
  },
  referralInputInvalid: {
    borderColor: Colors.error,
  },
  referralValidIcon: {
    marginLeft: Spacing.sm,
  },
  referralHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Buttons
  buttonSection: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
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
  laterButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  laterButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textDecorationLine: "underline",
  },
});
