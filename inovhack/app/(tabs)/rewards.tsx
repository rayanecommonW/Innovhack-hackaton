import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";

export default function RewardsScreen() {
  const { user, userId } = useAuth();
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

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Copié !", `Le code ${code} a été copié`);
  };

  const totalSaved = rewards?.reduce((sum, r) => sum + r.amount, 0) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>Récompenses</Text>
          <Text style={{ color: "#666", fontSize: 16, marginTop: 4 }}>
            Tes gains et codes promo exclusifs
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#1A1A1A",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "#22c55e",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="gift" size={24} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
              {promoCodes?.length || 0}
            </Text>
            <Text style={{ color: "#666", fontSize: 14 }}>Codes promo</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "#1A1A1A",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons name="wallet" size={24} color="#000" />
            </View>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
              {totalSaved.toFixed(0)}€
            </Text>
            <Text style={{ color: "#666", fontSize: 14 }}>Gagnés</Text>
          </View>
        </View>

        {/* Promo Codes */}
        {promoCodes && promoCodes.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#22c55e",
                  marginRight: 8,
                }}
              />
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                Tes codes promo
              </Text>
            </View>

            {promoCodes.map((promo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => copyCode(promo.code!)}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#22c55e",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: "#2A2A2A",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 16,
                      }}
                    >
                      <Text style={{ fontSize: 28 }}>🎁</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#666", fontSize: 12, marginBottom: 2 }}>
                        {promo.sponsor}
                      </Text>
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                        {promo.code}
                      </Text>
                      <Text style={{ color: "#22c55e", fontSize: 12, marginTop: 4 }}>
                        Tap pour copier
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="copy-outline" size={24} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Rewards History */}
        <View style={{ marginBottom: 120 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="trophy" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              Historique des gains
            </Text>
          </View>

          {rewards === undefined ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
          ) : rewards.length === 0 ? (
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🏆</Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Pas encore de gains
              </Text>
              <Text style={{ color: "#666", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                Gagne un défi pour débloquer des récompenses !
              </Text>
            </View>
          ) : (
            rewards.map((reward) => (
              <View
                key={reward._id}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#22c55e",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>💰</Text>
                  </View>
                  <View>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {reward.challenge?.title || "Défi"}
                    </Text>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      {new Date(reward.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: "#22c55e", fontSize: 18, fontWeight: "bold" }}>
                  +{reward.amount.toFixed(2)}€
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
