import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/theme";

interface StreakCalendarProps {
  completedDays: number[]; // Array of day numbers (1-30) that are completed
  currentStreak: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ completedDays, currentStreak }) => {
  const today = new Date().getDate();
  const daysInMonth = 30;

  const getDayColor = (day: number) => {
    if (completedDays.includes(day)) {
      return Colors.success;
    }
    if (day < today && !completedDays.includes(day)) {
      return Colors.danger + "40";
    }
    if (day === today) {
      return Colors.accent;
    }
    return Colors.surfaceHighlight;
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Ce mois-ci</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak} jours</Text>
          </View>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isToday = day === today;
          return (
            <View
              key={day}
              style={[
                styles.dayCell,
                { backgroundColor: getDayColor(day) },
                isToday && styles.todayCell,
              ]}
            >
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Validé</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger + "40" }]} />
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
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    ...Typography.labelSmall,
    color: "#FF6B00",
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.black,
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
    borderRadius: 3,
  },
  legendText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});

export default StreakCalendar;
