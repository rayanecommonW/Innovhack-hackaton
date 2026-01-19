/**
 * Explore Screen - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
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
  Shadows,
} from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 6 Sponsored Challenges with real brands
const SPONSORED_CHALLENGES = [
  {
    id: "sponsored-1",
    title: "30 jours consécutifs d'apprentissage",
    brandName: "Duolingo",
    brandLogo: "https://www.google.com/s2/favicons?domain=duolingo.com&sz=128",
    brandColor: "#58CC02",
    minBet: 15,
    reward: "3 mois Super Duolingo offerts",
    category: "education",
    duration: "30 jours",
  },
  {
    id: "sponsored-2",
    title: "Lire 4 livres ce mois",
    brandName: "Fnac",
    brandLogo: "https://www.google.com/s2/favicons?domain=fnac.com&sz=128",
    brandColor: "#E1A925",
    minBet: 20,
    reward: "-30% sur ta prochaine commande",
    category: "education",
    duration: "1 mois",
  },
  {
    id: "sponsored-3",
    title: "Économiser 500€ ce mois",
    brandName: "Boursorama",
    brandLogo: "https://www.google.com/s2/favicons?domain=boursorama.com&sz=128",
    brandColor: "#0066B2",
    minBet: 10,
    reward: "6 mois Bourso Premium offerts",
    category: "finance",
    duration: "1 mois",
  },
  {
    id: "sponsored-4",
    title: "Faire 100 appels API ce mois",
    brandName: "OpenAI",
    brandLogo: "https://www.google.com/s2/favicons?domain=openai.com&sz=128",
    brandColor: "#10A37F",
    minBet: 25,
    reward: "50$ de crédits API offerts",
    category: "productivity",
    duration: "1 mois",
  },
  {
    id: "sponsored-5",
    title: "Regarder 10 documentaires ce mois",
    brandName: "Netflix",
    brandLogo: "https://www.google.com/s2/favicons?domain=netflix.com&sz=128",
    brandColor: "#E50914",
    minBet: 15,
    reward: "1 mois d'abonnement offert",
    category: "entertainment",
    duration: "1 mois",
  },
  {
    id: "sponsored-6",
    title: "Lire 5 livres Kindle ce mois",
    brandName: "Amazon",
    brandLogo: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
    brandColor: "#FF9900",
    minBet: 20,
    reward: "Bon d'achat 30€ offert",
    category: "education",
    duration: "1 mois",
  },
];

// 10 Popular Challenges
const POPULAR_CHALLENGES = [
  { id: "pop-1", title: "Se lever à 6h tous les jours", category: "productivity", minBet: 10, participants: 2847 },
  { id: "pop-2", title: "Pas d'alcool pendant 30 jours", category: "health", minBet: 20, participants: 1923 },
  { id: "pop-3", title: "Faire du sport 4x par semaine", category: "fitness", minBet: 15, participants: 3512 },
  { id: "pop-4", title: "Lire 20 pages par jour", category: "education", minBet: 10, participants: 1456 },
  { id: "pop-5", title: "Zéro réseaux sociaux le matin", category: "mental", minBet: 10, participants: 2134 },
  { id: "pop-6", title: "Boire 2L d'eau par jour", category: "health", minBet: 5, participants: 4521 },
  { id: "pop-7", title: "Marcher 30 min chaque jour", category: "fitness", minBet: 10, participants: 2876 },
  { id: "pop-8", title: "Pas de sucre ajouté pendant 2 semaines", category: "nutrition", minBet: 15, participants: 1678 },
  { id: "pop-9", title: "Apprendre une nouvelle compétence", category: "education", minBet: 25, participants: 987 },
  { id: "pop-10", title: "Dormir 8h minimum chaque nuit", category: "health", minBet: 10, participants: 3245 },
];

// Content filter - block inappropriate content
const BLOCKED_WORDS = [
  "branler", "masturb", "sexe", "porn", "nude", "naked", "xxx",
  "bite", "queue", "couille", "nichon", "sein", "cul",
];

const isContentAppropriate = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return !BLOCKED_WORDS.some(word => lowerText.includes(word));
};

const BET_RANGES = [
  { id: "all", label: "Toutes les mises", min: 0, max: Infinity },
  { id: "small", label: "5€ - 15€", min: 5, max: 15 },
  { id: "medium", label: "15€ - 30€", min: 15, max: 30 },
  { id: "large", label: "30€ - 50€", min: 30, max: 50 },
  { id: "xlarge", label: "50€+", min: 50, max: Infinity },
];

const SORT_OPTIONS = [
  { id: "popular", label: "Populaire", icon: "flame-outline" },
  { id: "newest", label: "Récent", icon: "time-outline" },
  { id: "bet_low", label: "Mise ↑", icon: "trending-up-outline" },
  { id: "bet_high", label: "Mise ↓", icon: "trending-down-outline" },
];

export default function ExploreScreen() {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBetRange, setSelectedBetRange] = useState("all");
  const [selectedSort, setSelectedSort] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFiltersExpanded, setShowFiltersExpanded] = useState(false);

  const challenges = useQuery(api.challenges.listPublicChallenges);
  const sponsoredChallenges = useQuery(api.challenges.listSponsoredChallenges);
  const friendsChallenges = useQuery(
    api.friends.getFriendsChallenges,
    userId ? { userId } : "skip"
  );
  const seedDemoChallenges = useMutation(api.challenges.seedDemoChallenges);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDemo = async () => {
    if (!userId) return;
    setIsSeeding(true);
    try {
      await seedDemoChallenges({ creatorId: userId });
      onRefresh();
    } catch (error) {
      console.error("Error seeding challenges:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Get current bet range
  const currentBetRange = BET_RANGES.find(r => r.id === selectedBetRange) || BET_RANGES[0];

  // Filter challenges with content moderation
  const filteredChallenges = React.useMemo(() => {
    let filtered = challenges?.filter((c: any) => {
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
      // Bet range filter
      const matchesBetRange = c.minBet >= currentBetRange.min && c.minBet <= currentBetRange.max;
      return matchesCategory && matchesSearch && !isSponsored && matchesBetRange;
    }) || [];

    // Sorting
    if (selectedSort === "newest") {
      filtered = [...filtered].sort((a: any, b: any) => (b._creationTime || 0) - (a._creationTime || 0));
    } else if (selectedSort === "bet_low") {
      filtered = [...filtered].sort((a: any, b: any) => a.minBet - b.minBet);
    } else if (selectedSort === "bet_high") {
      filtered = [...filtered].sort((a: any, b: any) => b.minBet - a.minBet);
    } else {
      // popular - sort by participants
      filtered = [...filtered].sort((a: any, b: any) => (b.currentParticipants || 0) - (a.currentParticipants || 0));
    }

    return filtered;
  }, [challenges, selectedCategory, searchQuery, currentBetRange, selectedSort]);

  // Filter sponsored challenges too
  const filteredSponsored = sponsoredChallenges?.filter((c: any) => {
    return isContentAppropriate(c.title) && isContentAppropriate(c.description || "");
  }) || [];

  // Filter friends' challenges
  const filteredFriendsChallenges = friendsChallenges?.filter((c: any) => {
    if (!isContentAppropriate(c.title) || !isContentAppropriate(c.description || "")) {
      return false;
    }
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Explorer</Text>
          <Text style={styles.headerSubtitle}>Trouve ton prochain défi</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
            <Ionicons
              name="search-outline"
              size={18}
              color={isSearchFocused ? Colors.accent : Colors.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un pact..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.searchClear}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filters Row */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.filtersSection}>
          {/* Main Filters Row */}
          <View style={styles.categoryFilterRow}>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={[styles.filterChip, selectedCategory && styles.filterChipActive]}
            >
              <Ionicons name="grid-outline" size={14} color={selectedCategory ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.filterChipText, selectedCategory && styles.filterChipTextActive]}>
                {selectedCategory ? getCategoryName(selectedCategory) : "Catégorie"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFiltersExpanded(!showFiltersExpanded)}
              style={[styles.filterChip, (selectedBetRange !== "all" || selectedSort !== "popular") && styles.filterChipActive]}
            >
              <Ionicons name="funnel-outline" size={14} color={(selectedBetRange !== "all" || selectedSort !== "popular") ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.filterChipText, (selectedBetRange !== "all" || selectedSort !== "popular") && styles.filterChipTextActive]}>
                Filtres
              </Text>
              <Ionicons name={showFiltersExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            {(selectedCategory || selectedBetRange !== "all" || selectedSort !== "popular") && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory(null);
                  setSelectedBetRange("all");
                  setSelectedSort("popular");
                }}
                style={styles.clearAllButton}
              >
                <Ionicons name="close-circle" size={18} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          {/* Expanded Filters */}
          {showFiltersExpanded && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.expandedFilters}>
              {/* Bet Range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Mise</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                  {BET_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range.id}
                      onPress={() => setSelectedBetRange(range.id)}
                      style={[styles.filterOption, selectedBetRange === range.id && styles.filterOptionActive]}
                    >
                      <Text style={[styles.filterOptionText, selectedBetRange === range.id && styles.filterOptionTextActive]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sort */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Trier par</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSelectedSort(option.id)}
                      style={[styles.filterOption, selectedSort === option.id && styles.filterOptionActive]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={14}
                        color={selectedSort === option.id ? Colors.accent : Colors.textTertiary}
                      />
                      <Text style={[styles.filterOptionText, selectedSort === option.id && styles.filterOptionTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* 1. Pacts Sponsorisés */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Pacts sponsorisés</Text>
            </View>
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>Partenaires</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {SPONSORED_CHALLENGES.map((challenge, index) => (
              <Animated.View
                key={challenge.id}
                entering={FadeInRight.delay(160 + index * 40).duration(300)}
              >
                <TouchableOpacity
                  style={styles.sponsoredCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({
                    pathname: "/join-sponsored",
                    params: {
                      id: challenge.id,
                      title: challenge.title,
                      brandName: challenge.brandName,
                      brandLogo: challenge.brandLogo,
                      brandColor: challenge.brandColor,
                      minBet: challenge.minBet.toString(),
                      reward: challenge.reward.toString(),
                      category: challenge.category,
                      duration: challenge.duration,
                    }
                  })}
                >
                  {/* Centered Brand Section */}
                  <View style={styles.brandCenterSection}>
                    <Image
                      source={{ uri: challenge.brandLogo }}
                      style={styles.brandLogoLarge}
                    />
                    <Text style={[styles.brandNameLarge, { color: challenge.brandColor }]}>
                      {challenge.brandName}
                    </Text>
                    <View style={styles.partnerVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={10} color={Colors.success} />
                      <Text style={styles.partnerVerifiedText}>Partenaire</Text>
                    </View>
                  </View>

                  <Text style={styles.sponsoredTitle} numberOfLines={2}>
                    {challenge.title}
                  </Text>

                  <View style={styles.sponsoredMeta}>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.durationText}>{challenge.duration}</Text>
                    </View>
                  </View>

                  {/* Reward Section with Gift Icon */}
                  <View style={styles.sponsoredRewardSection}>
                    <Ionicons name="gift-outline" size={16} color={Colors.success} />
                    <Text style={styles.rewardTextCompact} numberOfLines={1}>{challenge.reward}</Text>
                  </View>

                  <View style={styles.sponsoredFooter}>
                    <View style={styles.betSection}>
                      <Text style={styles.betLabel}>Mise min.</Text>
                      <Text style={styles.sponsoredBet}>{challenge.minBet}€</Text>
                    </View>
                    <View style={styles.joinSponsoredButton}>
                      <Text style={styles.joinSponsoredText}>Rejoindre</Text>
                      <Ionicons name="arrow-forward" size={14} color={Colors.white} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 2. Idées Populaires */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flame-outline" size={18} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Idées populaires</Text>
            </View>
            <View style={styles.inspirationBadge}>
              <Text style={styles.inspirationBadgeText}>Inspiration</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {POPULAR_CHALLENGES.map((challenge, index) => (
              <Animated.View
                key={challenge.id}
                entering={FadeInRight.delay(220 + index * 35).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/create-challenge", params: { title: challenge.title, category: challenge.category, minBet: challenge.minBet } })}
                  style={styles.popularCard}
                  activeOpacity={0.9}
                >
                  <View style={styles.popularHeader}>
                    <View style={styles.participantsBadge}>
                      <Ionicons name="people-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.participantsText}>{challenge.participants.toLocaleString()}</Text>
                    </View>
                  </View>

                  <Text style={styles.popularTitle} numberOfLines={2}>
                    {challenge.title}
                  </Text>

                  <View style={styles.popularFooter}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {getCategoryName(challenge.category)}
                      </Text>
                    </View>
                    <Text style={styles.popularBet}>{challenge.minBet}€</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 3. Pacts Communautaires */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="globe-outline" size={18} color={Colors.info} />
              <Text style={styles.sectionTitle}>Pacts communautaires</Text>
            </View>
          </View>

          {challenges === undefined ? (
            <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.lg }} />
          ) : filteredChallenges.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="rocket-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.emptyCardTitle}>Aucun pact disponible</Text>
              <Text style={styles.emptyCardText}>
                Sois le premier à créer un défi
              </Text>
              <View style={styles.emptyCardActions}>
                <TouchableOpacity
                  onPress={() => router.push("/create-challenge")}
                  style={styles.createPactButton}
                >
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.createPactButtonText}>Créer un pact</Text>
                </TouchableOpacity>
                {userId && (
                  <TouchableOpacity
                    onPress={handleSeedDemo}
                    disabled={isSeeding}
                    style={styles.seedDemoButton}
                  >
                    {isSeeding ? (
                      <ActivityIndicator size="small" color={Colors.accent} />
                    ) : (
                      <>
                        <Ionicons name="sparkles-outline" size={16} color={Colors.accent} />
                        <Text style={styles.seedDemoButtonText}>Démos</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.challengesList}>
              {filteredChallenges.slice(0, 10).map((challenge: any, index: number) => (
                <Animated.View
                  key={challenge._id}
                  entering={FadeInUp.delay(280 + index * 40).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => handleJoinChallenge(challenge._id)}
                    style={styles.challengeCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.challengeMain}>
                      <Text style={styles.challengeTitle} numberOfLines={2}>
                        {challenge.title}
                      </Text>
                      <View style={styles.challengeMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {getCategoryName(challenge.category)}
                          </Text>
                        </View>
                        <View style={styles.participantsBadgeSmall}>
                          <Ionicons name="people-outline" size={12} color={Colors.textTertiary} />
                          <Text style={styles.participantsTextSmall}>
                            {challenge.currentParticipants || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.challengeRight}>
                      <Text style={styles.challengeBet}>{challenge.minBet}€</Text>
                      <View style={styles.joinArrow}>
                        <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* 4. Pacts de mes amis */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Pacts de mes amis</Text>
            </View>
          </View>

          {!userId ? (
            <View style={styles.friendsEmptyCard}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="person-add-outline" size={28} color={Colors.textTertiary} />
              </View>
              <Text style={styles.friendsEmptyTitle}>Connexion requise</Text>
              <Text style={styles.friendsEmptyText}>Connecte-toi pour voir les pacts de tes amis</Text>
              <TouchableOpacity
                onPress={() => router.push("/auth")}
                style={styles.connectButton}
              >
                <Text style={styles.connectButtonText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          ) : friendsChallenges === undefined ? (
            <ActivityIndicator color={Colors.accent} style={{ padding: Spacing.lg }} />
          ) : filteredFriendsChallenges.length === 0 ? (
            <View style={styles.friendsEmptyCard}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="people-outline" size={28} color={Colors.textTertiary} />
              </View>
              <Text style={styles.friendsEmptyTitle}>Aucun ami</Text>
              <Text style={styles.friendsEmptyText}>
                Ajoute des amis depuis ton profil
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.addFriendsButton}
              >
                <Ionicons name="person-add-outline" size={16} color={Colors.accent} />
                <Text style={styles.addFriendsButtonText}>Ajouter des amis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.friendsChallengesList}>
              {filteredFriendsChallenges.map((challenge: any, index: number) => (
                <Animated.View
                  key={challenge._id}
                  entering={FadeInUp.delay(320 + index * 40).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => handleJoinChallenge(challenge._id)}
                    style={styles.friendChallengeCard}
                    activeOpacity={0.9}
                  >
                    <View style={styles.friendsIndicator}>
                      <Ionicons name="people" size={12} color={Colors.accent} />
                      <Text style={styles.friendsIndicatorText}>
                        {challenge.friendsCount} ami{challenge.friendsCount > 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.challengeMain}>
                      <Text style={styles.challengeTitle} numberOfLines={2}>
                        {challenge.title}
                      </Text>
                      <View style={styles.challengeMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {getCategoryName(challenge.category)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.challengeRight}>
                      <Text style={styles.challengeBet}>{challenge.minBet}€</Text>
                      <View style={styles.joinArrowAccent}>
                        <Ionicons name="arrow-forward" size={16} color={Colors.accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

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
    paddingTop: Spacing.md,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textTertiary,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.xs,
  },
  searchContainerFocused: {
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: Colors.textPrimary,
  },
  searchClear: {
    padding: Spacing.xs,
  },

  // Filters Section
  filtersSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  categoryFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    ...Shadows.xs,
  },
  filterChipActive: {
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.accent,
  },
  clearAllButton: {
    marginLeft: "auto",
    padding: Spacing.xs,
  },
  expandedFilters: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  filterGroup: {
    marginBottom: Spacing.md,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterOptions: {
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterOptionActive: {
    backgroundColor: Colors.accentMuted,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  filterOptionTextActive: {
    color: Colors.accent,
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  partnerBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.accent,
  },
  inspirationBadge: {
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  inspirationBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.warning,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },

  // Sponsored Cards
  sponsoredCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  brandCenterSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  brandLogoLarge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceHighlight,
  },
  brandNameLarge: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  partnerVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  partnerVerifiedText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.success,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  brandLogo: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
  },
  brandName: {
    fontSize: 11,
    fontWeight: "600",
  },
  sponsoredTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    minHeight: 36,
    lineHeight: 18,
    textAlign: "center",
  },
  sponsoredMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  sponsoredFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  betSection: {
    gap: 2,
  },
  betLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textMuted,
  },
  sponsoredBet: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  rewardBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  sponsoredReward: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
  },
  sponsoredRewardSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    alignSelf: "center",
  },
  rewardAmountCompact: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
  rewardTextCompact: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.success,
    flex: 1,
  },
  rewardIconBox: {
    width: 40,
    height: 40,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardTextBox: {
    flex: 1,
  },
  rewardLabelText: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.success,
  },
  rewardAmountBig: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.success,
  },
  joinSponsoredButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  joinSponsoredText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },

  // Popular Cards
  popularCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    minHeight: 140,
    ...Shadows.sm,
  },
  popularHeader: {
    marginBottom: Spacing.sm,
  },
  participantsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  participantsText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    flex: 1,
    lineHeight: 18,
  },
  popularFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  popularBet: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent,
  },

  // Challenge Cards
  challengesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  challengeMain: {
    flex: 1,
    gap: Spacing.sm,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  challengeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  participantsBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  participantsTextSmall: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  challengeRight: {
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  challengeBet: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.accent,
  },
  joinArrow: {
    width: 32,
    height: 32,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  joinArrowAccent: {
    width: 32,
    height: 32,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty States
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.sm,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emptyCardActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  createPactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  createPactButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.white,
  },
  seedDemoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentMuted,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  seedDemoButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Friends Section
  friendsEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.sm,
  },
  friendsEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  friendsEmptyText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  connectButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.white,
  },
  addFriendsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentMuted,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  addFriendsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },
  friendsChallengesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  friendChallengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  friendsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  friendsIndicatorText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.accent,
  },

  bottomSpacer: {
    height: 120,
  },
});
