/**
 * StreakCalendar - Clean & Minimal
 * Inspired by Luma's elegant simplicity
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows } from "../constants/theme";

interface StreakCalendarProps {
  completedDays: number[];
  currentStreak: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ completedDays, currentStreak }) => {
  const today = new Date().getDate();
  const daysInMonth = 30;

  const getDayStyle = (day: number) => {
    if (completedDays.includes(day)) {
      return { bg: Colors.success, opacity: 1 };
    }
    if (day < today && !completedDays.includes(day)) {
      return { bg: Colors.danger, opacity: 0.6 };
    }
    if (day === today) {
      return { bg: Colors.accent, opacity: 1 };
    }
    return { bg: Colors.surfaceHighlight, opacity: 1 };
  };

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ce mois</Text>
        <View style={styles.streakBadge}>
          <Ionicons name="flame-outline" size={14} color={Colors.warning} />
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>jours</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isToday = day === today;
          const { bg, opacity } = getDayStyle(day);
          return (
            <View
              key={day}
              style={[
                styles.dayCell,
                { backgroundColor: bg, opacity },
                isToday && styles.todayCell,
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Réussi</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger, opacity: 0.6 }]} />
          <Text style={styles.legendText}>Raté</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Aujourd'hui</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.warning,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.warning,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dayCell: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.white,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
});

export default StreakCalendar;
