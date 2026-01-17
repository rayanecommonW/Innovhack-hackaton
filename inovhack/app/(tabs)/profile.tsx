import React from "react";
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
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

export default function ProfileScreen() {
  const { user, userId, logout, isLoading } = useAuth();

  const participations = useQuery(
    api.participations.getMyParticipations,
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
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
    color: Colors.accent,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
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
