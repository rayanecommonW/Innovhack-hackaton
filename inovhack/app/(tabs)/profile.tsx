import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, userId, logout, isLoading } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const participations = useQuery(
    api.participations.getMyParticipations,
    userId ? { userId } : "skip"
  );

  const myChallenges = useQuery(
    api.challenges.getMyChallenges,
    userId ? { userId } : "skip"
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Tu veux vraiment te déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "#666", marginBottom: 16, textAlign: "center" }}>
          Tu dois être connecté pour voir ton profil
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth")}
          style={{ backgroundColor: "#fff", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "#000", fontWeight: "bold" }}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const wonCount = participations?.filter((p) => p.status === "won").length || 0;
  const lostCount = participations?.filter((p) => p.status === "lost").length || 0;
  const totalBets = participations?.length || 0;
  const winRate = totalBets > 0 ? Math.round((wonCount / totalBets) * 100) : 0;
  const totalWon = participations
    ?.filter((p) => p.status === "won")
    .reduce((sum, p) => sum + p.betAmount * 2, 0) || 0;

  const stats = [
    { label: "Défis gagnés", value: wonCount.toString(), icon: "trophy" },
    { label: "Taux de réussite", value: `${winRate}%`, icon: "trending-up" },
    { label: "Gains totaux", value: `${totalWon}€`, icon: "cash" },
    { label: "Défis créés", value: (myChallenges?.length || 0).toString(), icon: "create" },
  ];

  const menuItems = [
    { id: "challenges", title: "Mes défis créés", icon: "list-outline", count: myChallenges?.length },
    { id: "history", title: "Historique des paris", icon: "time-outline", count: participations?.length },
    { id: "help", title: "Aide & Support", icon: "help-circle-outline" },
    { id: "logout", title: "Déconnexion", icon: "log-out-outline", danger: true },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Profile Header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#1A1A1A",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 3,
              borderColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 40 }}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
            {user.name}
          </Text>
          <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
            {user.email}
          </Text>

          {/* Balance */}
          <View
            style={{
              backgroundColor: "#1A1A1A",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="wallet" size={20} color="#22c55e" />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {user.balance.toFixed(2)}€
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              style={{
                width: "47%",
                backgroundColor: "#1A1A1A",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <Ionicons
                name={stat.icon as any}
                size={24}
                color="#666"
                style={{ marginBottom: 12 }}
              />
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
                {stat.value}
              </Text>
              <Text style={{ color: "#666", fontSize: 13 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={{ marginBottom: 120 }}>
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  if (item.id === "logout") {
                    handleLogout();
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 18,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: "#2A2A2A",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.danger ? "#ef4444" : "#fff"}
                  />
                  <Text
                    style={{
                      color: item.danger ? "#ef4444" : "#fff",
                      fontSize: 16,
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {item.count !== undefined && (
                    <View
                      style={{
                        backgroundColor: "#2A2A2A",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>{item.count}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
