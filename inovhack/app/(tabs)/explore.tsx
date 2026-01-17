import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../providers/AuthProvider";
import { router } from "expo-router";
import { Id } from "../../convex/_generated/dataModel";

const categories = [
  { id: "all", name: "Tous", icon: "🔥" },
  { id: "sport", name: "Sport", icon: "🏋️" },
  { id: "procrastination", name: "Productivité", icon: "💼" },
  { id: "screen_time", name: "Screen Time", icon: "📱" },
  { id: "social", name: "Social", icon: "💬" },
];

export default function ExploreScreen() {
  const { userId } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const challenges = useQuery(api.challenges.listPublicChallenges);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredChallenges = challenges?.filter((c) => {
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const handleJoinChallenge = (challengeId: Id<"challenges">) => {
    router.push({ pathname: "/join-challenge", params: { challengeId } });
  };

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
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>Explorer</Text>
          <Text style={{ color: "#666", fontSize: 16, marginTop: 4 }}>
            Découvre les défis et les sponsors
          </Text>
        </View>

        {/* Search Bar */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            marginBottom: 24,
          }}
        >
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={{ flex: 1, color: "#fff", paddingVertical: 16, paddingHorizontal: 12, fontSize: 16 }}
            placeholder="Rechercher un défi..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 24 }}
          contentContainerStyle={{ gap: 10 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={{
                backgroundColor: selectedCategory === cat.id ? "#fff" : "#1A1A1A",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
              <Text
                style={{
                  color: selectedCategory === cat.id ? "#000" : "#fff",
                  fontWeight: "600",
                }}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Create Challenge Banner */}
        <TouchableOpacity
          onPress={() => router.push("/create-challenge")}
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#2A2A2A",
            borderStyle: "dashed",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>
                Créer ton propre défi
              </Text>
              <Text style={{ color: "#666", fontSize: 14 }}>
                Invite tes amis et pariez ensemble
              </Text>
            </View>
            <View
              style={{
                width: 50,
                height: 50,
                backgroundColor: "#fff",
                borderRadius: 25,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={28} color="#000" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Challenge Cards */}
        <View style={{ marginBottom: 120 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
            Défis disponibles ({filteredChallenges.length})
          </Text>

          {challenges === undefined ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
          ) : filteredChallenges.length === 0 ? (
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Aucun défi trouvé
              </Text>
              <Text style={{ color: "#666", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                Crée le premier défi dans cette catégorie !
              </Text>
            </View>
          ) : (
            filteredChallenges.map((challenge) => (
              <TouchableOpacity
                key={challenge._id}
                onPress={() => handleJoinChallenge(challenge._id)}
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
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: "#2A2A2A",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>
                        {challenge.category === "sport" ? "🏋️" :
                         challenge.category === "screen_time" ? "📱" :
                         challenge.category === "procrastination" ? "💼" :
                         challenge.category === "social" ? "💬" : "🎯"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                        {challenge.title}
                      </Text>
                      <Text style={{ color: "#666", fontSize: 13, marginTop: 2 }}>
                        {challenge.goal}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View>
                      <Text style={{ color: "#666", fontSize: 12 }}>Mise min</Text>
                      <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                        {challenge.minBet}€
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: "#666", fontSize: 12 }}>Type</Text>
                      <Text style={{ color: "#22c55e", fontSize: 14, fontWeight: "600" }}>
                        {challenge.type === "public" ? "Public" : "Amis"}
                      </Text>
                    </View>
                  </View>
                  {challenge.sponsorName && (
                    <View style={{ backgroundColor: "#2A2A2A", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                        🎁 {challenge.sponsorName}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
