/**
 * Transactions History Screen
 * Detailed transaction history with filters
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "../constants/theme";

const TRANSACTION_TYPES: Record<string, { icon: string; color: string; label: string }> = {
  deposit: { icon: "arrow-down-circle", color: Colors.success, label: "Dépôt" },
  withdrawal: { icon: "arrow-up-circle", color: Colors.danger, label: "Retrait" },
  bet: { icon: "game-controller", color: Colors.accent, label: "Mise" },
  win: { icon: "trophy", color: Colors.warning, label: "Gain" },
  refund: { icon: "refresh-circle", color: Colors.info, label: "Remboursement" },
  referral_bonus: { icon: "gift", color: Colors.success, label: "Bonus parrainage" },
};

const FILTER_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "deposit", label: "Dépôts" },
  { value: "withdrawal", label: "Retraits" },
  { value: "bet", label: "Mises" },
  { value: "win", label: "Gains" },
  { value: "refund", label: "Remboursements" },
];

export default function TransactionsScreen() {
  const { userId } = useAuth();
  const [filter, setFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const transactions = useQuery(
    api.transactions.getTransactionHistory,
    userId ? { userId, type: filter || undefined } : "skip"
  );

  const summary = useQuery(
    api.transactions.getTransactionSummary,
    userId ? { userId } : "skip"
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Summary */}
      {summary && (
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total entrant</Text>
              <Text style={[styles.summaryValue, styles.summaryPositive]}>
                +{summary.totalIn.toFixed(0)}€
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total sortant</Text>
              <Text style={[styles.summaryValue, styles.summaryNegative]}>
                -{summary.totalOut.toFixed(0)}€
              </Text>
            </View>
          </View>
          <View style={styles.netContainer}>
            <Text style={styles.netLabel}>Profit sur les pacts</Text>
            <Text
              style={[
                styles.netValue,
                summary.netProfit >= 0 ? styles.summaryPositive : styles.summaryNegative,
              ]}
            >
              {summary.netProfit >= 0 ? "+" : ""}
              {summary.netProfit.toFixed(0)}€
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Filter */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filterButton,
                filter === option.value && styles.filterButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === option.value && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
        }
      >
        {!transactions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction: any, index: number) => (
              <Animated.View
                key={transaction._id}
                entering={FadeInDown.delay(150 + index * 30).duration(300)}
              >
                <TransactionItem transaction={transaction} />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const config = TRANSACTION_TYPES[transaction.type] || {
    icon: "ellipse",
    color: Colors.textMuted,
    label: transaction.type,
  };

  const isPositive = transaction.amount > 0;
  const date = new Date(transaction.createdAt);
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionIcon, { backgroundColor: config.color + "15" }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionLabel}>{config.label}</Text>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{dateStr}</Text>
          {transaction.status === "pending" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>En cours</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          isPositive ? styles.amountPositive : styles.amountNegative,
        ]}
      >
        {isPositive ? "+" : ""}
        {transaction.amount.toFixed(2)}€
      </Text>
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

  // Summary
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  summaryPositive: {
    color: Colors.success,
  },
  summaryNegative: {
    color: Colors.danger,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  netContainer: {
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  netLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  netValue: {
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  // Filter
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
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
  filterTextActive: {
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

  // List
  transactionsList: {
    gap: Spacing.sm,
  },

  // Card
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.xs,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  transactionDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.warning,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  amountPositive: {
    color: Colors.success,
  },
  amountNegative: {
    color: Colors.textPrimary,
  },

  bottomSpacer: {
    height: 40,
  },
});
