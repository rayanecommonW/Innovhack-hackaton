import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";

export default function HomeScreen() {
  const { user, userId, isLoading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#666", marginBottom: 16 }}>Non connecté</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth")}
          style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "#000", fontWeight: "bold" }}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const activeParticipations = participations?.filter((p) => p.status === "active") || [];
  const weeklyGain = participations
    ?.filter((p) => p.status === "won")
    .reduce((sum, p) => sum + p.betAmount, 0) || 0;

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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <View>
            <Text style={{ color: "#666", fontSize: 14 }}>Bienvenue</Text>
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
              {user.name} 🎯
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#1A1A1A",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>Ton solde</Text>
          <Text style={{ color: "#fff", fontSize: 42, fontWeight: "bold" }}>
            {user.balance.toFixed(2)}€
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
            {weeklyGain > 0 && (
              <View style={{ backgroundColor: "#22c55e", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                  +{weeklyGain.toFixed(2)}€ gagnés
                </Text>
              </View>
            )}
            <View style={{ backgroundColor: "#2A2A2A", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: "#fff", fontSize: 12 }}>
                {user.totalWins} victoires
              </Text>
            </View>
          </View>
        </View>

        {/* Active Bets Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              Défis en cours ({activeParticipations.length})
            </Text>
          </View>

          {participations === undefined ? (
            <ActivityIndicator color="#fff" />
          ) : activeParticipations.length === 0 ? (
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                Aucun défi en cours
              </Text>
              <Text style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
                Rejoins un défi dans l'onglet Explorer
              </Text>
            </View>
          ) : (
            activeParticipations.map((p) => (
              <TouchableOpacity
                key={p._id}
                onPress={() => router.push({ pathname: "/submit-proof", params: { participationId: p._id } })}
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "#2A2A2A",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>
                        {p.challenge?.category === "sport" ? "🏋️" :
                         p.challenge?.category === "screen_time" ? "📱" :
                         p.challenge?.category === "procrastination" ? "💼" :
                         p.challenge?.category === "social" ? "💬" : "🎯"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                        {p.challenge?.title || "Défi"}
                      </Text>
                      <Text style={{ color: "#666", fontSize: 13 }}>
                        {p.challenge?.goal}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: "#22c55e", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Actif</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#666", fontSize: 13 }}>
                    Tap pour soumettre une preuve
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {p.betAmount}€ misés
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 120 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
            Actions rapides
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/create-challenge")}
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Ionicons name="add-circle" size={28} color="#000" />
              <Text style={{ color: "#000", fontSize: 14, fontWeight: "600", marginTop: 8 }}>
                Créer un défi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore" as any)}
              style={{
                flex: 1,
                backgroundColor: "#1A1A1A",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Ionicons name="compass" size={28} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 8 }}>
                Explorer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
