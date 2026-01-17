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
  Typography,
  Shadows,
} from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 7 Sponsored Challenges with real brands
const SPONSORED_CHALLENGES = [
  {
    id: "sponsored-1",
    title: "Aller 20 fois à la salle en janvier",
    brandName: "Basic-Fit",
    brandLogo: "https://www.google.com/s2/favicons?domain=basic-fit.com&sz=128",
    brandColor: "#FF6B00",
    minBet: 30,
    reward: 50,
    category: "fitness",
    duration: "1 mois",
  },
  {
    id: "sponsored-2",
    title: "30 jours consécutifs d'apprentissage",
    brandName: "Duolingo",
    brandLogo: "https://www.google.com/s2/favicons?domain=duolingo.com&sz=128",
    brandColor: "#58CC02",
    minBet: 15,
    reward: 30,
    category: "education",
    duration: "30 jours",
  },
  {
    id: "sponsored-3",
    title: "Zéro fast-food pendant 3 semaines",
    brandName: "HelloFresh",
    brandLogo: "https://www.google.com/s2/favicons?domain=hellofresh.com&sz=128",
    brandColor: "#99CC00",
    minBet: 20,
    reward: 35,
    category: "nutrition",
    duration: "21 jours",
  },
  {
    id: "sponsored-4",
    title: "Lire 4 livres ce mois",
    brandName: "Fnac",
    brandLogo: "https://www.google.com/s2/favicons?domain=fnac.com&sz=128",
    brandColor: "#E1A925",
    minBet: 20,
    reward: 25,
    category: "education",
    duration: "1 mois",
  },
  {
    id: "sponsored-5",
    title: "15 séances de yoga en 30 jours",
    brandName: "Lululemon",
    brandLogo: "https://www.google.com/s2/favicons?domain=lululemon.com&sz=128",
    brandColor: "#D31334",
    minBet: 25,
    reward: 45,
    category: "fitness",
    duration: "30 jours",
  },
  {
    id: "sponsored-6",
    title: "Économiser 200€ ce mois",
    brandName: "Boursorama",
    brandLogo: "https://www.google.com/s2/favicons?domain=boursorama.com&sz=128",
    brandColor: "#0066B2",
    minBet: 10,
    reward: 20,
    category: "finance",
    duration: "1 mois",
  },
  {
    id: "sponsored-7",
    title: "Marcher 10 000 pas/jour pendant 2 semaines",
    brandName: "Decathlon",
    brandLogo: "https://www.google.com/s2/favicons?domain=decathlon.com&sz=128",
    brandColor: "#0082C3",
    minBet: 15,
    reward: 30,
    category: "fitness",
    duration: "14 jours",
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

export default function ExploreScreen() {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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

        {/* 1. PACTS SPONSORISÉS - First section with brand logos */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.sponsoredSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={18} color={Colors.accent} />
            <Text style={styles.sectionTitle}>PACTS SPONSORISÉS</Text>
            <View style={styles.sponsoredBadgeSmall}>
              <Text style={styles.sponsoredBadgeSmallText}>Partenaires</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sponsoredList}
          >
            {SPONSORED_CHALLENGES.map((challenge, index) => (
              <Animated.View
                key={challenge.id}
                entering={FadeInRight.delay(160 + index * 40).springify()}
              >
                <TouchableOpacity
                  style={[styles.sponsoredCard, { borderColor: challenge.brandColor }]}
                  activeOpacity={0.85}
                >
                  {/* Brand Logo Badge */}
                  <View style={[styles.brandBadge, { backgroundColor: challenge.brandColor + "20", borderColor: challenge.brandColor }]}>
                    <Image
                      source={{ uri: challenge.brandLogo }}
                      style={styles.brandLogo}
                    />
                    <Text style={[styles.brandName, { color: challenge.brandColor }]}>{challenge.brandName}</Text>
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

                  <View style={styles.sponsoredFooter}>
                    <View style={styles.betSection}>
                      <Text style={styles.betLabel}>Mise</Text>
                      <Text style={styles.sponsoredBet}>{challenge.minBet}€</Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="gift" size={14} color={Colors.success} />
                      <Text style={styles.sponsoredReward}>+{challenge.reward}€</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* 2. PACTS COMMUNAUTAIRES - Real joinable pacts */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.communitySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe" size={18} color={Colors.info} />
            <Text style={styles.sectionTitle}>PACTS COMMUNAUTAIRES</Text>
          </View>

          {challenges === undefined ? (
            <ActivityIndicator color={Colors.info} style={{ padding: Spacing.lg }} />
          ) : filteredChallenges.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="rocket-outline" size={32} color={Colors.accent} />
              <Text style={styles.emptyCardText}>
                Aucun pact disponible pour le moment
              </Text>
              <View style={styles.emptyCardActions}>
                <TouchableOpacity
                  onPress={() => router.push("/create-challenge")}
                  style={styles.createPactButton}
                >
                  <Ionicons name="add" size={18} color={Colors.black} />
                  <Text style={styles.createPactButtonText}>Créer un pact</Text>
                </TouchableOpacity>
                {userId && (
                  <TouchableOpacity
                    onPress={handleSeedDemo}
                    disabled={isSeeding}
                    style={styles.seedDemoButton}
                  >
                    {isSeeding ? (
                      <ActivityIndicator size="small" color={Colors.info} />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={18} color={Colors.info} />
                        <Text style={styles.seedDemoButtonText}>Charger démos</Text>
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
                  entering={FadeInUp.delay(220 + index * 40).springify()}
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
                        <View style={styles.participantsBadge}>
                          <Ionicons name="people" size={12} color={Colors.info} />
                          <Text style={styles.participantsText}>
                            {challenge.currentParticipants || 0}
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
        </Animated.View>

        {/* 3. PACTS POPULAIRES - Horizontal scroll (Inspiration) */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={18} color={Colors.danger} />
            <Text style={styles.sectionTitle}>IDÉES POPULAIRES</Text>
            <View style={styles.inspirationBadge}>
              <Text style={styles.inspirationBadgeText}>Inspiration</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularList}
          >
            {POPULAR_CHALLENGES.map((challenge, index) => (
              <Animated.View
                key={challenge.id}
                entering={FadeInRight.delay(280 + index * 35).springify()}
              >
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/create-challenge", params: { title: challenge.title, category: challenge.category, minBet: challenge.minBet } })}
                  style={styles.popularCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.popularHeader}>
                    <View style={styles.participantsBadge}>
                      <Ionicons name="people" size={12} color={Colors.info} />
                      <Text style={styles.participantsText}>{challenge.participants.toLocaleString()}</Text>
                    </View>
                  </View>

                  <Text style={styles.popularTitle} numberOfLines={2}>
                    {challenge.title}
                  </Text>

                  <View style={styles.popularFooter}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.challengeCategory}>
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

        {/* 3. PACTS DE MES AMIS - Third section */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.friendsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color={Colors.info} />
            <Text style={styles.sectionTitle}>PACTS DE MES AMIS</Text>
          </View>

          {!userId ? (
            <View style={styles.friendsEmptyCard}>
              <Ionicons name="person-add-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.friendsEmptyText}>Connecte-toi pour voir les pacts de tes amis</Text>
              <TouchableOpacity
                onPress={() => router.push("/auth")}
                style={styles.friendsConnectButton}
              >
                <Text style={styles.friendsConnectButtonText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          ) : friendsChallenges === undefined ? (
            <ActivityIndicator color={Colors.info} style={{ padding: Spacing.lg }} />
          ) : filteredFriendsChallenges.length === 0 ? (
            <View style={styles.friendsEmptyCard}>
              <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.friendsEmptyText}>
                Ajoute des amis depuis ton profil pour voir leurs pacts ici!
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.friendsAddButton}
              >
                <Ionicons name="person-add" size={18} color={Colors.info} />
                <Text style={styles.friendsAddButtonText}>Ajouter des amis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.friendsChallengesList}>
              {filteredFriendsChallenges.map((challenge: any, index: number) => (
                <Animated.View
                  key={challenge._id}
                  entering={FadeInUp.delay(280 + index * 40).springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleJoinChallenge(challenge._id)}
                    style={styles.friendChallengeCard}
                    activeOpacity={0.85}
                  >
                    <View style={styles.friendsIndicator}>
                      <Ionicons name="people" size={14} color={Colors.info} />
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
                          <Text style={styles.challengeCategory}>
                            {getCategoryName(challenge.category)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.challengeRight}>
                      <Text style={styles.challengeBet}>{challenge.minBet}€</Text>
                      <View style={[styles.joinArrow, styles.joinArrowFriends]}>
                        <Ionicons name="arrow-forward" size={20} color={Colors.textPrimary} />
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
  sponsoredBadgeSmall: {
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: "auto",
  },
  sponsoredBadgeSmallText: {
    ...Typography.labelSmall,
    color: Colors.accent,
    fontSize: 10,
  },
  sponsoredCard: {
    width: 260,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sponsoredTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    minHeight: 42,
    lineHeight: 21,
  },
  sponsoredMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    ...Typography.labelSmall,
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
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  sponsoredBet: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.success,
    gap: Spacing.xs,
  },
  sponsoredReward: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.success,
  },
  // Community Section
  communitySection: {
    marginBottom: Spacing.xxl,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCardText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  emptyCardActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  seedDemoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoMuted,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  seedDemoButtonText: {
    ...Typography.labelMedium,
    color: Colors.info,
  },
  createPactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  createPactButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  inspirationBadge: {
    backgroundColor: Colors.dangerMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: "auto",
  },
  inspirationBadgeText: {
    ...Typography.labelSmall,
    color: Colors.danger,
    fontSize: 10,
  },
  // Popular Section - Horizontal
  popularSection: {
    marginBottom: Spacing.xxl,
  },
  popularList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  popularCard: {
    width: 180,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
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
    backgroundColor: Colors.infoMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  participantsText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.info,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    flex: 1,
    lineHeight: 19,
  },
  popularFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popularBet: {
    fontSize: 18,
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
  // Empty states
  emptyStateSmall: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  // Friends section
  friendsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  friendsEmptyCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  friendsEmptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  friendsConnectButton: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  friendsConnectButtonText: {
    ...Typography.labelMedium,
    color: Colors.black,
  },
  friendsAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoMuted,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.info,
  },
  friendsAddButtonText: {
    ...Typography.labelMedium,
    color: Colors.info,
  },
  friendsChallengesList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  friendChallengeCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.info,
    ...Shadows.sm,
  },
  friendsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  friendsIndicatorText: {
    ...Typography.labelSmall,
    color: Colors.info,
  },
  joinArrowFriends: {
    backgroundColor: Colors.infoMuted,
  },
});
