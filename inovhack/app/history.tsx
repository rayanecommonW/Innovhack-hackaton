/**
 * History Screen - Completed Pacts
 * LUMA-inspired: clean, elegant history view
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { getCategoryName } from "../constants/categories";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";
import { SkeletonList } from "../components/SkeletonLoader";
import ConfettiCelebration, { ConfettiRef } from "../components/ConfettiCelebration";

type FilterType = "all" | "won" | "lost" | "completed";

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: "all", label: "Tous", color: Colors.textPrimary },
  { key: "won", label: "Gagnés", color: Colors.success },
  { key: "lost", label: "Perdus", color: Colors.danger },
  { key: "completed", label: "Terminés", color: Colors.info },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  won: {
    label: "Gagné",
    color: Colors.success,
    bgColor: Colors.successMuted,
    icon: "trophy",
  },
  lost: {
    label: "Perdu",
    color: Colors.danger,
    bgColor: Colors.dangerMuted,
    icon: "close-circle",
  },
  completed: {
    label: "Terminé",
    color: Colors.info,
    bgColor: Colors.infoMuted,
    icon: "checkmark-circle",
  },
  expired: {
    label: "Expiré",
    color: Colors.textMuted,
    bgColor: Colors.surfaceHighlight,
    icon: "time",
  },
};

export default function HistoryScreen() {
  const { userId } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Trigger confetti when user has won pacts
  useEffect(() => {
    if (participations && !hasShownConfetti) {
      const hasWonPacts = participations.some((p: any) => p.status === "won");
      if (hasWonPacts) {
        // Delay confetti for smooth animation
        const timer = setTimeout(() => {
          confettiRef.current?.fire();
          setHasShownConfetti(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [participations, hasShownConfetti]);

  // Filter only finished pacts
  const finishedPacts = participations?.filter((p: any) =>
    ["won", "lost", "completed", "expired"].includes(p.status)
  ) || [];

  // Apply filter
  const filteredPacts = filter === "all"
    ? finishedPacts
    : finishedPacts.filter((p: any) => p.status === filter);

  // Calculate stats
  const wonCount = finishedPacts.filter((p: any) => p.status === "won").length;
  const lostCount = finishedPacts.filter((p: any) => p.status === "lost").length;
  const totalEarned = finishedPacts
    .filter((p: any) => p.status === "won")
    .reduce((sum: number, p: any) => sum + (p.betAmount || 0), 0);
  const totalLost = finishedPacts
    .filter((p: any) => p.status === "lost")
    .reduce((sum: number, p: any) => sum + (p.betAmount || 0), 0);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Confetti celebration for wins */}
      <ConfettiCelebration ref={confettiRef} />

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Historique</Text>
          <Text style={styles.headerSubtitle}>Tes pacts terminés</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Stats Summary */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{wonCount}</Text>
              <Text style={styles.statLabel}>Gagnés</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.danger }]}>{lostCount}</Text>
              <Text style={styles.statLabel}>Perdus</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.success }]}>+{totalEarned}€</Text>
              <Text style={styles.statLabel}>Gagné</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.danger }]}>-{totalLost}€</Text>
              <Text style={styles.statLabel}>Perdu</Text>
            </View>
          </View>
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterButton,
                filter === f.key && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && { color: Colors.white },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Pacts List */}
        {participations === undefined ? (
          <SkeletonList count={5} />
        ) : filteredPacts.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="folder-open-outline" size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Aucun pact terminé</Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Tu n'as pas encore terminé de pact"
                : `Aucun pact ${filter === "won" ? "gagné" : filter === "lost" ? "perdu" : "terminé"}`
              }
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.pactsList}>
            {filteredPacts.map((pact: any, index: number) => {
              const statusConfig = STATUS_CONFIG[pact.status] || STATUS_CONFIG.completed;

              return (
                <Animated.View
                  key={pact._id}
                  entering={FadeInUp.delay(200 + index * 50).duration(300)}
                >
                  <TouchableOpacity style={styles.pactCard} activeOpacity={0.9}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                      <Ionicons
                        name={statusConfig.icon as any}
                        size={14}
                        color={statusConfig.color}
                      />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.pactContent}>
                      <Text style={styles.pactTitle} numberOfLines={2}>
                        {pact.challenge?.title || "Pact"}
                      </Text>
                      <View style={styles.pactMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>
                            {pact.challenge?.category ? getCategoryName(pact.challenge.category) : ""}
                          </Text>
                        </View>
                        {pact._creationTime && (
                          <Text style={styles.pactDate}>
                            {formatDate(pact._creationTime)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.pactAmountBox}>
                      <Text style={[
                        styles.pactAmount,
                        { color: pact.status === "won" ? Colors.success :
                                 pact.status === "lost" ? Colors.danger : Colors.textPrimary }
                      ]}>
                        {pact.status === "won" ? "+" : pact.status === "lost" ? "-" : ""}{pact.betAmount}€
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Stats
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Filters
  filtersRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    ...Shadows.xs,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
  },

  // Pacts
  pactsList: {
    gap: Spacing.sm,
  },
  pactCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
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
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  pactContent: {
    flex: 1,
    marginBottom: Spacing.sm,
  },
  pactTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  pactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  pactDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pactAmountBox: {
    alignSelf: "flex-end",
  },
  pactAmount: {
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  bottomSpacer: {
    height: 40,
  },
});
