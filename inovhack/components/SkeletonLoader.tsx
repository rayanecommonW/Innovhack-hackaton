import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Colors, BorderRadius, Spacing } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.surfaceHighlight,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
    <Skeleton width="100%" height={60} style={{ marginTop: 16 }} />
    <View style={styles.cardFooter}>
      <Skeleton width="30%" height={24} />
      <Skeleton width={80} height={36} borderRadius={18} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
});

export default Skeleton;
