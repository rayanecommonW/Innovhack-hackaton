/**
 * Challenge Detail Screen
 * Shows full details of a challenge/pact
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { getCategoryName } from "../../constants/categories";
import * as Clipboard from "expo-clipboard";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import ConfettiCelebration, { ConfettiRef } from "../../components/ConfettiCelebration";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "En attente", color: Colors.warning, icon: "time-outline" },
  active: { label: "Actif", color: Colors.success, icon: "flash-outline" },
  completed: { label: "Terminé", color: Colors.info, icon: "checkmark-circle-outline" },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const challenge = useQuery(
    api.challenges.getChallenge,
    id ? { challengeId: id as Id<"challenges"> } : "skip"
  );

  const participations = useQuery(
    api.participations.getChallengeParticipants,
    id ? { challengeId: id as Id<"challenges"> } : "skip"
  );

  const deleteChallenge = useMutation(api.challenges.deleteChallenge);

  const isCreator = challenge?.creatorId === userId;
  const userParticipation = participations?.find((p) => p.usertId === userId);
  const isParticipant = !!userParticipation;
  const hasWon = userParticipation?.status === "won";
  const canDelete = isCreator && (!participations || participations.length === 0);

  // Trigger confetti if user won this challenge
  useEffect(() => {
    if (hasWon && !hasShownConfetti) {
      const timer = setTimeout(() => {
        confettiRef.current?.fire();
        setHasShownConfetti(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [hasWon, hasShownConfetti]);

  const handleCopyCode = async () => {
    if (challenge?.inviteCode) {
      await Clipboard.setStringAsync(challenge.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      const message = challenge?.inviteCode
        ? `Rejoins mon pact "${challenge.title}" sur PACT ! Code: ${challenge.inviteCode}`
        : `Rejoins mon pact "${challenge?.title}" sur PACT !`;

      await Share.share({ message });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleJoin = () => {
    if (id) {
      router.push({ pathname: "/join-challenge", params: { challengeId: id } });
    }
  };

  const handleOpenChat = () => {
    if (id) {
      router.push(`/chat/${id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer ce pact",
      "Es-tu sûr de vouloir supprimer ce pact ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!userId || !id) return;
            setIsDeleting(true);
            try {
              await deleteChallenge({
                challengeId: id as Id<"challenges">,
                userId,
              });
              router.back();
            } catch (error: any) {
              Alert.alert("Erreur", error.message || "Impossible de supprimer ce pact");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: number) => {
    const now = Date.now();
    const diff = endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[challenge.status || "pending"];
  const daysRemaining = challenge.endDate ? getDaysRemaining(challenge.endDate) : 0;
  const totalPot = participations?.reduce((sum, p) => sum + p.betAmount, 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Confetti celebration for wins */}
      <ConfettiCelebration ref={confettiRef} />

      {/* Winner Banner */}
      {hasWon && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.winnerBanner}>
          <Ionicons name="trophy" size={20} color={Colors.white} />
          <Text style={styles.winnerBannerText}>Tu as gagné ce pact !</Text>
        </Animated.View>
      )}

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du pact</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Title */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.titleSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{getCategoryName(challenge.category)}</Text>
            </View>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Ionicons name="star" size={12} color={Colors.warning} />
                <Text style={styles.creatorText}>Créateur</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Invite Code */}
        {challenge.inviteCode && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons name="key-outline" size={18} color={Colors.accent} />
              <Text style={styles.codeLabel}>Code d'invitation</Text>
            </View>
            <TouchableOpacity onPress={handleCopyCode} style={styles.codeBox} activeOpacity={0.8}>
              <Text style={styles.codeValue}>{challenge.inviteCode}</Text>
              <Ionicons
                name={copiedCode ? "checkmark" : "copy-outline"}
                size={20}
                color={copiedCode ? Colors.success : Colors.accent}
              />
            </TouchableOpacity>
            {copiedCode && (
              <Text style={styles.copiedText}>Code copié !</Text>
            )}
          </Animated.View>
        )}

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successMuted }]}>
              <Ionicons name="wallet" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{totalPot}€</Text>
            <Text style={styles.statLabel}>Cagnotte</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentMuted }]}>
              <Ionicons name="people" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{participations?.length || 0}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warningMuted }]}>
              <Ionicons name="time" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{daysRemaining}j</Text>
            <Text style={styles.statLabel}>Restants</Text>
          </View>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Informations</Text>

          {challenge.description && challenge.description !== challenge.title && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={18} color={Colors.textTertiary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{challenge.description}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color={Colors.textTertiary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Mise minimum</Text>
              <Text style={styles.detailValue}>{challenge.minBet}€</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textTertiary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Période</Text>
              <Text style={styles.detailValue}>
                {challenge.startDate && formatDate(challenge.startDate)} → {challenge.endDate && formatDate(challenge.endDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={18} color={Colors.textTertiary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {challenge.type === "public" ? "Public" : "Entre amis"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Proof Requirements */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.proofCard}>
          <Text style={styles.sectionTitle}>Preuve requise</Text>

          <View style={styles.proofType}>
            <Ionicons
              name={challenge.proofType === "photo" ? "camera-outline" : "image-outline"}
              size={24}
              color={Colors.accent}
            />
            <Text style={styles.proofTypeText}>
              {challenge.proofType === "photo" ? "Photo" : "Capture d'écran"}
            </Text>
          </View>

          {challenge.proofDescription && (
            <Text style={styles.proofDescription}>{challenge.proofDescription}</Text>
          )}

          {challenge.proofValidationCriteria && (
            <View style={styles.criteriaBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
              <Text style={styles.criteriaText}>{challenge.proofValidationCriteria}</Text>
            </View>
          )}
        </Animated.View>

        {/* Participants */}
        {participations && participations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.participantsCard}>
            <Text style={styles.sectionTitle}>Participants ({participations.length})</Text>
            <View style={styles.participantsList}>
              {participations.map((participation, index) => (
                <Animated.View
                  key={participation._id}
                  entering={FadeInRight.delay(350 + index * 30).duration(200)}
                >
                  <TouchableOpacity
                    style={styles.participantItem}
                    onPress={() => router.push(`/user/${participation.usertId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.participantAvatar}>
                      <Text style={styles.participantInitial}>
                        {(participation.user?.name || "A")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {participation.user?.name || "Anonyme"}
                      </Text>
                      <Text style={styles.participantStatus}>
                        {participation.status === "active" ? "En cours" : participation.status}
                      </Text>
                    </View>
                    <Text style={styles.participantBet}>{participation.betAmount}€</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Sponsor Info */}
        {challenge.sponsorName && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.sponsorCard}>
            <View style={styles.sponsorHeader}>
              <Ionicons name="gift-outline" size={20} color={Colors.warning} />
              <Text style={styles.sponsorTitle}>Sponsorisé par {challenge.sponsorName}</Text>
            </View>
            {challenge.sponsorDiscount && (
              <Text style={styles.sponsorDiscount}>{challenge.sponsorDiscount}</Text>
            )}
            {challenge.sponsorPromoCode && (
              <View style={styles.promoCodeBox}>
                <Text style={styles.promoCodeLabel}>Code promo:</Text>
                <Text style={styles.promoCode}>{challenge.sponsorPromoCode}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Chat Button - For participants and creator */}
        {(isCreator || isParticipant) && (
          <Animated.View entering={FadeInDown.delay(370).duration(400)}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleOpenChat}
              activeOpacity={0.8}
            >
              <View style={styles.chatButtonIcon}>
                <Ionicons name="chatbubbles" size={22} color={Colors.accent} />
              </View>
              <View style={styles.chatButtonContent}>
                <Text style={styles.chatButtonTitle}>Discussion du pact</Text>
                <Text style={styles.chatButtonSubtitle}>Discute avec les participants</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Delete Button - Only for creator with no participants */}
        {canDelete && (
          <Animated.View entering={FadeInDown.delay(390).duration(400)}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  <Text style={styles.deleteButtonText}>Supprimer ce pact</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Button */}
      {!isCreator && !isParticipant && challenge.status !== "completed" && (
        <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.actionBar}>
          <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.8}>
            <Text style={styles.joinButtonText}>Rejoindre ce pact</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Winner Banner
  winnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  winnerBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },

  // Title Section
  titleSection: {
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  creatorText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.warning,
  },

  // Code Card
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 4,
  },
  copiedText: {
    fontSize: 12,
    color: Colors.success,
    textAlign: "center",
    marginTop: Spacing.sm,
  },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Proof Card
  proofCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  proofType: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  proofTypeText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  proofDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  criteriaBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.successMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  criteriaText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
    lineHeight: 18,
  },

  // Participants Card
  participantsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  participantsList: {
    gap: Spacing.sm,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  participantInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  participantStatus: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  participantBet: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.success,
  },

  // Sponsor Card
  sponsorCard: {
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sponsorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sponsorTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.warning,
  },
  sponsorDiscount: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  promoCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  promoCodeLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.warning,
  },

  // Action Bar
  actionBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },

  // Chat Button
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  chatButtonIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  chatButtonContent: {
    flex: 1,
  },
  chatButtonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  chatButtonSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Delete Button
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.danger,
  },

  bottomSpacer: {
    height: 20,
  },
});
