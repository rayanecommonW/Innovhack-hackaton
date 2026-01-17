import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";

export default function RewardsScreen() {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const rewards = useQuery(
    api.rewards.getMyRewards,
    userId ? { userId } : "skip"
  );

  const promoCodes = useQuery(
    api.rewards.getMyPromoCodes,
    userId ? { userId } : "skip"
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const shareCode = async (code: string) => {
    try {
      await Share.share({ message: code });
    } catch (error) {
      Alert.alert("Code", code);
    }
  };

  const totalEarned = rewards?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Gains</Text>
        </Animated.View>

        {/* Total */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total gagné</Text>
          <Text style={styles.totalAmount}>{totalEarned.toFixed(0)}€</Text>
        </Animated.View>

        {/* Promo Codes */}
        {promoCodes && promoCodes.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Codes promo</Text>
            <View style={styles.codesList}>
              {promoCodes.map((promo: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => promo.code && shareCode(promo.code)}
                  style={styles.codeCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.codeMain}>
                    <Text style={styles.codeSponsor}>{promo.sponsor}</Text>
                    <Text style={styles.codeValue}>{promo.code}</Text>
                  </View>
                  <Ionicons name="share-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* History */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Historique</Text>

          {rewards === undefined ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : rewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Pas encore de gains</Text>
            </View>
          ) : (
            <View style={styles.rewardsList}>
              {rewards.map((reward: any) => (
                <View key={reward._id} style={styles.rewardCard}>
                  <View style={styles.rewardMain}>
                    <Text style={styles.rewardTitle}>
                      {reward.challenge?.title || "Pact"}
                    </Text>
                    <Text style={styles.rewardDate}>
                      {new Date(reward.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <Text style={styles.rewardAmount}>+{reward.amount.toFixed(0)}€</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  totalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.success,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  loadingSection: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  codesList: {
    gap: Spacing.sm,
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  codeMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  codeSponsor: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  codeValue: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  rewardsList: {
    gap: Spacing.sm,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rewardMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  rewardTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  rewardDate: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  rewardAmount: {
    ...Typography.headlineSmall,
    color: Colors.success,
  },
  bottomSpacer: {
    height: 120,
  },
});
