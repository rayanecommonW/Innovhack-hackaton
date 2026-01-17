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
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";

export default function SubmitProofScreen() {
  const { participationId } = useLocalSearchParams<{ participationId: string }>();
  const { userId } = useAuth();

  const participation = useQuery(
    api.proofs.getParticipationForProof,
    participationId ? { participationId: participationId as Id<"participations"> } : "skip"
  );

  const challenge = useQuery(
    api.challenges.getChallenge,
    participation?.challengeId ? { challengeId: participation.challengeId } : "skip"
  );

  const existingProof = useQuery(
    api.proofs.getProofByParticipation,
    participationId ? { participationId: participationId as Id<"participations"> } : "skip"
  );

  const submitProof = useAction(api.proofs.submitAndValidateProof);

  const [proofContent, setProofContent] = useState("");
  const [proofValue, setProofValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ approved: boolean; comment: string } | null>(null);

  const handleSubmit = async () => {
    if (!participationId) {
      setError("Erreur de participation");
      return;
    }

    if (!proofContent.trim() && !proofValue) {
      setError("Fournis une preuve");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await submitProof({
        participationId: participationId as Id<"participations">,
        proofContent: proofContent.trim() || `Valeur: ${proofValue}`,
        proofValue: proofValue ? parseInt(proofValue) : undefined,
      });

      setResult(res.validation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge || !participation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
            Soumettre une preuve
          </Text>
        </View>

        {/* Challenge Info */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
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
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                {challenge.title}
              </Text>
              <Text style={{ color: "#666", fontSize: 14 }}>
                {challenge.goal}
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: "#2A2A2A", borderRadius: 12, padding: 16 }}>
            <Text style={{ color: "#666", fontSize: 12, marginBottom: 4 }}>Preuve requise</Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              {challenge.proofDescription}
            </Text>
          </View>
        </View>

        {/* Already submitted */}
        {existingProof ? (
          <View
            style={{
              backgroundColor: existingProof.aiValidation === "approved" ? "#22c55e" :
                             existingProof.aiValidation === "rejected" ? "#ef4444" : "#f59e0b",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {existingProof.aiValidation === "approved" ? "✅" :
               existingProof.aiValidation === "rejected" ? "❌" : "⏳"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
              {existingProof.aiValidation === "approved" ? "Preuve validée !" :
               existingProof.aiValidation === "rejected" ? "Preuve rejetée" : "En attente"}
            </Text>
            <Text style={{ color: "#fff", opacity: 0.9, textAlign: "center" }}>
              {existingProof.aiComment}
            </Text>
          </View>
        ) : result ? (
          /* Result after submission */
          <View
            style={{
              backgroundColor: result.approved ? "#22c55e" : "#ef4444",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {result.approved ? "🎉" : "😔"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
              {result.approved ? "Bravo !" : "Dommage..."}
            </Text>
            <Text style={{ color: "#fff", opacity: 0.9, textAlign: "center" }}>
              {result.comment}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: "#fff",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 20,
              }}
            >
              <Text style={{ color: "#000", fontWeight: "bold" }}>Retour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Proof Value Input */}
            {challenge.goalValue && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                  Valeur atteinte ({challenge.goalUnit})
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
                  placeholder={`Objectif: ${challenge.goalValue}`}
                  placeholderTextColor="#666"
                  value={proofValue}
                  onChangeText={setProofValue}
                  keyboardType="numeric"
                />
                <Text style={{ color: "#666", fontSize: 12, textAlign: "center", marginTop: 8 }}>
                  Objectif à atteindre: {challenge.goalValue} {challenge.goalUnit}
                </Text>
              </View>
            )}

            {/* Proof Content */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Description de ta preuve
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 12,
                  padding: 16,
                  color: "#fff",
                  fontSize: 16,
                  minHeight: 100,
                }}
                placeholder="Décris ta preuve ou colle un lien vers ton screenshot..."
                placeholderTextColor="#666"
                value={proofContent}
                onChangeText={setProofContent}
                multiline
              />
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
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator color="#000" />
                  <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
                    Validation par l'IA...
                  </Text>
                </View>
              ) : (
                <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
                  Soumettre ma preuve
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
