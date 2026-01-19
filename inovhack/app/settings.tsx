/**
 * Settings Page
 * Edit profile, notification preferences, blocked users, legal, logout
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import ProfileImagePicker from "../components/ProfileImagePicker";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function SettingsScreen() {
  const { userId, logout } = useAuth();

  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const updateNotifications = useMutation(api.users.updateNotificationPreferences);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setNotificationsEnabled(user.notificationsEnabled ?? true);
      setProfileImageUrl(user.profileImageUrl);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const changed =
        name !== (user.name || "") ||
        username !== (user.username || "") ||
        bio !== (user.bio || "");
      setHasChanges(changed);
    }
  }, [name, username, bio, user]);

  const handleSave = async () => {
    if (!userId || !hasChanges) return;

    setSaving(true);
    try {
      await updateProfile({
        userId,
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setHasChanges(false);
      Alert.alert("Succès", "Votre profil a été mis à jour");
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!userId) return;

    setNotificationsEnabled(enabled);
    try {
      await updateNotifications({
        userId,
        enabled,
      });
    } catch (error) {
      setNotificationsEnabled(!enabled);
      Alert.alert("Erreur", "Impossible de modifier les notifications");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Paramètres</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Paramètres</Text>
          {hasChanges ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={styles.saveButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Text style={styles.saveText}>Sauver</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.photoSection}>
            <ProfileImagePicker
              userId={userId!}
              currentImageUrl={profileImageUrl}
              size={100}
              onImageUpdated={(url) => setProfileImageUrl(url || undefined)}
            />
            <Text style={styles.photoLabel}>Modifier la photo</Text>
          </Animated.View>

          {/* Profile Info */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Profil</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
              <View style={styles.usernameInput}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={[styles.input, { flex: 1, paddingLeft: 0 }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="pseudo"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.inputHint}>3-20 caractères, lettres, chiffres et _</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez un peu de vous..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={150}
              />
              <Text style={styles.inputHint}>{bio.length}/150</Text>
            </View>
          </Animated.View>

          {/* Notifications */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Notifications push</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: Colors.border, true: Colors.accent + "60" }}
                thumbColor={notificationsEnabled ? Colors.accent : Colors.textMuted}
              />
            </View>
          </Animated.View>

          {/* Links */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Confidentialité</Text>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/blocked-users")}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="ban-outline" size={22} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Utilisateurs bloqués</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Legal */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Légal</Text>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/legal/terms")}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="document-text-outline" size={22} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Conditions d'utilisation</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/legal/privacy")}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Politique de confidentialité</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* App Version */}
          <Text style={styles.version}>PACT v1.0.0</Text>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.accent,
  },
  placeholder: {
    width: 60,
  },

  // Photo
  photoSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  photoLabel: {
    fontSize: 13,
    color: Colors.accent,
    marginTop: Spacing.sm,
  },

  // Section
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  // Input
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usernameInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingLeft: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usernamePrefix: {
    fontSize: 16,
    color: Colors.textMuted,
    marginRight: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Settings Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.danger,
  },

  // Version
  version: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.lg,
  },

  bottomSpacer: {
    height: 40,
  },
});
