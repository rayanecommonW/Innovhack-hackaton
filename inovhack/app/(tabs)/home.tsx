import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Query for challenge by invite code (only when we have a 6-digit code)
  const challengeByCode = useQuery(
    api.challenges.getChallengeByInviteCode,
    inviteCode.length === 6 ? { inviteCode } : "skip"
  );

  const handleJoinByCode = () => {
    if (inviteCode.length !== 6) {
      Alert.alert("Erreur", "Code à 6 chiffres requis");
      return;
    }

    setIsSearching(true);

    // Small delay to let query resolve
    setTimeout(() => {
      if (challengeByCode) {
        setShowJoinModal(false);
        setInviteCode("");
        setIsSearching(false);
        router.push({ pathname: "/join-challenge", params: { challengeId: challengeByCode._id } });
      } else {
        setIsSearching(false);
        Alert.alert("Erreur", "Aucun pact trouvé avec ce code");
      }
    }, 500);
  };

  const handleCloseModal = () => {
    setShowJoinModal(false);
    setInviteCode("");
    setIsSearching(false);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.logo}>PACT</Text>
          <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.logo}>PACT</Text>
          <Text style={styles.tagline}>Engage. Parie. Gagne.</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={styles.authButton}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>Commencer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {/* Header minimal */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Text style={styles.greeting}>{user.name}</Text>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceText}>{user.balance.toFixed(0)}€</Text>
          </View>
        </Animated.View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          {/* Créer un Pact */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              onPress={() => router.push("/create-challenge")}
              style={styles.mainButton}
              activeOpacity={0.85}
            >
              <View style={styles.mainButtonIcon}>
                <Ionicons name="add" size={28} color={Colors.black} />
              </View>
              <Text style={styles.mainButtonText}>Créer un Pact</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Rejoindre section */}
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.joinSection}>
            <Text style={styles.joinSectionTitle}>Rejoindre</Text>

            {/* Pact Communautaire */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
              style={styles.joinButton}
              activeOpacity={0.85}
            >
              <View style={styles.joinButtonIcon}>
                <Ionicons name="globe-outline" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.joinButtonText}>Pact Communautaire</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Pact Entre Amis */}
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              style={styles.joinButton}
              activeOpacity={0.85}
            >
              <View style={styles.joinButtonIcon}>
                <Ionicons name="people-outline" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.joinButtonText}>Pact Entre Amis</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Join by Code Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejoindre un ami</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Entre le code à 6 chiffres</Text>

            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              onPress={handleJoinByCode}
              disabled={isSearching || inviteCode.length !== 6}
              style={[
                styles.modalSubmitButton,
                (isSearching || inviteCode.length !== 6) && styles.modalSubmitButtonDisabled,
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <Text style={styles.modalSubmitButtonText}>Rejoindre</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.xxxl,
  },
  logo: {
    fontSize: 52,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 10,
  },
  tagline: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    marginBottom: Spacing.huge,
  },
  authButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.huge,
    borderRadius: BorderRadius.full,
  },
  authButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.lg,
    marginBottom: Spacing.huge,
  },
  greeting: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  balanceChip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceText: {
    ...Typography.labelLarge,
    color: Colors.accent,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.textPrimary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  mainButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  mainButtonText: {
    ...Typography.headlineMedium,
    color: Colors.black,
  },
  joinSection: {
    gap: Spacing.md,
  },
  joinSectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  joinButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButtonText: {
    flex: 1,
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  codeInputContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeInput: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 12,
  },
  modalSubmitButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
});
