import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../constants/theme";

type ValidationState = "idle" | "uploading" | "validating" | "approved" | "rejected";
type FileType = "image" | "pdf" | "document" | null;

interface SelectedFile {
  uri: string;
  name: string;
  type: FileType;
  mimeType?: string;
}

export default function SubmitProofScreen() {
  const { participationId } = useLocalSearchParams<{ participationId: string }>();

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
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [proofContent, setProofContent] = useState("");
  const [proofValue, setProofValue] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationResult, setValidationResult] = useState<{ approved: boolean; comment: string } | null>(null);

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (validationState === "validating" || validationState === "uploading") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [validationState]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert("Permission requise", "Autorise l'accès à la caméra et galerie");
      return false;
    }
    return true;
  };

  // Take photo with camera
  const handleCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: "image",
        mimeType: "image/jpeg",
      });
    }
  };

  // Pick from gallery
  const handleGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: "image",
        mimeType: asset.mimeType || "image/jpeg",
      });
    }
  };

  // Pick document/PDF
  const handleDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isPdf = asset.mimeType?.includes("pdf");
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: isPdf ? "pdf" : "image",
          mimeType: asset.mimeType,
        });
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner le fichier");
    }
  };

  // Upload file and get URL
  const uploadFile = async (file: SelectedFile): Promise<string> => {
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the file
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.mimeType || "application/octet-stream",
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await uploadResponse.json();

      // For now, return a description with the file info
      // In production, you'd store the storageId and retrieve the URL
      return `[Fichier uploadé: ${file.name}] storageId:${storageId}`;
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback: just describe the file
      return `[${file.type === "pdf" ? "PDF" : "Image"}: ${file.name}]`;
    }
  };

  const handleSubmit = async () => {
    if (!participationId) {
      Alert.alert("Erreur", "Erreur de participation");
      return;
    }

    if (!selectedFile && !proofContent.trim() && !proofValue) {
      Alert.alert("Erreur", "Ajoute une preuve (photo, fichier ou texte)");
      return;
    }

    setValidationState("uploading");

    try {
      let finalProofContent = proofContent.trim();

      // Upload file if selected
      if (selectedFile) {
        const fileUrl = await uploadFile(selectedFile);
        finalProofContent = fileUrl + (proofContent ? `\n${proofContent}` : "");
      }

      if (!finalProofContent && proofValue) {
        finalProofContent = `Valeur: ${proofValue}`;
      }

      setValidationState("validating");

      const res = await submitProof({
        participationId: participationId as Id<"participations">,
        proofContent: finalProofContent,
        proofValue: proofValue ? parseInt(proofValue) : undefined,
      });

      setValidationResult(res.validation);
      setValidationState(res.validation.approved ? "approved" : "rejected");
    } catch (err: any) {
      setValidationState("idle");
      Alert.alert("Erreur", err.message || "Erreur lors de la soumission");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  if (!challenge || !participation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // Uploading/Validating State
  if (validationState === "uploading" || validationState === "validating") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Animated.View style={[styles.spinner, spinnerStyle]}>
            <View style={styles.spinnerInner} />
          </Animated.View>
          <Text style={styles.validatingTitle}>
            {validationState === "uploading" ? "Upload en cours" : "Validation en cours"}
          </Text>
          <Text style={styles.validatingSubtitle}>
            {validationState === "uploading" ? "Envoi du fichier..." : "L'IA analyse ta preuve..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Result State
  if (validationState === "approved" || validationState === "rejected") {
    const isApproved = validationResult?.approved;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : "close-circle"}
            size={64}
            color={isApproved ? Colors.success : Colors.danger}
          />
          <Text style={[styles.resultTitle, { color: isApproved ? Colors.success : Colors.danger }]}>
            {isApproved ? "Validé" : "Rejeté"}
          </Text>
          <Text style={styles.resultComment}>{validationResult?.comment}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Existing Proof State
  if (existingProof) {
    const isApproved = existingProof.aiValidation === "approved";
    const isPending = existingProof.aiValidation === "pending";
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : isPending ? "time" : "close-circle"}
            size={64}
            color={isApproved ? Colors.success : isPending ? Colors.warning : Colors.danger}
          />
          <Text style={[styles.resultTitle, { color: isApproved ? Colors.success : isPending ? Colors.warning : Colors.danger }]}>
            {isApproved ? "Validé" : isPending ? "En attente" : "Rejeté"}
          </Text>
          <Text style={styles.resultComment}>{existingProof.aiComment}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Form State
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Soumettre</Text>
        </Animated.View>

        {/* Challenge Info */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeProof}>{challenge.proofDescription}</Text>
        </Animated.View>

        {/* Upload Options */}
        <Animated.View entering={FadeInDown.delay(130).springify()} style={styles.uploadSection}>
          <Text style={styles.inputLabel}>PREUVE</Text>

          {/* File Preview */}
          {selectedFile ? (
            <View style={styles.previewContainer}>
              {selectedFile.type === "image" ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document-text" size={48} color={Colors.accent} />
                  <Text style={styles.pdfName} numberOfLines={1}>{selectedFile.name}</Text>
                </View>
              )}
              <TouchableOpacity onPress={clearFile} style={styles.clearFileButton}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity onPress={handleCamera} style={styles.uploadButton}>
                <Ionicons name="camera" size={28} color={Colors.textPrimary} />
                <Text style={styles.uploadButtonText}>Caméra</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleGallery} style={styles.uploadButton}>
                <Ionicons name="images" size={28} color={Colors.textPrimary} />
                <Text style={styles.uploadButtonText}>Galerie</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDocument} style={styles.uploadButton}>
                <Ionicons name="document" size={28} color={Colors.textPrimary} />
                <Text style={styles.uploadButtonText}>Fichier</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Value Input */}
        {challenge.goalValue && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VALEUR ({challenge.goalUnit})</Text>
            <View style={styles.valueInputContainer}>
              <TextInput
                style={styles.valueInput}
                placeholder={challenge.goalValue.toString()}
                placeholderTextColor={Colors.textTertiary}
                value={proofValue}
                onChangeText={setProofValue}
                keyboardType="numeric"
              />
              <Text style={styles.valueUnit}>{challenge.goalUnit}</Text>
            </View>
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(170).springify()} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>DESCRIPTION (OPTIONNEL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ajoute un commentaire..."
            placeholderTextColor={Colors.textTertiary}
            value={proofContent}
            onChangeText={setProofContent}
            multiline
            numberOfLines={3}
          />
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(190).springify()}>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Soumettre</Text>
          </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.info,
    borderTopColor: "transparent",
    marginBottom: Spacing.lg,
  },
  spinnerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.info,
    position: "absolute",
    top: -4,
    left: "50%",
    marginLeft: -4,
  },
  validatingTitle: {
    ...Typography.headlineMedium,
    color: Colors.textPrimary,
  },
  validatingSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  resultTitle: {
    ...Typography.headlineLarge,
  },
  resultComment: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  backButtonLarge: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
  },
  challengeCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeTitle: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  challengeProof: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
  },
  uploadSection: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadButtonText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  previewContainer: {
    position: "relative",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  pdfPreview: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pdfName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
  },
  clearFileButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  valueInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueInput: {
    flex: 1,
    ...Typography.headlineLarge,
    color: Colors.textPrimary,
    padding: 0,
    textAlign: "center",
  },
  valueUnit: {
    ...Typography.labelLarge,
    color: Colors.textTertiary,
    marginLeft: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.black,
  },
  bottomSpacer: {
    height: 40,
  },
});
