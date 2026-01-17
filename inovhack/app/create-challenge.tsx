import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router } from "expo-router";

const categories = [
  { id: "sport", name: "Sport", icon: "🏋️" },
  { id: "procrastination", name: "Productivité", icon: "💼" },
  { id: "screen_time", name: "Screen Time", icon: "📱" },
  { id: "social", name: "Social", icon: "💬" },
];

export default function CreateChallengeScreen() {
  const { userId } = useAuth();
  const createChallenge = useAction(api.challenges.createChallengeWithAI);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sport");
  const [type, setType] = useState<"public" | "friends">("public");
  const [goal, setGoal] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [minBet, setMinBet] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!userId) {
      setError("Tu dois être connecté");
      return;
    }

    if (!title.trim() || !goal.trim() || !goalValue || !goalUnit.trim()) {
      setError("Remplis tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createChallenge({
        title: title.trim(),
        description: description.trim() || title.trim(),
        category,
        type,
        creatorId: userId,
        goal: goal.trim(),
        goalValue: parseInt(goalValue),
        goalUnit: goalUnit.trim(),
        minBet: parseInt(minBet) || 10,
        durationDays: parseInt(durationDays) || 7,
      });

      router.back();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du défi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
              Créer un défi
            </Text>
          </View>

          {/* Title */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Titre du défi *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 12,
                padding: 16,
                color: "#fff",
                fontSize: 16,
              }}
              placeholder="Ex: 10K Steps Challenge"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Description
            </Text>
            <TextInput
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 12,
                padding: 16,
                color: "#fff",
                fontSize: 16,
                minHeight: 80,
              }}
              placeholder="Décris ton défi..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Category */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Catégorie
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={{
                      backgroundColor: category === cat.id ? "#fff" : "#1A1A1A",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                    <Text
                      style={{
                        color: category === cat.id ? "#000" : "#fff",
                        fontWeight: "600",
                      }}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Type */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Type de défi
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setType("public")}
                style={{
                  flex: 1,
                  backgroundColor: type === "public" ? "#fff" : "#1A1A1A",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={type === "public" ? "#000" : "#fff"}
                />
                <Text
                  style={{
                    color: type === "public" ? "#000" : "#fff",
                    fontWeight: "600",
                    marginTop: 8,
                  }}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("friends")}
                style={{
                  flex: 1,
                  backgroundColor: type === "friends" ? "#fff" : "#1A1A1A",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={24}
                  color={type === "friends" ? "#000" : "#fff"}
                />
                <Text
                  style={{
                    color: type === "friends" ? "#000" : "#fff",
                    fontWeight: "600",
                    marginTop: 8,
                  }}
                >
                  Entre amis
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Objectif *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: 12,
                padding: 16,
                color: "#fff",
                fontSize: 16,
              }}
              placeholder="Ex: Faire 10000 pas par jour"
              placeholderTextColor="#666"
              value={goal}
              onChangeText={setGoal}
            />
          </View>

          {/* Goal Value & Unit */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Valeur cible *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 16,
                }}
                placeholder="10000"
                placeholderTextColor="#666"
                value={goalValue}
                onChangeText={setGoalValue}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Unité *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 16,
                }}
                placeholder="pas"
                placeholderTextColor="#666"
                value={goalUnit}
                onChangeText={setGoalUnit}
              />
            </View>
          </View>

          {/* Min Bet & Duration */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Mise minimum (€)
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 16,
                }}
                placeholder="10"
                placeholderTextColor="#666"
                value={minBet}
                onChangeText={setMinBet}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Durée (jours)
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 16,
                }}
                placeholder="7"
                placeholderTextColor="#666"
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Error */}
          {error ? (
            <Text style={{ color: "#ef4444", textAlign: "center", marginBottom: 16 }}>
              {error}
            </Text>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 18,
              alignItems: "center",
              marginBottom: 40,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
                Créer le défi
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
