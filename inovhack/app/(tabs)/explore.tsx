import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  FlatList,
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
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

const categories = [
  { id: "all", name: "Tous" },
  { id: "sport", name: "Sport" },
  { id: "procrastination", name: "Productivité" },
  { id: "screen_time", name: "Screen Time" },
  { id: "social", name: "Social" },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const categoriesRef = useRef<FlatList>(null);

  const challenges = useQuery(api.challenges.listPublicChallenges);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredChallenges =
    challenges?.filter((c: any) => {
      const matchesCategory =
        selectedCategory === "all" || c.category === selectedCategory;
      const matchesSearch = c.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];

  const handleJoinChallenge = (challengeId: Id<"challenges">) => {
    router.push({ pathname: "/join-challenge", params: { challengeId } });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index !== -1 && categoriesRef.current) {
      categoriesRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
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

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.categoriesWrapper}>
          <FlatList
            ref={categoriesRef}
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item.id)}
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && styles.categoryChipSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.id && styles.categoryTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            getItemLayout={(data, index) => ({
              length: 100,
              offset: 100 * index,
              index,
            })}
          />
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
                entering={FadeInRight.delay(200 + index * 30).springify()}
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
                    <Text style={styles.challengeGoal} numberOfLines={1}>
                      {challenge.goal}
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
    marginBottom: Spacing.lg,
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
  categoriesWrapper: {
    marginBottom: Spacing.xl,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  categoryText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.black,
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
  challengeGoal: {
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
