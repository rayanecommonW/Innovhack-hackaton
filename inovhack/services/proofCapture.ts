/**
 * Proof Capture Service
 * Système de capture de preuves photo in-app avec vérification d'authenticité
 *
 * Fonctionnalités:
 * - Capture photo directe (pas de sélection galerie)
 * - Horodatage serveur (pas modifiable par l'utilisateur)
 * - Métadonnées de localisation (optionnel, avec consentement)
 * - Hash d'intégrité pour détecter les modifications
 */

import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";

// Interface pour les métadonnées de preuve
export interface ProofMetadata {
  capturedAt: number;         // Timestamp serveur (inaltérable)
  deviceTime: number;         // Timestamp appareil (pour référence)
  deviceId?: string;          // Identifiant unique appareil
  platform: "ios" | "android" | "other";
  appVersion?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  imageHash?: string;         // Hash SHA-256 de l'image
  captureMethod: "camera" | "gallery";  // Méthode de capture
}

// Interface pour le résultat de capture
export interface CaptureResult {
  success: boolean;
  uri?: string;               // URI locale de l'image
  base64?: string;            // Image en base64
  metadata?: ProofMetadata;
  error?: string;
}

// Interface pour la vérification de preuve
export interface ProofVerification {
  isValid: boolean;
  confidence: "high" | "medium" | "low";
  issues: string[];
  metadata: ProofMetadata;
}

/**
 * Service de capture de preuves
 */
class ProofCaptureService {
  private locationPermissionGranted: boolean = false;
  private cameraPermissionGranted: boolean = false;

  /**
   * Demander les permissions caméra
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      this.cameraPermissionGranted = status === "granted";
      return this.cameraPermissionGranted;
    } catch (error) {
      console.error("Erreur permission caméra:", error);
      return false;
    }
  }

  /**
   * Demander les permissions de localisation (optionnel)
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermissionGranted = status === "granted";
      return this.locationPermissionGranted;
    } catch (error) {
      console.error("Erreur permission localisation:", error);
      return false;
    }
  }

  /**
   * Capturer une photo preuve
   * IMPORTANT: Force l'utilisation de la caméra (pas de galerie)
   */
  async captureProofPhoto(includeLocation: boolean = false): Promise<CaptureResult> {
    // Vérifier les permissions caméra
    if (!this.cameraPermissionGranted) {
      const granted = await this.requestCameraPermission();
      if (!granted) {
        return {
          success: false,
          error: "Permission caméra requise pour soumettre une preuve",
        };
      }
    }

    try {
      // Obtenir le timestamp serveur AVANT la capture
      // En production: appeler une API pour obtenir l'heure serveur
      const serverTimestamp = Date.now(); // Simulé pour le hackathon

      // Lancer la caméra
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,  // Pas d'édition autorisée
        quality: 0.8,
        base64: true,
        exif: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return {
          success: false,
          error: "Capture annulée",
        };
      }

      const image = result.assets[0];

      // Obtenir la localisation si demandée et autorisée
      let locationData = undefined;
      if (includeLocation && this.locationPermissionGranted) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };
        } catch (locError) {
          console.log("Localisation non disponible:", locError);
        }
      }

      // Calculer le hash de l'image pour l'intégrité
      let imageHash = undefined;
      if (image.base64) {
        imageHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          image.base64.substring(0, 10000) // Hash partiel pour performance
        );
      }

      // Construire les métadonnées
      const metadata: ProofMetadata = {
        capturedAt: serverTimestamp,
        deviceTime: Date.now(),
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "other",
        location: locationData,
        imageHash,
        captureMethod: "camera",
      };

      return {
        success: true,
        uri: image.uri,
        base64: image.base64,
        metadata,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de la capture",
      };
    }
  }

  /**
   * Vérifier l'authenticité d'une preuve
   * Appelé côté serveur pour valider les preuves soumises
   */
  verifyProofAuthenticity(
    metadata: ProofMetadata,
    submissionTime: number
  ): ProofVerification {
    const issues: string[] = [];
    let confidence: "high" | "medium" | "low" = "high";

    // Vérification 1: Méthode de capture
    if (metadata.captureMethod !== "camera") {
      issues.push("Photo non capturée via l'application");
      confidence = "low";
    }

    // Vérification 2: Délai entre capture et soumission
    const captureToSubmitDelay = submissionTime - metadata.capturedAt;
    const maxDelay = 5 * 60 * 1000; // 5 minutes max

    if (captureToSubmitDelay > maxDelay) {
      issues.push("Délai important entre capture et soumission");
      confidence = "medium";
    }

    if (captureToSubmitDelay < 0) {
      issues.push("Timestamp de capture invalide");
      confidence = "low";
    }

    // Vérification 3: Cohérence des timestamps
    const deviceServerDiff = Math.abs(metadata.deviceTime - metadata.capturedAt);
    if (deviceServerDiff > 60 * 1000) { // Plus d'une minute de différence
      issues.push("Incohérence entre horloge appareil et serveur");
      if (confidence === "high") confidence = "medium";
    }

    // Vérification 4: Présence de localisation (bonus de confiance)
    if (!metadata.location) {
      // Pas une erreur, mais réduit la confiance
      if (confidence === "high") confidence = "medium";
    } else {
      // Vérifier la précision de la localisation
      if (metadata.location.accuracy > 100) { // Plus de 100m de précision
        issues.push("Localisation imprécise");
      }
    }

    // Vérification 5: Hash d'intégrité
    if (!metadata.imageHash) {
      issues.push("Hash d'intégrité manquant");
      if (confidence === "high") confidence = "medium";
    }

    return {
      isValid: issues.length === 0 || confidence !== "low",
      confidence,
      issues,
      metadata,
    };
  }

  /**
   * Générer un rapport de preuve pour l'affichage
   */
  generateProofReport(metadata: ProofMetadata): {
    timestamp: string;
    location: string;
    method: string;
    verified: boolean;
  } {
    const date = new Date(metadata.capturedAt);
    const timestamp = date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let location = "Non disponible";
    if (metadata.location) {
      location = `${metadata.location.latitude.toFixed(4)}, ${metadata.location.longitude.toFixed(4)}`;
      if (metadata.location.accuracy) {
        location += ` (±${Math.round(metadata.location.accuracy)}m)`;
      }
    }

    return {
      timestamp,
      location,
      method: metadata.captureMethod === "camera" ? "Capturé via PACT" : "Importé",
      verified: metadata.captureMethod === "camera" && !!metadata.imageHash,
    };
  }

  /**
   * Compresser une image pour l'envoi
   */
  async compressImage(uri: string, quality: number = 0.7): Promise<string | null> {
    try {
      // En production: utiliser expo-image-manipulator pour la compression
      // import * as ImageManipulator from 'expo-image-manipulator';
      //
      // const result = await ImageManipulator.manipulateAsync(
      //   uri,
      //   [{ resize: { width: 1200 } }],
      //   { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      // );
      // return result.uri;

      // Pour le hackathon, retourner l'URI originale
      return uri;
    } catch (error) {
      console.error("Erreur compression:", error);
      return null;
    }
  }

  /**
   * Obtenir la taille d'un fichier image
   */
  async getImageSize(uri: string): Promise<number | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && "size" in fileInfo) {
        return fileInfo.size;
      }
      return null;
    } catch (error) {
      console.error("Erreur taille fichier:", error);
      return null;
    }
  }
}

// Export singleton
export const proofCaptureService = new ProofCaptureService();

// Export types
export type { ProofMetadata, CaptureResult, ProofVerification };
