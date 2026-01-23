import React, { useState, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { router, useLocalSearchParams } from "expo-router";
import { Id } from "../convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { proofCaptureService, ProofMetadata } from "../services/proofCapture";
import { fitnessService, UnifiedFitnessService } from "../services/fitness";
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
import ConfettiCelebration, { ConfettiRef } from "../components/ConfettiCelebration";
import { getErrorMessage } from "../utils/errorHandler";

type ValidationState = "idle" | "uploading" | "validating" | "approved" | "rejected";
type FileType = "image" | "pdf" | "document" | null;
type CaptureMethod = "camera" | "gallery" | "document" | "fitness_api";

interface SelectedFile {
  uri: string;
  name: string;
  type: FileType;
  mimeType?: string;
  base64?: string;
}

interface VerificationInfo {
  score: number;
  confidence: "high" | "medium" | "low" | "suspicious";
  issues: string[];
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

  // Proof verification states
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod | null>(null);
  const [proofMetadata, setProofMetadata] = useState<ProofMetadata | null>(null);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [fitnessAvailable, setFitnessAvailable] = useState(false);
  const [fitnessConnected, setFitnessConnected] = useState(false);

  const rotation = useSharedValue(0);
  const confettiRef = useRef<ConfettiRef>(null);

  // Check fitness availability for fitness challenges
  useEffect(() => {
    const checkFitness = async () => {
      if (challenge?.category) {
        const fitnessType = UnifiedFitnessService.mapChallengeToFitnessType(
          challenge.category,
          challenge.goalUnit
        );
        if (fitnessType) {
          const status = fitnessService.getConnectionStatus();
          setFitnessAvailable(status.isAvailable);
          setFitnessConnected(status.isConnected);
        }
      }
    };
    checkFitness();
  }, [challenge]);

  // Request location permission on mount
  useEffect(() => {
    proofCaptureService.requestLocationPermission();
  }, []);

  useEffect(() => {
    if (validationState === "validating" || validationState === "uploading") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }
    // Fire confetti when approved
    if (validationState === "approved") {
      confettiRef.current?.fire();
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

  // Take photo with camera - uses proof capture service for verification metadata
  const handleCamera = async () => {
    // Use the proof capture service for verified photo capture
    const result = await proofCaptureService.captureProofPhoto(includeLocation);

    if (!result.success) {
      if (result.error && result.error !== "Capture annulée") {
        Alert.alert("Erreur", result.error);
      }
      return;
    }

    if (result.uri && result.metadata) {
      setSelectedFile({
        uri: result.uri,
        name: `proof_${Date.now()}.jpg`,
        type: "image",
        mimeType: "image/jpeg",
        base64: result.base64,
      });
      setProofMetadata(result.metadata);
      setCaptureMethod("camera");

      // Generate verification report
      const report = proofCaptureService.generateProofReport(result.metadata);
      setVerificationInfo({
        score: result.metadata.captureMethod === "camera" && result.metadata.imageHash ? 100 : 70,
        confidence: result.metadata.captureMethod === "camera" ? "high" : "medium",
        issues: [],
      });
    }
  };

  // Pick from gallery - lower verification score
  const handleGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
      allowsEditing: false,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: "image",
        mimeType: asset.mimeType || "image/jpeg",
        base64: asset.base64 || undefined,
      });
      setCaptureMethod("gallery");
      setProofMetadata({
        capturedAt: Date.now(),
        deviceTime: Date.now(),
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "other",
        captureMethod: "gallery",
      });
      // Gallery photos have lower confidence
      setVerificationInfo({
        score: 60,
        confidence: "medium",
        issues: ["Photo importée depuis la galerie (non vérifiable en temps réel)"],
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
        setCaptureMethod("document");
        setProofMetadata({
          capturedAt: Date.now(),
          deviceTime: Date.now(),
          platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "other",
          captureMethod: "gallery",
        });
        // Documents have lower verification score
        setVerificationInfo({
          score: 50,
          confidence: "low",
          issues: ["Document importé (authenticité non vérifiable automatiquement)"],
        });
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sélectionner le fichier");
    }
  };

  // Handle fitness API verification (for fitness challenges)
  const handleFitnessVerification = async () => {
    if (!challenge || !participation) return;

    const fitnessType = UnifiedFitnessService.mapChallengeToFitnessType(
      challenge.category,
      challenge.goalUnit
    );

    if (!fitnessType) {
      Alert.alert("Erreur", "Ce type de défi ne supporte pas la vérification automatique");
      return;
    }

    // Request authorization if not connected
    if (!fitnessConnected) {
      const authorized = await fitnessService.requestAuthorization([fitnessType]);
      if (!authorized) {
        Alert.alert(
          "Autorisation requise",
          "Autorise l'accès aux données de santé pour la vérification automatique"
        );
        return;
      }
      setFitnessConnected(true);
    }

    setValidationState("validating");

    try {
      const targetValue = challenge.goalValue || 0;
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);

      const result = await fitnessService.verifyGoal(
        fitnessType,
        targetValue,
        startDate,
        endDate
      );

      if (result.success) {
        // Auto-submit with fitness data
        setCaptureMethod("fitness_api");
        setProofValue(result.actualValue.toString());
        setProofContent(
          `Vérification automatique ${result.source}:\n` +
          `${result.actualValue} ${result.unit} / ${targetValue} ${result.unit}\n` +
          `Progression: ${result.percentage}%`
        );
        setVerificationInfo({
          score: result.achieved ? 95 : 50,
          confidence: result.achieved ? "high" : "medium",
          issues: result.achieved ? [] : ["Objectif non atteint"],
        });

        if (result.achieved) {
          // Submit automatically if goal achieved
          await handleSubmit();
        } else {
          setValidationState("idle");
          Alert.alert(
            "Objectif non atteint",
            `Tu as fait ${result.actualValue} ${result.unit} sur ${targetValue} ${result.unit} requis (${result.percentage}%)`
          );
        }
      } else {
        setValidationState("idle");
        Alert.alert("Erreur", result.error || "Impossible de vérifier les données fitness");
      }
    } catch (err: any) {
      setValidationState("idle");
      Alert.alert("Oups!", getErrorMessage(err));
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
      Alert.alert("Oups!", getErrorMessage(err));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProofMetadata(null);
    setCaptureMethod(null);
    setVerificationInfo(null);
  };

  // Get verification badge color
  const getVerificationColor = (confidence: string) => {
    switch (confidence) {
      case "high": return Colors.success;
      case "medium": return Colors.warning;
      case "low": return "#FF9500";
      case "suspicious": return Colors.danger;
      default: return Colors.textTertiary;
    }
  };

  // Get verification badge text
  const getVerificationText = (confidence: string) => {
    switch (confidence) {
      case "high": return "Confiance élevée";
      case "medium": return "Confiance moyenne";
      case "low": return "Confiance faible";
      case "suspicious": return "Suspect";
      default: return "Non vérifié";
    }
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

  // Result State - Always show pending for organizer validation
  if (validationState === "approved" || validationState === "rejected") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name="checkmark-circle"
            size={64}
            color={Colors.success}
          />
          <Text style={[styles.resultTitle, { color: Colors.success }]}>
            Preuve envoyée !
          </Text>
          <Text style={styles.resultComment}>
            L'organisateur du pact va vérifier ta preuve. Tu seras notifié du résultat.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Existing Proof State
  if (existingProof) {
    const organizerStatus = existingProof.organizerValidation;
    const isApproved = organizerStatus === "approved";
    const isRejected = organizerStatus === "rejected";
    const isPending = !organizerStatus || organizerStatus === "pending";

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : isRejected ? "close-circle" : "time"}
            size={64}
            color={isApproved ? Colors.success : isRejected ? Colors.danger : Colors.warning}
          />
          <Text style={[styles.resultTitle, { color: isApproved ? Colors.success : isRejected ? Colors.danger : Colors.warning }]}>
            {isApproved ? "Preuve validée !" : isRejected ? "Preuve refusée" : "En attente de validation"}
          </Text>
          <Text style={styles.resultComment}>
            {isApproved
              ? "Félicitations ! L'organisateur a validé ta preuve."
              : isRejected
              ? existingProof.organizerComment || "L'organisateur n'a pas validé ta preuve."
              : "L'organisateur va vérifier ta preuve. Tu seras notifié du résultat."}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check if pact is long-term and hasn't ended yet
  const now = Date.now();
  const pactDuration = challenge.endDate - challenge.startDate;
  const isLongTermPact = pactDuration > 24 * 60 * 60 * 1000; // Plus de 24h
  const proofDeadline = challenge.endDate + 24 * 60 * 60 * 1000; // 24h grace period

  // Long-term pact not yet ended - show waiting screen
  if (isLongTermPact && now < challenge.endDate) {
    const timeRemaining = challenge.endDate - now;
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    const daysRemaining = Math.ceil(hoursRemaining / 24);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={64} color={Colors.warning} />
          <Text style={[styles.resultTitle, { color: Colors.warning }]}>
            Pas encore !
          </Text>
          <Text style={styles.resultComment}>
            Ce pact se termine {daysRemaining > 1 ? `dans ${daysRemaining} jours` : `dans ${hoursRemaining}h`}.
            {"\n\n"}Tu pourras soumettre ta preuve une fois le pact terminé.
            {"\n"}Tu auras ensuite 24h pour envoyer ta preuve.
          </Text>
          <View style={styles.infoBoxCentered}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoTextCentered}>
              Fin du pact: {new Date(challenge.endDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Deadline passed
  if (now > proofDeadline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="close-circle-outline" size={64} color={Colors.danger} />
          <Text style={[styles.resultTitle, { color: Colors.danger }]}>
            Délai dépassé
          </Text>
          <Text style={styles.resultComment}>
            Le délai de soumission est dépassé.
            {"\n"}Tu avais 24h après la fin du pact pour envoyer ta preuve.
          </Text>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
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

        {/* Fitness API Button (for eligible challenges) */}
        {fitnessAvailable && (
          <Animated.View entering={FadeInDown.delay(115).springify()} style={styles.fitnessSection}>
            <TouchableOpacity
              onPress={handleFitnessVerification}
              style={styles.fitnessButton}
            >
              <View style={styles.fitnessButtonContent}>
                <Ionicons
                  name={Platform.OS === "ios" ? "heart" : "fitness"}
                  size={24}
                  color={Colors.success}
                />
                <View style={styles.fitnessButtonText}>
                  <Text style={styles.fitnessButtonTitle}>
                    Vérification automatique
                  </Text>
                  <Text style={styles.fitnessButtonSubtitle}>
                    {Platform.OS === "ios" ? "Via Apple Santé" : "Via Google Fit"}
                  </Text>
                </View>
              </View>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>Recommandé</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Upload Options */}
        <Animated.View entering={FadeInDown.delay(130).springify()} style={styles.uploadSection}>
          <Text style={styles.inputLabel}>PREUVE PHOTO</Text>

          {/* File Preview */}
          {selectedFile ? (
            <View>
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

              {/* Verification Info Badge */}
              {verificationInfo && (
                <View style={styles.verificationBadge}>
                  <View style={[
                    styles.verificationDot,
                    { backgroundColor: getVerificationColor(verificationInfo.confidence) }
                  ]} />
                  <Text style={styles.verificationText}>
                    {getVerificationText(verificationInfo.confidence)}
                  </Text>
                  <Text style={styles.verificationScore}>
                    Score: {verificationInfo.score}/100
                  </Text>
                </View>
              )}

              {/* Metadata Info */}
              {proofMetadata && captureMethod === "camera" && (
                <View style={styles.metadataInfo}>
                  <View style={styles.metadataRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.metadataText}>
                      {new Date(proofMetadata.capturedAt).toLocaleString("fr-FR")}
                    </Text>
                  </View>
                  {proofMetadata.location && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textTertiary} />
                      <Text style={styles.metadataText}>
                        Géolocalisé (±{Math.round(proofMetadata.location.accuracy)}m)
                      </Text>
                    </View>
                  )}
                  {proofMetadata.imageHash && (
                    <View style={styles.metadataRow}>
                      <Ionicons name="shield-checkmark-outline" size={14} color={Colors.success} />
                      <Text style={styles.metadataText}>
                        Intégrité vérifiée
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Warning for non-camera captures */}
              {verificationInfo && verificationInfo.issues.length > 0 && (
                <View style={styles.warningBox}>
                  {verificationInfo.issues.map((issue, index) => (
                    <View key={index} style={styles.warningRow}>
                      <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                      <Text style={styles.warningText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity onPress={handleCamera} style={[styles.uploadButton, styles.uploadButtonRecommended]}>
                <View style={styles.recommendedBadgeSmall}>
                  <Text style={styles.recommendedBadgeSmallText}>Meilleur score</Text>
                </View>
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
      </KeyboardAvoidingView>
      <ConfettiCelebration ref={confettiRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  infoBoxCentered: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  infoTextCentered: {
    ...Typography.bodyMedium,
    color: Colors.info,
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
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  submitButtonText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
  // New verification styles
  fitnessSection: {
    marginBottom: Spacing.lg,
  },
  fitnessButton: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.success,
  },
  fitnessButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  fitnessButtonText: {
    gap: 2,
  },
  fitnessButtonTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  fitnessButtonSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  recommendedBadge: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  recommendedBadgeText: {
    ...Typography.labelSmall,
    color: Colors.success,
    fontSize: 10,
  },
    verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
  },
  verificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verificationText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  verificationScore: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  metadataInfo: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metadataText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  warningBox: {
    marginTop: Spacing.md,
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.bodySmall,
    color: Colors.warning,
    flex: 1,
  },
  uploadButtonRecommended: {
    borderColor: Colors.success,
    borderWidth: 1,
  },
  recommendedBadgeSmall: {
    position: "absolute",
    top: -8,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recommendedBadgeSmallText: {
    ...Typography.labelSmall,
    color: Colors.background,
    fontSize: 9,
  },
});
