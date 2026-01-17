import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { router } from "expo-router";
import { Id } from "../../convex/_generated/dataModel";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { CATEGORIES, getCategoryName } from "../../constants/categories";
import CategoryPickerModal from "../../components/CategoryPickerModal";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Content filter - block inappropriate content
const BLOCKED_WORDS = [
  "branler", "masturb", "sexe", "porn", "nude", "naked", "xxx",
  "bite", "queue", "couille", "nichon", "sein", "cul",
];

const isContentAppropriate = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return !BLOCKED_WORDS.some(word => lowerText.includes(word));
};

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const challenges = useQuery(api.challenges.listPublicChallenges);
  const sponsoredChallenges = useQuery(api.challenges.listSponsoredChallenges);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Filter challenges with content moderation
  const filteredChallenges =
    challenges?.filter((c: any) => {
      // Content moderation
      if (!isContentAppropriate(c.title) || !isContentAppropriate(c.description || "")) {
        return false;
      }
      const matchesCategory =
        !selectedCategory || c.category === selectedCategory;
      const matchesSearch = c.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Exclude sponsored challenges from regular list
      const isSponsored = !!c.sponsorName;
      return matchesCategory && matchesSearch && !isSponsored;
    }) || [];

  // Filter sponsored challenges too
  const filteredSponsored = sponsoredChallenges?.filter((c: any) => {
    return isContentAppropriate(c.title) && isContentAppropriate(c.description || "");
  }) || [];

  const handleJoinChallenge = (challengeId: Id<"challenges">) => {
    router.push({ pathname: "/join-challenge", params: { challengeId } });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
  };

  const clearCategory = () => {
    setSelectedCategory(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Explorer</Text>
          <Text style={styles.headerSubtitle}>Découvre les pacts de la communauté</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
            <Ionicons
              name="search"
              size={22}
              color={isSearchFocused ? Colors.textPrimary : Colors.textTertiary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un pact..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={22} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Category Filter */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.categoryFilterRow}>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            style={styles.categoryFilterButton}
          >
            <Ionicons name="options-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.categoryFilterText}>
              {selectedCategory ? getCategoryName(selectedCategory) : "99+ catégories"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          {selectedCategory && (
            <TouchableOpacity onPress={clearCategory} style={styles.clearCategoryButton}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Sponsored Pacts Section */}
        {filteredSponsored.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.sponsoredSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>PACTS SPONSORISÉS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sponsoredList}
            >
              {filteredSponsored.map((challenge: any, index: number) => (
                <Animated.View
                  key={challenge._id}
                  entering={FadeInRight.delay(160 + index * 50).springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleJoinChallenge(challenge._id)}
                    style={styles.sponsoredCard}
                    activeOpacity={0.85}
                  >
                    <View style={styles.sponsorBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.black} />
                      <Text style={styles.sponsorBadgeText}>{challenge.sponsorName}</Text>
                    </View>
                    <Text style={styles.sponsoredTitle} numberOfLines={2}>
                      {challenge.title}
                    </Text>
                    <View style={styles.sponsoredFooter}>
                      <Text style={styles.sponsoredBet}>{challenge.minBet}€</Text>
                      {challenge.sponsorReward && (
                        <View style={styles.rewardBadge}>
                          <Text style={styles.sponsoredReward}>+{challenge.sponsorReward}€</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* All Pacts Section */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.sectionHeader}>
          <Ionicons name="globe" size={18} color={Colors.info} />
          <Text style={styles.sectionTitle}>PACTS COMMUNAUTAIRES</Text>
        </Animated.View>

        {/* Challenges */}
        {challenges === undefined ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : filteredChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>Aucun pact trouvé</Text>
            <Text style={styles.emptyStateText}>Essaie une autre recherche</Text>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {filteredChallenges.map((challenge: any, index: number) => (
              <Animated.View
                key={challenge._id}
                entering={FadeInUp.delay(180 + index * 40).springify()}
              >
                <TouchableOpacity
                  onPress={() => handleJoinChallenge(challenge._id)}
                  style={styles.challengeCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.challengeMain}>
                    <Text style={styles.challengeTitle} numberOfLines={2}>
                      {challenge.title}
                    </Text>
                    <View style={styles.challengeMeta}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.challengeCategory}>
                          {getCategoryName(challenge.category)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.challengeRight}>
                    <Text style={styles.challengeBet}>{challenge.minBet}€</Text>
                    <View style={styles.joinArrow}>
                      <Ionicons name="arrow-forward" size={20} color={Colors.black} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
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
    paddingTop: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainerFocused: {
    borderColor: Colors.accent,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    padding: 0,
  },
  categoryFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  categoryFilterText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  clearCategoryButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
  },
  // Sponsored Section
  sponsoredSection: {
    marginBottom: Spacing.xxl,
  },
  sponsoredList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  sponsoredCard: {
    width: 240,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  sponsorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sponsorBadgeText: {
    ...Typography.labelSmall,
    color: Colors.black,
    fontWeight: "700",
  },
  sponsoredTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    minHeight: 48,
  },
  sponsoredFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sponsoredBet: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  rewardBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  sponsoredReward: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.success,
  },
  // Loading & Empty
  loadingSection: {
    padding: Spacing.huge,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  // Challenge Cards - BIGGER
  challengesList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  challengeMain: {
    flex: 1,
    gap: Spacing.sm,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  challengeCategory: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  challengeRight: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  challengeBet: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.success,
  },
  joinArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpacer: {
    height: 120,
  },
});
