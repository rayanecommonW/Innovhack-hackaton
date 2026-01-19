/**
 * Referrals Screen
 * Referral code sharing and stats
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

export default function ReferralsScreen() {
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);

  const stats = useQuery(
    api.referrals.getReferralStats,
    userId ? { userId } : "skip"
  );

  const referrals = useQuery(
    api.referrals.getReferrals,
    userId ? { userId } : "skip"
  );

  const getOrCreateCode = useMutation(api.referrals.getOrCreateReferralCode);

  const handleGenerateCode = async () => {
    if (!userId) return;
    try {
      await getOrCreateCode({ userId });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de générer le code");
    }
  };

  const handleCopyCode = async () => {
    if (stats?.referralCode) {
      await Clipboard.setStringAsync(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!stats?.referralCode) return;

    try {
      await Share.share({
        message: `Rejoins PACT et gagne 2€ de bonus avec mon code : ${stats.referralCode}\n\nTélécharge l'app et entre mon code à l'inscription !`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Parrainage</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="gift" size={40} color={Colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Invite tes amis</Text>
          <Text style={styles.heroDescription}>
            Gagne 5€ pour chaque ami qui fait son premier pact.{"\n"}
            Ton ami reçoit 2€ de bonus à l'inscription !
          </Text>
        </Animated.View>

        {/* Referral Code */}
        {!stats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : (
          <>
            <Animated.View entering={ZoomIn.delay(100).duration(400)} style={styles.codeSection}>
              {stats.referralCode ? (
                <>
                  <Text style={styles.codeLabel}>Ton code de parrainage</Text>
                  <TouchableOpacity onPress={handleCopyCode} style={styles.codeBox}>
                    <Text style={styles.codeText}>{stats.referralCode}</Text>
                    <View style={styles.copyButton}>
                      <Ionicons
                        name={copied ? "checkmark" : "copy-outline"}
                        size={20}
                        color={copied ? Colors.success : Colors.accent}
                      />
                    </View>
                  </TouchableOpacity>
                  {copied && <Text style={styles.copiedText}>Copié !</Text>}

                  <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-social" size={20} color={Colors.white} />
                    <Text style={styles.shareButtonText}>Partager</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.codeLabel}>Génère ton code unique</Text>
                  <TouchableOpacity onPress={handleGenerateCode} style={styles.generateButton}>
                    <Ionicons name="sparkles" size={20} color={Colors.white} />
                    <Text style={styles.generateButtonText}>Générer mon code</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>

            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Tes stats</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color={Colors.info} />
                  <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                  <Text style={styles.statLabel}>Filleuls</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color={Colors.warning} />
                  <Text style={styles.statValue}>{stats.pendingReferrals}</Text>
                  <Text style={styles.statLabel}>En attente</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.statValue}>{stats.completedReferrals}</Text>
                  <Text style={styles.statLabel}>Complétés</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash" size={24} color={Colors.success} />
                  <Text style={styles.statValue}>{stats.totalEarnings}€</Text>
                  <Text style={styles.statLabel}>Gagnés</Text>
                </View>
              </View>
            </Animated.View>

            {/* Referrals List */}
            {referrals && referrals.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.referralsSection}>
                <Text style={styles.sectionTitle}>Tes filleuls</Text>

                <View style={styles.referralsList}>
                  {referrals.map((referral: any, index: number) => (
                    <Animated.View
                      key={referral._id}
                      entering={FadeInDown.delay(250 + index * 30).duration(300)}
                    >
                      <View style={styles.referralCard}>
                        <View style={styles.referralAvatar}>
                          <Text style={styles.referralInitial}>
                            {referral.referredName?.charAt(0) || "?"}
                          </Text>
                        </View>
                        <View style={styles.referralInfo}>
                          <Text style={styles.referralName}>
                            {referral.referredName || "Anonyme"}
                          </Text>
                          <Text style={styles.referralDate}>
                            {new Date(referral.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.referralStatus,
                            referral.status === "rewarded"
                              ? styles.referralStatusComplete
                              : styles.referralStatusPending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.referralStatusText,
                              referral.status === "rewarded"
                                ? styles.referralStatusTextComplete
                                : styles.referralStatusTextPending,
                            ]}
                          >
                            {referral.status === "rewarded" ? "+5€" : "En attente"}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* How it works */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.howSection}>
              <Text style={styles.sectionTitle}>Comment ça marche ?</Text>

              <View style={styles.stepsList}>
                <StepItem
                  number={1}
                  title="Partage ton code"
                  description="Envoie ton code unique à tes amis"
                />
                <StepItem
                  number={2}
                  title="Inscription"
                  description="Ton ami s'inscrit avec ton code et reçoit 2€"
                />
                <StepItem
                  number={3}
                  title="Premier pact"
                  description="Quand il fait son premier pact, tu gagnes 5€ !"
                />
              </View>
            </Animated.View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  placeholder: {
    width: 40,
  },

  loadingContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
  },

  // Hero
  heroCard: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Code
  codeSection: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.accent,
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  copyButton: {
    marginLeft: Spacing.md,
    padding: Spacing.sm,
  },
  copiedText: {
    fontSize: 12,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Stats
  statsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadows.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Referrals List
  referralsSection: {
    marginBottom: Spacing.xl,
  },
  referralsList: {
    gap: Spacing.sm,
  },
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
  },
  referralInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  referralInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  referralName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  referralDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  referralStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  referralStatusComplete: {
    backgroundColor: Colors.successMuted,
  },
  referralStatusPending: {
    backgroundColor: Colors.warningMuted,
  },
  referralStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  referralStatusTextComplete: {
    color: Colors.success,
  },
  referralStatusTextPending: {
    color: Colors.warning,
  },

  // How it works
  howSection: {
    marginBottom: Spacing.xl,
  },
  stepsList: {
    gap: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  bottomSpacer: {
    height: 40,
  },
});
