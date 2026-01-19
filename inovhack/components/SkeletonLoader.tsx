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

// Profile skeleton
export const SkeletonProfile: React.FC = () => (
  <View style={styles.profile}>
    <Skeleton width={80} height={80} borderRadius={40} />
    <View style={styles.profileInfo}>
      <Skeleton width="60%" height={20} />
      <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
    </View>
  </View>
);

// Stats row skeleton
export const SkeletonStats: React.FC = () => (
  <View style={styles.statsRow}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.statBox}>
        <Skeleton width={40} height={24} />
        <Skeleton width={50} height={12} style={{ marginTop: 6 }} />
      </View>
    ))}
  </View>
);

// Balance card skeleton
export const SkeletonBalance: React.FC = () => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceHeader}>
      <Skeleton width={20} height={20} borderRadius={10} />
      <Skeleton width={100} height={14} />
    </View>
    <View style={styles.balanceRow}>
      <Skeleton width={120} height={32} />
      <Skeleton width={80} height={36} borderRadius={18} />
    </View>
  </View>
);

// Quick action skeleton
export const SkeletonQuickActions: React.FC = () => (
  <View style={styles.quickActions}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.quickAction}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
      </View>
    ))}
  </View>
);

// Action card skeleton
export const SkeletonActionCard: React.FC = () => (
  <View style={styles.actionCard}>
    <View style={styles.actionCardRow}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  </View>
);

// Pact card skeleton
export const SkeletonPact: React.FC = () => (
  <View style={styles.pactCard}>
    <View style={{ flex: 1 }}>
      <Skeleton width="70%" height={16} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </View>
    <View style={styles.pactRight}>
      <Skeleton width={50} height={20} />
      <Skeleton width={40} height={40} borderRadius={20} />
    </View>
  </View>
);

// Home skeleton
export const SkeletonHome: React.FC = () => (
  <View style={styles.homeContainer}>
    {/* Header */}
    <View style={styles.homeHeader}>
      <View>
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={28} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={80} height={50} borderRadius={12} />
    </View>

    {/* Stats */}
    <Skeleton width="100%" height={120} borderRadius={16} style={{ marginTop: Spacing.lg }} />

    {/* Actions */}
    <Skeleton width="100%" height={70} borderRadius={12} style={{ marginTop: Spacing.lg }} />
    <Skeleton width="100%" height={70} borderRadius={12} style={{ marginTop: Spacing.sm }} />

    {/* Activity */}
    <Skeleton width="100%" height={150} borderRadius={16} style={{ marginTop: Spacing.xl }} />

    {/* Calendar */}
    <Skeleton width="100%" height={180} borderRadius={16} style={{ marginTop: Spacing.lg }} />
  </View>
);

// Explore skeleton
export const SkeletonExplore: React.FC = () => (
  <View style={styles.exploreContainer}>
    {/* Search */}
    <Skeleton width="100%" height={44} borderRadius={12} />

    {/* Category filter */}
    <View style={{ marginTop: Spacing.md }}>
      <Skeleton width={150} height={36} borderRadius={18} />
    </View>

    {/* Section header */}
    <View style={styles.sectionHeader}>
      <Skeleton width={150} height={16} />
      <Skeleton width={80} height={24} borderRadius={12} />
    </View>

    {/* Horizontal cards */}
    <View style={styles.horizontalCards}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width={220} height={200} borderRadius={16} />
      ))}
    </View>

    {/* More sections */}
    <View style={styles.sectionHeader}>
      <Skeleton width={130} height={16} />
      <Skeleton width={70} height={24} borderRadius={12} />
    </View>

    <View style={styles.horizontalCards}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} width={160} height={140} borderRadius={16} />
      ))}
    </View>
  </View>
);

// Groups skeleton
export const SkeletonGroups: React.FC = () => (
  <View style={styles.groupsContainer}>
    {/* Header */}
    <View style={styles.groupsHeader}>
      <View>
        <Skeleton width={100} height={28} />
        <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={40} height={40} borderRadius={20} />
    </View>

    {/* Group cards */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.groupCard}>
        <View style={styles.groupCardHeader}>
          <View>
            <Skeleton width={140} height={18} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Skeleton width={60} height={24} borderRadius={12} />
              <Skeleton width={50} height={24} borderRadius={12} />
            </View>
          </View>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
        <Skeleton width="100%" height={60} borderRadius={8} style={{ marginTop: Spacing.md }} />
        <Skeleton width="100%" height={44} borderRadius={8} style={{ marginTop: Spacing.md }} />
      </View>
    ))}
  </View>
);

// Profile page skeleton
export const SkeletonProfilePage: React.FC = () => (
  <View style={styles.profilePageContainer}>
    {/* Profile header */}
    <SkeletonProfile />

    {/* Badges */}
    <View style={styles.badgesRow}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width={70} height={65} borderRadius={8} />
      ))}
    </View>

    {/* Balance */}
    <SkeletonBalance />

    {/* Stats */}
    <SkeletonStats />

    {/* Quick actions */}
    <SkeletonQuickActions />

    {/* Action cards */}
    {[1, 2, 3, 4].map((i) => (
      <SkeletonActionCard key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
  },

  // Profile styles
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },

  // Stats styles
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  // Balance styles
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Quick actions styles
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickAction: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },

  // Action card styles
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Pact styles
  pactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pactRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  // Home styles
  homeContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  // Explore styles
  exploreContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  horizontalCards: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  // Groups styles
  groupsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  groupsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  groupCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Profile page styles
  profilePageContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  badgesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});

export default Skeleton;
