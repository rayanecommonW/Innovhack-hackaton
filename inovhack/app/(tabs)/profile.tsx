import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import AddFundsModal from "../../components/AddFundsModal";
import { getCategoryName } from "../../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

export default function ProfileScreen() {
  const { user, userId, logout, isLoading, refreshUser } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const proofsToVote = useQuery(
    api.votes.getProofsToVote,
    userId ? { userId } : "skip"
  );

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Te déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleSubmitProof = (participationId: string) => {
    router.push({ pathname: "/submit-proof", params: { participationId } });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.loginTitle}>Connecte-toi</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth")}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const wonCount = participations?.filter((p: any) => p.status === "won").length || 0;
  const totalBets = participations?.length || 0;
  const winRate = totalBets > 0 ? Math.round((wonCount / totalBets) * 100) : 0;

  // Filter active participations (not yet won or lost)
  const activePacts = participations?.filter((p: any) => p.status === "active") || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </Animated.View>

        {/* Balance */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde</Text>
          <Text style={styles.balanceAmount}>{user.balance.toFixed(2)}€</Text>
          <TouchableOpacity
            onPress={() => setShowAddFunds(true)}
            style={styles.addFundsButton}
          >
            <Ionicons name="add" size={20} color={Colors.black} />
            <Text style={styles.addFundsText}>Ajouter</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wonCount}</Text>
            <Text style={styles.statLabel}>Gagnés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Réussite</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalBets}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </Animated.View>

        {/* Community Proofs to Vote - Always visible */}
        <Animated.View entering={FadeInDown.delay(165).springify()}>
          <TouchableOpacity
            onPress={() => router.push("/community-proofs")}
            style={[
              styles.communityProofsCard,
              proofsToVote && proofsToVote.length > 0
                ? styles.communityProofsCardActive
                : styles.communityProofsCardEmpty
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.communityProofsLeft}>
              <View style={[
                styles.communityProofsIcon,
                proofsToVote && proofsToVote.length > 0 && styles.communityProofsIconActive
              ]}>
                <Ionicons
                  name="people"
                  size={24}
                  color={proofsToVote && proofsToVote.length > 0 ? Colors.info : Colors.textTertiary}
                />
              </View>
              <View>
                <Text style={styles.communityProofsTitle}>Validation communautaire</Text>
                <Text style={[
                  styles.communityProofsSubtitle,
                  proofsToVote && proofsToVote.length > 0
                    ? styles.communityProofsSubtitleActive
                    : styles.communityProofsSubtitleEmpty
                ]}>
                  {proofsToVote && proofsToVote.length > 0
                    ? `${proofsToVote.length} preuve${proofsToVote.length > 1 ? "s" : ""} en attente`
                    : "Aucune preuve a valider"
                  }
                </Text>
              </View>
            </View>
            {proofsToVote && proofsToVote.length > 0 ? (
              <View style={styles.communityProofsBadge}>
                <Text style={styles.communityProofsBadgeText}>{proofsToVote.length}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Active Pacts - This is the missing link! */}
        {activePacts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.activePactsSection}>
            <Text style={styles.sectionTitle}>MES PACTS ACTIFS</Text>
            <View style={styles.pactsList}>
              {activePacts.map((pact: any) => (
                <View key={pact._id} style={styles.pactCard}>
                  <View style={styles.pactMain}>
                    <Text style={styles.pactTitle} numberOfLines={1}>
                      {pact.challenge?.title || "Pact"}
                    </Text>
                    <Text style={styles.pactCategory}>
                      {pact.challenge?.category ? getCategoryName(pact.challenge.category) : ""}
                    </Text>
                  </View>
                  <View style={styles.pactRight}>
                    <Text style={styles.pactBet}>{pact.betAmount}€</Text>
                    <TouchableOpacity
                      onPress={() => handleSubmitProof(pact._id)}
                      style={styles.submitProofButton}
                    >
                      <Ionicons name="camera" size={18} color={Colors.black} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Funds Modal */}
      <AddFundsModal
        visible={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        userId={userId}
        onSuccess={refreshUser}
      />
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
    gap: Spacing.lg,
  },
  loginTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  loginButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  loginButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  userName: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  userEmail: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  balanceCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: Spacing.lg,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addFundsText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  // Community Proofs Card
  communityProofsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  communityProofsCardActive: {
    backgroundColor: Colors.infoMuted,
    borderColor: Colors.info,
  },
  communityProofsCardEmpty: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  communityProofsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  communityProofsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  communityProofsIconActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  communityProofsTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  communityProofsSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  communityProofsSubtitleActive: {
    color: Colors.info,
  },
  communityProofsSubtitleEmpty: {
    color: Colors.textTertiary,
  },
  communityProofsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.info,
    justifyContent: "center",
    alignItems: "center",
  },
  communityProofsBadgeText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  // Active Pacts Section
  activePactsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  pactsList: {
    gap: Spacing.sm,
  },
  pactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pactMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  pactTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  pactCategory: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  pactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  pactBet: {
    ...Typography.labelLarge,
    color: Colors.success,
  },
  submitProofButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  logoutText: {
    ...Typography.labelMedium,
    color: Colors.danger,
  },
  bottomSpacer: {
    height: 120,
  },
});
