import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";

export default function JoinChallengeScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { user, userId } = useAuth();

  const challenge = useQuery(
    api.challenges.getChallenge,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip"
  );

  const pot = useQuery(
    api.participations.getChallengePot,
    challengeId ? { challengeId: challengeId as Id<"challenges"> } : "skip"
  );

  const participation = useQuery(
    api.participations.getParticipation,
    challengeId && userId
      ? { challengeId: challengeId as Id<"challenges">, userId }
      : "skip"
  );

  const joinChallenge = useMutation(api.participations.joinChallenge);

  const [betAmount, setBetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!userId || !challengeId) {
      setError("Erreur de connexion");
      return;
    }

    const amount = parseInt(betAmount);
    if (!amount || amount < (challenge?.minBet || 0)) {
      setError(`Mise minimum: ${challenge?.minBet}€`);
      return;
    }

    if (user && amount > user.balance) {
      setError("Solde insuffisant");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await joinChallenge({
        challengeId: challengeId as Id<"challenges">,
        userId,
        betAmount: amount,
      });

      router.back();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const alreadyJoined = !!participation;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
            Rejoindre le défi
          </Text>
        </View>

        {/* Challenge Card */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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
              <Text style={{ fontSize: 28 }}>
                {challenge.category === "sport" ? "🏋️" :
                 challenge.category === "screen_time" ? "📱" :
                 challenge.category === "procrastination" ? "💼" :
                 challenge.category === "social" ? "💬" : "🎯"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                {challenge.title}
              </Text>
              <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
                {challenge.description}
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: "#2A2A2A", height: 1, marginVertical: 16 }} />

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#666" }}>Objectif</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{challenge.goal}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#666" }}>Preuve requise</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{challenge.proofType}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#666" }}>Mise minimum</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>{challenge.minBet}€</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#666" }}>Participants</Text>
              <Text style={{ color: "#22c55e", fontWeight: "600" }}>{pot?.participantCount || 0}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#666" }}>Pot total</Text>
              <Text style={{ color: "#22c55e", fontWeight: "600" }}>{pot?.total || 0}€</Text>
            </View>
          </View>

          {challenge.sponsorName && (
            <>
              <View style={{ backgroundColor: "#2A2A2A", height: 1, marginVertical: 16 }} />
              <View
                style={{
                  backgroundColor: "#2A2A2A",
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>🎁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Sponsor: {challenge.sponsorName}
                  </Text>
                  <Text style={{ color: "#22c55e", fontSize: 13 }}>
                    {challenge.sponsorDiscount}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {alreadyJoined ? (
          <View
            style={{
              backgroundColor: "#22c55e",
              borderRadius: 12,
              padding: 18,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
              Tu participes déjà à ce défi !
            </Text>
          </View>
        ) : (
          <>
            {/* Bet Amount */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Ta mise (€)
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
                placeholder={`Min ${challenge.minBet}€`}
                placeholderTextColor="#666"
                value={betAmount}
                onChangeText={setBetAmount}
                keyboardType="numeric"
              />
              <Text style={{ color: "#666", fontSize: 12, textAlign: "center", marginTop: 8 }}>
                Ton solde: {user?.balance.toFixed(2)}€
              </Text>
            </View>

            {/* Quick amounts */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {[challenge.minBet, challenge.minBet * 2, challenge.minBet * 5].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setBetAmount(amount.toString())}
                  style={{
                    flex: 1,
                    backgroundColor: betAmount === amount.toString() ? "#fff" : "#1A1A1A",
                    padding: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: betAmount === amount.toString() ? "#000" : "#fff",
                      fontWeight: "600",
                    }}
                  >
                    {amount}€
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error */}
            {error ? (
              <Text style={{ color: "#ef4444", textAlign: "center", marginBottom: 16 }}>
                {error}
              </Text>
            ) : null}

            {/* Join Button */}
            <TouchableOpacity
              onPress={handleJoin}
              disabled={isSubmitting}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 18,
                alignItems: "center",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
                  Rejoindre et miser {betAmount || challenge.minBet}€
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
