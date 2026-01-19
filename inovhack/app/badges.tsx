/**
 * Badges/Achievements Screen
 * Collection of all badges with progress tracking
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
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
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

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: Colors.surfaceHighlight, text: Colors.textSecondary, border: Colors.border },
  rare: { bg: Colors.infoMuted, text: Colors.info, border: Colors.info },
  epic: { bg: "rgba(155, 138, 224, 0.1)", text: "#9B8AE0", border: "#9B8AE0" },
  legendary: { bg: Colors.warningMuted, text: Colors.warning, border: Colors.warning },
};

export default function BadgesScreen() {
  const { userId } = useAuth();
  const [category, setCategory] = useState("all");

  const badges = useQuery(
    api.badges.getAllBadgesWithStatus,
    userId ? { userId } : "skip"
  );

  const filteredBadges = badges?.filter(
    (b) => category === "all" || b.category === category
  );

  const unlockedCount = badges?.filter((b) => b.isUnlocked).length || 0;
  const totalCount = badges?.length || 0;

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

      {/* Progress */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.progressCard}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressCount}>
            {unlockedCount}/{totalCount}
          </Text>
          <Text style={styles.progressLabel}>badges débloqués</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : "0%" },
            ]}
          />
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

      {/* Badges Grid */}
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
          <View style={styles.badgesGrid}>
            {filteredBadges?.map((badge, index) => (
              <Animated.View
                key={badge._id}
                entering={ZoomIn.delay(150 + index * 50).duration(300)}
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
  const rarityConfig = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
  const isLocked = !badge.isUnlocked;

  return (
    <View
      style={[
        styles.badgeCard,
        isLocked && styles.badgeCardLocked,
        badge.isUnlocked && { borderColor: rarityConfig.border, borderWidth: 1 },
      ]}
    >
      <View
        style={[
          styles.badgeIconContainer,
          { backgroundColor: isLocked ? Colors.surfaceSecondary : rarityConfig.bg },
        ]}
      >
        <Text style={[styles.badgeIcon, isLocked && styles.badgeIconLocked]}>
          {badge.icon}
        </Text>
      </View>

      <Text style={[styles.badgeTitle, isLocked && styles.badgeTitleLocked]}>
        {badge.title}
      </Text>

      <Text style={styles.badgeDescription} numberOfLines={2}>
        {badge.description}
      </Text>

      {/* Progress or Unlocked Date */}
      {badge.isUnlocked ? (
        <View style={[styles.unlockedBadge, { backgroundColor: rarityConfig.bg }]}>
          <Ionicons name="checkmark" size={12} color={rarityConfig.text} />
          <Text style={[styles.unlockedText, { color: rarityConfig.text }]}>Débloqué</Text>
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarSmall}>
            <View style={[styles.progressBarFill, { width: `${badge.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{badge.progress}%</Text>
        </View>
      )}

      {/* Rarity */}
      <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.bg }]}>
        <Text style={[styles.rarityText, { color: rarityConfig.text }]}>
          {badge.rarity === "common" && "Commun"}
          {badge.rarity === "rare" && "Rare"}
          {badge.rarity === "epic" && "Épique"}
          {badge.rarity === "legendary" && "Légendaire"}
        </Text>
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
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },

  // Progress
  progressCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressCount: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.success,
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
    ...Shadows.xs,
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent,
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

  // Grid
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  // Badge Card
  badgeCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeIconLocked: {
    opacity: 0.4,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: Colors.textTertiary,
  },
  badgeDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },

  // Progress
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
    fontVariant: ["tabular-nums"],
  },

  // Unlocked
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Rarity
  rarityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "500",
  },

  bottomSpacer: {
    height: 40,
  },
});
