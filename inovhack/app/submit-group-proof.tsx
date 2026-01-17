import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";
import ConfettiCelebration, { ConfettiRef } from "../components/ConfettiCelebration";

type ProofType = "camera" | "gallery" | "document" | null;

export default function SubmitGroupProofScreen() {
  const { taskId, groupId } = useLocalSearchParams<{ taskId: string; groupId: string }>();
  const { userId } = useAuth();
  const [selectedProofType, setSelectedProofType] = useState<ProofType>(null);
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const completeTask = useMutation(api.groups.completeTask);

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedProofType("camera");
      setProofUri(result.assets[0].uri);
      setProofName("Photo prise");
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "L'accès aux photos est nécessaire");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedProofType("gallery");
      setProofUri(result.assets[0].uri);
      setProofName("Photo sélectionnée");
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedProofType("document");
        setProofUri(result.assets[0].uri);
        setProofName(result.assets[0].name);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner le document");
    }
  };

  const handleSubmit = async () => {
    if (!userId || !taskId || !proofUri) {
      Alert.alert("Erreur", "Veuillez sélectionner une preuve");
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, you would upload the proof to storage first
      // For now, we'll just pass the URI as proof
      await completeTask({
        taskId: taskId as Id<"groupTasks">,
        userId,
        proofUrl: proofUri,
      });

      // Fire confetti!
      confettiRef.current?.fire();

      setTimeout(() => {
        Alert.alert(
          "Bravo! 🎉",
          "Ta preuve a été soumise avec succès!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }, 500);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearProof = () => {
    setSelectedProofType(null);
    setProofUri(null);
    setProofName(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soumettre une preuve</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={Colors.info} />
          <Text style={styles.instructionText}>
            Choisis un type de preuve pour valider ta tâche. Ta preuve sera visible par les autres membres du groupe.
          </Text>
        </Animated.View>

        {/* Proof Options */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.sectionTitle}>TYPE DE PREUVE</Text>

          <View style={styles.proofOptions}>
            {/* Camera */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              style={[
                styles.proofOption,
                selectedProofType === "camera" && styles.proofOptionSelected,
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.proofOptionIcon,
                selectedProofType === "camera" && styles.proofOptionIconSelected,
              ]}>
                <Ionicons
                  name="camera"
                  size={32}
                  color={selectedProofType === "camera" ? Colors.black : Colors.textPrimary}
                />
              </View>
              <Text style={[
                styles.proofOptionText,
                selectedProofType === "camera" && styles.proofOptionTextSelected,
              ]}>
                Prendre une photo
              </Text>
              <Text style={styles.proofOptionSubtext}>Caméra</Text>
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              onPress={handlePickImage}
              style={[
                styles.proofOption,
                selectedProofType === "gallery" && styles.proofOptionSelected,
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.proofOptionIcon,
                selectedProofType === "gallery" && styles.proofOptionIconSelected,
              ]}>
                <Ionicons
                  name="images"
                  size={32}
                  color={selectedProofType === "gallery" ? Colors.black : Colors.textPrimary}
                />
              </View>
              <Text style={[
                styles.proofOptionText,
                selectedProofType === "gallery" && styles.proofOptionTextSelected,
              ]}>
                Galerie
              </Text>
              <Text style={styles.proofOptionSubtext}>Photos existantes</Text>
            </TouchableOpacity>

            {/* Document */}
            <TouchableOpacity
              onPress={handlePickDocument}
              style={[
                styles.proofOption,
                selectedProofType === "document" && styles.proofOptionSelected,
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.proofOptionIcon,
                selectedProofType === "document" && styles.proofOptionIconSelected,
              ]}>
                <Ionicons
                  name="document"
                  size={32}
                  color={selectedProofType === "document" ? Colors.black : Colors.textPrimary}
                />
              </View>
              <Text style={[
                styles.proofOptionText,
                selectedProofType === "document" && styles.proofOptionTextSelected,
              ]}>
                Document
              </Text>
              <Text style={styles.proofOptionSubtext}>PDF, images</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Preview */}
        {proofUri && (
          <Animated.View entering={FadeInUp.springify()} style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.sectionTitle}>APERÇU</Text>
              <TouchableOpacity onPress={clearProof} style={styles.clearButton}>
                <Ionicons name="close-circle" size={24} color={Colors.danger} />
              </TouchableOpacity>
            </View>

            {selectedProofType === "document" ? (
              <View style={styles.documentPreview}>
                <Ionicons name="document" size={48} color={Colors.info} />
                <Text style={styles.documentName} numberOfLines={2}>
                  {proofName}
                </Text>
              </View>
            ) : (
              <Image source={{ uri: proofUri }} style={styles.imagePreview} />
            )}
          </Animated.View>
        )}

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!proofUri || isSubmitting}
            style={[
              styles.submitButton,
              (!proofUri || isSubmitting) && styles.submitButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={Colors.black} />
                <Text style={styles.submitButtonText}>Soumettre la preuve</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <ConfettiCelebration ref={confettiRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  instructionCard: {
    flexDirection: "row",
    backgroundColor: Colors.infoMuted,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.info,
  },
  instructionText: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.info,
  },
  sectionTitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  proofOptions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  proofOption: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  proofOptionSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.successMuted,
  },
  proofOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  proofOptionIconSelected: {
    backgroundColor: Colors.success,
  },
  proofOptionText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  proofOptionTextSelected: {
    color: Colors.success,
  },
  proofOptionSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  previewSection: {
    marginBottom: Spacing.xxl,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearButton: {
    padding: Spacing.sm,
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceElevated,
  },
  documentPreview: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentName: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
});
