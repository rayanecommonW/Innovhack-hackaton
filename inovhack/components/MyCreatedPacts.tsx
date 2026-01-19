/**
 * My Created Pacts Component
 * Shows pacts created by the user with participants
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

interface MyCreatedPactsProps {
  userId: Id<"users">;
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: Colors.warning },
  active: { label: "Actif", color: Colors.success },
  completed: { label: "Terminé", color: Colors.info },
};

export default function MyCreatedPacts({
  userId,
  limit,
  showTitle = true,
  compact = false,
}: MyCreatedPactsProps) {
  const challenges = useQuery(
    api.challenges.getMyCreatedChallengesWithParticipants,
    { userId }
  );

  if (!challenges || challenges.length === 0) {
    return null;
  }

  const displayedChallenges = limit ? challenges.slice(0, limit) : challenges;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="create-outline" size={20} color={Colors.accent} />
            <Text style={styles.headerTitle}>Mes pacts créés</Text>
          </View>
          {limit && challenges.length > limit && (
            <TouchableOpacity onPress={() => router.push("/my-pacts")}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.pactsList}>
        {displayedChallenges.map((challenge, index) => (
          <Animated.View
            key={challenge._id}
            entering={FadeInRight.delay(index * 50).duration(300)}
          >
            <TouchableOpacity
              style={[styles.pactCard, compact && styles.pactCardCompact]}
              activeOpacity={0.9}
              onPress={() => router.push(`/challenge/${challenge._id}`)}
            >
              {/* Status Badge */}
              <View style={[
                styles.statusBadge,
                { backgroundColor: (STATUS_CONFIG[challenge.status || "pending"]?.color || Colors.textMuted) + "20" }
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_CONFIG[challenge.status || "pending"]?.color || Colors.textMuted }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: STATUS_CONFIG[challenge.status || "pending"]?.color || Colors.textMuted }
                ]}>
                  {STATUS_CONFIG[challenge.status || "pending"]?.label || "En attente"}
                </Text>
              </View>

              {/* Challenge Info */}
              <Text style={styles.pactTitle} numberOfLines={2}>{challenge.title}</Text>

              <View style={styles.pactMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{getCategoryName(challenge.category)}</Text>
                </View>
                {challenge.inviteCode && (
                  <View style={styles.codeBadge}>
                    <Ionicons name="key-outline" size={12} color={Colors.accent} />
                    <Text style={styles.codeText}>{challenge.inviteCode}</Text>
                  </View>
                )}
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="people" size={16} color={Colors.textTertiary} />
                  <Text style={styles.statValue}>{challenge.participantCount}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="wallet" size={16} color={Colors.success} />
                  <Text style={[styles.statValue, { color: Colors.success }]}>{challenge.totalPot}€</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="cash" size={16} color={Colors.textTertiary} />
                  <Text style={styles.statValue}>min {challenge.minBet}€</Text>
                </View>
              </View>

              {/* Participants Preview */}
              {challenge.participants.length > 0 && (
                <View style={styles.participantsSection}>
                  <Text style={styles.participantsLabel}>Participants</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.participantsList}
                  >
                    {challenge.participants.map((participant, pIndex) => (
                      <TouchableOpacity
                        key={participant.participationId}
                        style={styles.participantItem}
                        onPress={() => router.push(`/user/${participant.userId}`)}
                      >
                        {participant.profileImageUrl ? (
                          <Image
                            source={{ uri: participant.profileImageUrl }}
                            style={styles.participantAvatar}
                          />
                        ) : (
                          <View style={[styles.participantAvatar, styles.participantAvatarPlaceholder]}>
                            <Text style={styles.participantInitial}>
                              {(participant.name || "A")[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName} numberOfLines={1}>
                            {participant.name}
                          </Text>
                          <Text style={styles.participantBet}>{participant.betAmount}€</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {challenge.participants.length === 0 && (
                <View style={styles.noParticipants}>
                  <Ionicons name="hourglass-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.noParticipantsText}>En attente de participants</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.accent,
  },

  // Pacts List
  pactsList: {
    gap: Spacing.md,
  },
  pactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  pactCardCompact: {
    padding: Spacing.md,
  },

  // Status
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Challenge Info
  pactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  pactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  codeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent,
    fontVariant: ["tabular-nums"],
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },

  // Participants
  participantsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  participantsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  participantsList: {
    gap: Spacing.sm,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    minWidth: 120,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  participantAvatarPlaceholder: {
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  participantInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  participantBet: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },

  // No participants
  noParticipants: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  noParticipantsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
