/**
 * Badges/Achievements Screen
 * Clean horizontal card layout
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

const CATEGORIES = [
  { value: "all", label: "Tous" },
  { value: "wins", label: "Victoires" },
  { value: "streak", label: "Séries" },
  { value: "earnings", label: "Gains" },
  { value: "social", label: "Social" },
  { value: "participation", label: "Participation" },
  { value: "special", label: "Spéciaux" },
];

const RARITY_CONFIG: Record<string, { color: string; label: string }> = {
  common: { color: Colors.textMuted, label: "Commun" },
  rare: { color: Colors.info, label: "Rare" },
  epic: { color: "#9B8AE0", label: "Épique" },
  legendary: { color: Colors.warning, label: "Légendaire" },
};

// Map emoji to Ionicons
const BADGE_ICONS: Record<string, string> = {
  "🏆": "trophy",
  "⭐": "star",
  "🌟": "star",
  "👑": "ribbon",
  "🔥": "flame",
  "🦅": "shield-checkmark",
  "🎯": "locate",
  "💫": "sparkles",
  "⚡": "flash",
  "💎": "diamond",
  "🤖": "hardware-chip",
  "💰": "cash",
  "💵": "cash",
  "💸": "trending-up",
  "🏦": "business",
  "🤑": "wallet",
  "👥": "people",
  "🤝": "handshake",
  "👋": "hand-left",
  "🎉": "gift",
  "📊": "stats-chart",
  "🏃": "footsteps",
  "🎖️": "medal",
  "✅": "checkmark-circle",
  "💳": "card",
  "🗓️": "calendar",
};

export default function BadgesScreen() {
  const { userId } = useAuth();
  const [category, setCategory] = useState("all");

  const badges = useQuery(
    api.badges.getAllBadgesWithStatus,
    userId ? { userId } : "skip"
  );

  const filteredBadges = badges?.filter(
    (b: any) => category === "all" || b.category === category
  );

  const unlockedCount = badges?.filter((b: any) => b.isUnlocked).length || 0;
  const totalCount = badges?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Badges</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Progress Card */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressIconBox}>
            <Ionicons name="ribbon" size={24} color={Colors.accent} />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressTitle}>Ta collection</Text>
            <Text style={styles.progressSubtitle}>
              {unlockedCount} sur {totalCount} badges débloqués
            </Text>
          </View>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              style={[
                styles.categoryButton,
                category === cat.value && styles.categoryButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat.value && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Badges List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!badges ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : filteredBadges?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ribbon-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucun badge dans cette catégorie</Text>
          </View>
        ) : (
          <View style={styles.badgesList}>
            {filteredBadges?.map((badge: any, index: number) => (
              <Animated.View
                key={badge._id || badge.name}
                entering={FadeInRight.delay(120 + index * 30).duration(300)}
              >
                <BadgeCard badge={badge} />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeCard({ badge }: { badge: any }) {
  const rarityConfig = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
  const isUnlocked = badge.isUnlocked;
  const iconName = BADGE_ICONS[badge.icon] || "ribbon";

  return (
    <View style={[styles.badgeCard, isUnlocked && styles.badgeCardUnlocked]}>
      {/* Left: Icon */}
      <View style={[
        styles.badgeIconBox,
        isUnlocked ? { backgroundColor: `${rarityConfig.color}15` } : { backgroundColor: Colors.surfaceSecondary }
      ]}>
        <Ionicons
          name={iconName as any}
          size={24}
          color={isUnlocked ? rarityConfig.color : Colors.textMuted}
        />
      </View>

      {/* Middle: Content */}
      <View style={styles.badgeContent}>
        <View style={styles.badgeTitleRow}>
          <Text style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]} numberOfLines={1}>
            {badge.title}
          </Text>
          <View style={[styles.rarityDot, { backgroundColor: rarityConfig.color }]} />
        </View>
        <Text style={styles.badgeDescription} numberOfLines={1}>
          {badge.description}
        </Text>

        {/* Progress Bar for locked badges */}
        {!isUnlocked && (
          <View style={styles.progressRow}>
            <View style={styles.progressBarSmall}>
              <View style={[styles.progressBarFill, { width: `${badge.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{badge.progress}%</Text>
          </View>
        )}
      </View>

      {/* Right: Status */}
      <View style={styles.badgeStatus}>
        {isUnlocked ? (
          <View style={[styles.unlockedBadge, { backgroundColor: `${Colors.success}15` }]}>
            <Ionicons name="checkmark" size={16} color={Colors.success} />
          </View>
        ) : (
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
        )}
      </View>
    </View>
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

  // Progress Card
  progressCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentMuted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  progressSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.accent,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Badges List
  badgesList: {
    gap: Spacing.sm,
  },

  // Badge Card - Horizontal
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeCardUnlocked: {
    borderColor: Colors.success,
    backgroundColor: Colors.surface,
  },
  badgeIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  badgeContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  badgeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  badgeTitleLocked: {
    color: Colors.textTertiary,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textMuted,
    width: 30,
    textAlign: "right",
  },
  badgeStatus: {
    width: 32,
    alignItems: "center",
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomSpacer: {
    height: 40,
  },
});
