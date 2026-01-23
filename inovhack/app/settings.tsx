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
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useAction } from "convex/react";
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
import { useTheme, ThemeMode } from "../providers/ThemeProvider";

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: "system", label: "Système", icon: "phone-portrait-outline" },
  { key: "light", label: "Clair", icon: "sunny-outline" },
  { key: "dark", label: "Sombre", icon: "moon-outline" },
];

export default function SettingsScreen() {
  const { userId, signOut } = useAuth();
  const { mode, setTheme, isDark } = useTheme();

  const user = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip"
  );

  const updateProfile = useMutation(api.users.updateProfile);
  const updateNotifications = useMutation(api.users.updateNotificationPreferences);
  const deleteAccountAction = useAction(api.users.deleteAccount);
  const withdrawFunds = useMutation(api.stripe.withdrawFunds);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);

  // Withdrawal modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawIban, setWithdrawIban] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

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
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "⚠️ ATTENTION\n\nCette action est DÉFINITIVE et irréversible.\n\nAvant de continuer, vérifiez que :\n• Vous n'avez plus d'argent sur votre compte\n• Vous n'avez pas de pacts actifs\n\nToutes vos données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!userId) return;

    setDeleting(true);
    try {
      await deleteAccountAction({ userId });
      await signOut();
      Alert.alert(
        "Compte supprimé",
        "Votre compte a été supprimé avec succès.",
        [{ text: "OK", onPress: () => router.replace("/auth") }]
      );
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de supprimer le compte");
    } finally {
      setDeleting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!userId) return;

    const amount = parseFloat(withdrawAmount);

    // Validation côté client avec messages propres
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un montant valide");
      return;
    }

    if (amount < 10) {
      Alert.alert("Montant insuffisant", "Le montant minimum de retrait est de 10€");
      return;
    }

    if (amount > (user?.balance || 0)) {
      Alert.alert("Solde insuffisant", `Vous n'avez que ${(user?.balance || 0).toFixed(2)}€ disponible`);
      return;
    }

    const cleanIban = withdrawIban.trim().replace(/\s/g, "").toUpperCase();
    if (!cleanIban) {
      Alert.alert("IBAN requis", "Veuillez entrer votre IBAN");
      return;
    }

    // Validation IBAN basique côté client
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    if (!ibanRegex.test(cleanIban)) {
      Alert.alert(
        "IBAN invalide",
        "Le format de votre IBAN n'est pas valide.\n\nExemple: FR76 3000 6000 0112 3456 7890 189"
      );
      return;
    }

    setWithdrawing(true);
    try {
      const result = await withdrawFunds({
        userId,
        amount,
        iban: cleanIban,
      });

      Alert.alert(
        "Retrait effectué",
        `${amount}€ ont été envoyés vers votre compte bancaire.\n\nNouveau solde: ${result.newBalance.toFixed(2)}€`,
        [{ text: "OK", onPress: () => {
          setShowWithdrawModal(false);
          setWithdrawAmount("");
          setWithdrawIban("");
        }}]
      );
    } catch (error: any) {
      // Transformer les erreurs Convex en messages propres
      const errorMessage = error.message || "Une erreur est survenue";
      let userFriendlyMessage = errorMessage;

      if (errorMessage.includes("IBAN invalide") || errorMessage.includes("Format IBAN")) {
        userFriendlyMessage = "Le format de votre IBAN n'est pas valide.\n\nExemple: FR76 3000 6000 0112 3456 7890 189";
      } else if (errorMessage.includes("Montant minimum")) {
        userFriendlyMessage = "Le montant minimum de retrait est de 10€";
      } else if (errorMessage.includes("Solde insuffisant")) {
        userFriendlyMessage = `Solde insuffisant. Vous avez ${(user?.balance || 0).toFixed(2)}€ disponible`;
      } else if (errorMessage.includes("Utilisateur non trouvé")) {
        userFriendlyMessage = "Session expirée. Veuillez vous reconnecter.";
      }

      Alert.alert("Erreur", userFriendlyMessage);
    } finally {
      setWithdrawing(false);
    }
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

          {/* Balance & Withdrawal */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Solde</Text>

            <View style={styles.balanceCard}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Disponible</Text>
                <Text style={styles.balanceValue}>{(user?.balance || 0).toFixed(2)}€</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(true)}
                style={[
                  styles.withdrawButton,
                  (user?.balance || 0) < 10 && styles.withdrawButtonDisabled,
                ]}
                disabled={(user?.balance || 0) < 10}
              >
                <Ionicons name="arrow-down-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.withdrawButtonText}>Retirer</Text>
              </TouchableOpacity>
            </View>
            {(user?.balance || 0) < 10 && (
              <Text style={styles.withdrawHint}>Minimum 10€ pour retirer</Text>
            )}
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

          {/* Appearance */}
          <Animated.View entering={FadeInDown.delay(175).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Apparence</Text>

            <View style={styles.themeSelector}>
              {THEME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setTheme(option.key)}
                  style={[
                    styles.themeOption,
                    mode === option.key && styles.themeOptionActive,
                  ]}
                >
                  <View style={[
                    styles.themeIconBox,
                    mode === option.key && styles.themeIconBoxActive,
                  ]}>
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={mode === option.key ? Colors.white : Colors.textSecondary}
                    />
                  </View>
                  <Text style={[
                    styles.themeLabel,
                    mode === option.key && styles.themeLabelActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  <Text style={styles.deleteAccountText}>Supprimer le compte</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* App Version */}
          <Text style={styles.version}>PACT v1.0.0</Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Withdrawal Modal */}
        <Modal
          visible={showWithdrawModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowWithdrawModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowWithdrawModal(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalKeyboard}
            >
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Retirer des fonds</Text>
                  <TouchableOpacity
                    onPress={() => setShowWithdrawModal(false)}
                    style={styles.modalClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalBalance}>
                  Solde disponible: {(user?.balance || 0).toFixed(2)}€
                </Text>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Montant (€)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    placeholder="Minimum 10€"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>IBAN</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={withdrawIban}
                    onChangeText={setWithdrawIban}
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.confirmWithdrawButton, withdrawing && styles.confirmWithdrawButtonDisabled]}
                  onPress={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.confirmWithdrawText}>Confirmer le retrait</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.modalDisclaimer}>
                  Le virement sera effectué sous 2-3 jours ouvrés.
                </Text>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
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
    textAlign: "center",
    flex: 1,
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
    width: 40,
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

  // Theme Selector
  themeSelector: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  themeOptionActive: {
    backgroundColor: Colors.surfaceHighlight,
  },
  themeIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  themeIconBoxActive: {
    backgroundColor: Colors.accent,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  themeLabelActive: {
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
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
    opacity: 0.8,
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: "500",
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

  // Balance Card
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  withdrawButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  withdrawHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalKeyboard: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  modalClose: {
    padding: Spacing.xs,
  },
  modalBalance: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontWeight: "500",
  },
  modalInputGroup: {
    marginBottom: Spacing.md,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmWithdrawButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  confirmWithdrawButtonDisabled: {
    opacity: 0.6,
  },
  confirmWithdrawText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  modalDisclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
