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
} from "react-native-reanimated";
import { CATEGORIES, getCategoryName } from "../../constants/categories";
import CategoryPickerModal from "../../components/CategoryPickerModal";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

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

  const filteredChallenges =
    challenges?.filter((c: any) => {
      const matchesCategory =
        !selectedCategory || c.category === selectedCategory;
      const matchesSearch = c.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Exclude sponsored challenges from regular list
      const isSponsored = !!c.sponsorName;
      return matchesCategory && matchesSearch && !isSponsored;
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
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
            <Ionicons
              name="search"
              size={20}
              color={isSearchFocused ? Colors.textPrimary : Colors.textTertiary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher"
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
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
            <Ionicons name="options-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.categoryFilterText}>
              {selectedCategory ? getCategoryName(selectedCategory) : "99+ catégories"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          {selectedCategory && (
            <TouchableOpacity onPress={clearCategory} style={styles.clearCategoryButton}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Sponsored Pacts Section */}
        {sponsoredChallenges && sponsoredChallenges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.sponsoredSection}>
            <Text style={styles.sectionTitle}>PACTS SPONSORISÉS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sponsoredList}
            >
              {sponsoredChallenges.map((challenge: any, index: number) => (
                <TouchableOpacity
                  key={challenge._id}
                  onPress={() => handleJoinChallenge(challenge._id)}
                  style={styles.sponsoredCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.sponsorBadge}>
                    <Text style={styles.sponsorBadgeText}>{challenge.sponsorName}</Text>
                  </View>
                  <Text style={styles.sponsoredTitle} numberOfLines={2}>
                    {challenge.title}
                  </Text>
                  <View style={styles.sponsoredFooter}>
                    <Text style={styles.sponsoredBet}>{challenge.minBet}€</Text>
                    {challenge.sponsorReward && (
                      <Text style={styles.sponsoredReward}>+{challenge.sponsorReward}€</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* All Pacts Section */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Text style={styles.sectionTitle}>PACTS COMMUNAUTAIRES</Text>
        </Animated.View>

        {/* Challenges */}
        {challenges === undefined ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : filteredChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>Aucun pact trouvé</Text>
          </View>
        ) : (
          <View style={styles.challengesList}>
            {filteredChallenges.map((challenge: any, index: number) => (
              <Animated.View
                key={challenge._id}
                entering={FadeInRight.delay(180 + index * 30).springify()}
              >
                <TouchableOpacity
                  onPress={() => handleJoinChallenge(challenge._id)}
                  style={styles.challengeCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.challengeMain}>
                    <Text style={styles.challengeTitle} numberOfLines={1}>
                      {challenge.title}
                    </Text>
                    <Text style={styles.challengeCategory} numberOfLines={1}>
                      {getCategoryName(challenge.category)}
                    </Text>
                  </View>
                  <View style={styles.challengeRight}>
                    <Text style={styles.challengeBet}>{challenge.minBet}€</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
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
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainerFocused: {
    borderColor: Colors.accent,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  categoryFilterText: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
  },
  clearCategoryButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sponsoredSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sponsoredList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  sponsoredCard: {
    width: 200,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginRight: Spacing.md,
  },
  sponsorBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  sponsorBadgeText: {
    ...Typography.labelSmall,
    color: Colors.black,
    fontWeight: "700",
  },
  sponsoredTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    minHeight: 44,
  },
  sponsoredFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sponsoredBet: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  sponsoredReward: {
    ...Typography.labelMedium,
    color: Colors.success,
  },
  loadingSection: {
    padding: Spacing.huge,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  challengesList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  challengeTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  challengeCategory: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  challengeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  challengeBet: {
    ...Typography.labelLarge,
    color: Colors.accent,
  },
  bottomSpacer: {
    height: 120,
  },
});
