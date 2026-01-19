/**
 * Onboarding Screen - Clean & Elegant Tutorial
 * LUMA-inspired: soft, welcoming, minimal design
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
} from "../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    icon: "hand-right-outline",
    iconColor: Colors.accent,
    iconBg: Colors.accentMuted,
    title: "Bienvenue sur PACT",
    subtitle: "Transforme tes objectifs en engagements",
    description:
      "PACT t'aide a tenir tes engagements en misant sur toi-meme. Cree des defis, mise de l'argent, et gagne quand tu reussis.",
  },
  {
    id: "challenges",
    icon: "trophy-outline",
    iconColor: Colors.warning,
    iconBg: Colors.warningMuted,
    title: "Cree des defis",
    subtitle: "Seul ou avec tes amis",
    description:
      "Definis ton objectif, choisis une duree, et fixe une mise. Tu peux creer des defis prives entre amis ou rejoindre des challenges publics.",
  },
  {
    id: "proofs",
    icon: "camera-outline",
    iconColor: Colors.info,
    iconBg: Colors.infoMuted,
    title: "Prouve tes succes",
    subtitle: "Photos, textes, et validations",
    description:
      "Soumets tes preuves quotidiennes. La communaute vote pour valider, ou ton organisateur approuve directement.",
  },
  {
    id: "rewards",
    icon: "gift-outline",
    iconColor: Colors.success,
    iconBg: Colors.successMuted,
    title: "Gagne des recompenses",
    subtitle: "Argent, badges, et gloire",
    description:
      "Reussis tes defis pour recuperer ta mise et gagner des bonus. Collectionne des badges et grimpe dans les classements.",
  },
  {
    id: "start",
    icon: "rocket-outline",
    iconColor: Colors.accent,
    iconBg: Colors.accentMuted,
    title: "Pret a commencer ?",
    subtitle: "Ton premier defi t'attend",
    description:
      "Explore les defis disponibles, cree le tien, ou rejoins celui d'un ami. Ton aventure commence maintenant !",
  },
];

export default function OnboardingScreen() {
  const { userId } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const handleGetStarted = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    if (userId) {
      try {
        await completeOnboarding({ userId });
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    }
    router.replace("/(tabs)");
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slideContainer}>
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.slideContent}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
            <Ionicons name={item.icon} size={56} color={item.iconColor} />
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Skip Button */}
      {!isLastSlide && (
        <Animated.View entering={FadeIn.delay(300)} style={styles.skipContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom Section */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.bottomSection}>
        {/* Progress Indicators */}
        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
              <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}

          {isLastSlide ? (
            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.getStartedButton}
              activeOpacity={0.9}
            >
              <Text style={styles.getStartedText}>Commencer</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.9}
            >
              <Text style={styles.nextText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}

          {!isLastSlide ? (
            <View style={styles.navButtonPlaceholder} />
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}
        </View>

        {/* Terms Notice */}
        <Text style={styles.termsNotice}>
          En continuant, tu acceptes nos{" "}
          <Text style={styles.termsLink} onPress={() => router.push("/legal/terms")}>
            CGU
          </Text>{" "}
          et{" "}
          <Text style={styles.termsLink} onPress={() => router.push("/legal/privacy")}>
            Politique de confidentialite
          </Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Skip Button
  skipContainer: {
    position: "absolute",
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textTertiary,
  },

  // Slide
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  slideContent: {
    alignItems: "center",
    maxWidth: 340,
  },

  // Icon
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },

  // Text
  textContent: {
    alignItems: "center",
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.accent,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },

  // Navigation
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  nextText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Terms
  termsNotice: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },
});
