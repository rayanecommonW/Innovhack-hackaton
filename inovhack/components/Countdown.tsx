/**
 * Countdown Component
 * Elegant countdown timer for pact deadlines
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius, Typography } from "../constants/theme";

interface CountdownProps {
  endDate: number;
  compact?: boolean;
  showWarning?: boolean;
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function Countdown({
  endDate,
  compact = false,
  showWarning = true,
  onComplete,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const now = Date.now();
    const difference = endDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 60 * 60 * 1000; // < 1h
  const isWarning = timeLeft.total > 0 && timeLeft.total < 24 * 60 * 60 * 1000; // < 24h
  const isExpired = timeLeft.total <= 0;

  if (compact) {
    if (isExpired) {
      return (
        <View style={[styles.compactContainer, styles.expiredContainer]}>
          <Text style={styles.compactExpired}>Terminé</Text>
        </View>
      );
    }

    const text =
      timeLeft.days > 0
        ? `${timeLeft.days}j ${timeLeft.hours}h`
        : timeLeft.hours > 0
          ? `${timeLeft.hours}h ${timeLeft.minutes}m`
          : `${timeLeft.minutes}m ${timeLeft.seconds}s`;

    return (
      <View
        style={[
          styles.compactContainer,
          isUrgent && styles.urgentContainer,
          isWarning && !isUrgent && styles.warningContainer,
        ]}
      >
        <Text
          style={[
            styles.compactText,
            isUrgent && styles.urgentText,
            isWarning && !isUrgent && styles.warningText,
          ]}
        >
          {text}
        </Text>
      </View>
    );
  }

  // Full display
  if (isExpired) {
    return (
      <View style={[styles.fullContainer, styles.expiredFullContainer]}>
        <Text style={styles.expiredTitle}>Temps écoulé</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      {showWarning && isWarning && (
        <Text style={[styles.warningLabel, isUrgent && styles.urgentLabel]}>
          {isUrgent ? "Dernière heure !" : "Moins de 24h"}
        </Text>
      )}
      <View style={styles.unitsRow}>
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="j" isUrgent={isUrgent} />
        )}
        <TimeUnit value={timeLeft.hours} label="h" isUrgent={isUrgent} />
        <TimeUnit value={timeLeft.minutes} label="m" isUrgent={isUrgent} />
        <TimeUnit value={timeLeft.seconds} label="s" isUrgent={isUrgent} />
      </View>
    </View>
  );
}

function TimeUnit({
  value,
  label,
  isUrgent,
}: {
  value: number;
  label: string;
  isUrgent: boolean;
}) {
  return (
    <View style={styles.unitContainer}>
      <Text style={[styles.unitValue, isUrgent && styles.urgentUnitValue]}>
        {value.toString().padStart(2, "0")}
      </Text>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  compactText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  compactExpired: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  warningContainer: {
    backgroundColor: Colors.warningMuted,
  },
  warningText: {
    color: Colors.warning,
  },
  urgentContainer: {
    backgroundColor: Colors.dangerMuted,
  },
  urgentText: {
    color: Colors.danger,
  },
  expiredContainer: {
    backgroundColor: Colors.surfaceSecondary,
  },

  // Full styles
  fullContainer: {
    alignItems: "center",
  },
  warningLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  urgentLabel: {
    color: Colors.danger,
  },
  unitsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  unitContainer: {
    alignItems: "center",
    minWidth: 36,
  },
  unitValue: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  urgentUnitValue: {
    color: Colors.danger,
  },
  unitLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textTertiary,
    marginTop: 2,
  },
  expiredFullContainer: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textMuted,
  },
});
