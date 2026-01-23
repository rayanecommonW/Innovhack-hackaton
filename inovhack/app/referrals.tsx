/**
 * Referrals Screen - Coming Soon
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
} from "../constants/theme";

export default function ReferralsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Parrainage</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Coming Soon Content */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift-outline" size={48} color={Colors.accent} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.comingSoonTitle}>
          Bientôt disponible
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.comingSoonText}>
          Le système de parrainage arrive très bientôt.{"\n"}
          Invite tes amis et gagne des récompenses !
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="person-add-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.featureText}>Invite tes amis avec ton code unique</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cash-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.featureText}>Gagne 5€ quand ils font leur premier pact</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="gift-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.featureText}>Tes amis reçoivent 2€ de bonus</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeButtonText}>Retour</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
  },

  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },

  comingSoonText: {
    fontSize: 15,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  featuresList: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  backHomeButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
  },
  backHomeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.white,
  },
});
