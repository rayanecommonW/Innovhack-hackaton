import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DataPoint {
  date: string;
  value: number;
}

interface GainsChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

const GainsChart: React.FC<GainsChartProps> = ({
  data,
  title = "Évolution des gains",
  height = 180,
}) => {
  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Pas assez de données</Text>
        </View>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - Spacing.xl * 4;
  const chartHeight = height - 80;
  const padding = 20;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate points
  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (chartWidth - padding * 2),
    y: chartHeight - padding - ((d.value - minValue) / range) * (chartHeight - padding * 2),
    value: d.value,
    date: d.date,
  }));

  // Create SVG path
  const pathData = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;

    // Smooth curve
    const prev = points[i - 1];
    const cpX = (prev.x + point.x) / 2;
    return `${path} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  // Area path (for gradient fill)
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  const totalGain = values.reduce((sum, v) => sum + v, 0);
  const lastValue = values[values.length - 1];
  const isPositive = totalGain >= 0;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.totalBadge, isPositive ? styles.totalPositive : styles.totalNegative]}>
          <Text style={[styles.totalText, isPositive ? styles.totalTextPositive : styles.totalTextNegative]}>
            {isPositive ? "+" : ""}{totalGain.toFixed(0)}€
          </Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { height: chartHeight }]}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isPositive ? Colors.success : Colors.danger} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={isPositive ? Colors.success : Colors.danger} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#gradient)" />

          {/* Line */}
          <Path
            d={pathData}
            stroke={isPositive ? Colors.success : Colors.danger}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Last point indicator */}
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={6}
            fill={isPositive ? Colors.success : Colors.danger}
          />
          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={3}
            fill="#FFFFFF"
          />
        </Svg>

        {/* Zero line */}
        {minValue < 0 && maxValue > 0 && (
          <View
            style={[
              styles.zeroLine,
              {
                top: chartHeight - padding - ((0 - minValue) / range) * (chartHeight - padding * 2),
              },
            ]}
          />
        )}
      </View>

      {/* Date labels */}
      <View style={styles.dateLabels}>
        <Text style={styles.dateLabel}>{data[0].date}</Text>
        <Text style={styles.dateLabel}>{data[data.length - 1].date}</Text>
      </View>
    </Animated.View>
  );
};

// Simple stats card
export const GainsStats: React.FC<{
  totalGains: number;
  totalLosses: number;
  winRate: number;
}> = ({ totalGains, totalLosses, winRate }) => (
  <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Gains</Text>
      <Text style={[styles.statValue, styles.statPositive]}>+{totalGains}€</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Pertes</Text>
      <Text style={[styles.statValue, styles.statNegative]}>-{totalLosses}€</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>Taux</Text>
      <Text style={[styles.statValue, winRate >= 50 ? styles.statPositive : styles.statNegative]}>
        {winRate}%
      </Text>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  totalBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  totalPositive: {
    backgroundColor: Colors.successMuted,
  },
  totalNegative: {
    backgroundColor: Colors.dangerMuted,
  },
  totalText: {
    ...Typography.labelMedium,
    fontWeight: "700",
  },
  totalTextPositive: {
    color: Colors.success,
  },
  totalTextNegative: {
    color: Colors.danger,
  },
  chartContainer: {
    position: "relative",
  },
  zeroLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: Colors.textTertiary,
    opacity: 0.3,
  },
  dateLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  dateLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.headlineSmall,
    fontWeight: "700",
  },
  statPositive: {
    color: Colors.success,
  },
  statNegative: {
    color: Colors.danger,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});

export default GainsChart;
