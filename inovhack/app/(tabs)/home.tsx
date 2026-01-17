import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();

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

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
              style={styles.secondaryButton}
              activeOpacity={0.85}
            >
              <View style={styles.secondaryButtonIcon}>
                <Ionicons name="search" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.secondaryButtonText}>Rejoindre un Pact</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
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
    gap: Spacing.lg,
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
});
