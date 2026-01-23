/**
 * Unified Fitness Service
 * Abstraction unifiée pour HealthKit (iOS) et Google Fit (Android)
 *
 * Utilisation:
 * - Détecte automatiquement la plateforme
 * - Interface unifiée pour la vérification des objectifs
 * - Conforme RGPD: consentement explicite requis
 */

import { Platform } from "react-native";
import { healthKitService, HealthDataType, HealthKitPermissions } from "./healthkit";
import { googleFitService, FitnessDataType, GoogleFitPermissions } from "./googlefit";

// Type unifié pour les données fitness
export type UnifiedFitnessDataType =
  | "steps"
  | "distance"
  | "calories"
  | "activeMinutes"
  | "workouts";

// Interface pour les résultats unifiés
export interface FitnessResult {
  success: boolean;
  achieved?: boolean;
  actualValue: number;
  targetValue?: number;
  unit: string;
  percentage?: number;
  source: "healthkit" | "googlefit" | "none";
  startDate: Date;
  endDate: Date;
  error?: string;
}

// Interface pour le statut de connexion
export interface FitnessConnectionStatus {
  isAvailable: boolean;
  isConnected: boolean;
  platform: "ios" | "android" | "other";
  provider: "healthkit" | "googlefit" | "none";
  permissionsGranted: UnifiedFitnessDataType[];
}

/**
 * Service Fitness Unifié
 */
class UnifiedFitnessService {
  private platform: "ios" | "android" | "other";
  private connectedPermissions: Set<UnifiedFitnessDataType> = new Set();
  private isConnected: boolean = false;

  constructor() {
    if (Platform.OS === "ios") {
      this.platform = "ios";
    } else if (Platform.OS === "android") {
      this.platform = "android";
    } else {
      this.platform = "other";
    }
  }

  /**
   * Vérifier si le service fitness est disponible
   */
  isAvailable(): boolean {
    if (this.platform === "ios") {
      return healthKitService.isHealthKitAvailable();
    } else if (this.platform === "android") {
      return googleFitService.isGoogleFitAvailable();
    }
    return false;
  }

  /**
   * Obtenir le statut de connexion actuel
   */
  getConnectionStatus(): FitnessConnectionStatus {
    return {
      isAvailable: this.isAvailable(),
      isConnected: this.isConnected,
      platform: this.platform,
      provider: this.platform === "ios" ? "healthkit" :
               this.platform === "android" ? "googlefit" : "none",
      permissionsGranted: Array.from(this.connectedPermissions),
    };
  }

  /**
   * Demander les autorisations fitness
   */
  async requestAuthorization(dataTypes: UnifiedFitnessDataType[]): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log("Service fitness non disponible");
      return false;
    }

    try {
      if (this.platform === "ios") {
        const healthKitTypes = dataTypes.map(type => this.mapToHealthKit(type));
        const permissions: HealthKitPermissions = {
          read: healthKitTypes,
        };
        const result = await healthKitService.requestAuthorization(permissions);
        if (result) {
          dataTypes.forEach(type => this.connectedPermissions.add(type));
          this.isConnected = true;
        }
        return result;

      } else if (this.platform === "android") {
        const googleFitTypes = dataTypes.map(type => this.mapToGoogleFit(type));
        const permissions: GoogleFitPermissions = {
          scopes: googleFitTypes,
        };
        const result = await googleFitService.requestAuthorization(permissions);
        if (result) {
          dataTypes.forEach(type => this.connectedPermissions.add(type));
          this.isConnected = true;
        }
        return result;
      }

      return false;
    } catch (error) {
      console.error("Erreur lors de la demande d'autorisation fitness:", error);
      return false;
    }
  }

  /**
   * Obtenir les données fitness pour un type donné
   */
  async getData(
    dataType: UnifiedFitnessDataType,
    startDate: Date,
    endDate: Date
  ): Promise<FitnessResult> {
    if (!this.isAvailable()) {
      return this.errorResult("Service fitness non disponible");
    }

    if (!this.connectedPermissions.has(dataType)) {
      return this.errorResult(`Autorisation requise pour: ${dataType}`);
    }

    try {
      if (this.platform === "ios") {
        return await this.getHealthKitData(dataType, startDate, endDate);
      } else if (this.platform === "android") {
        return await this.getGoogleFitData(dataType, startDate, endDate);
      }

      return this.errorResult("Plateforme non supportée");
    } catch (error: any) {
      return this.errorResult(error.message);
    }
  }

  /**
   * Vérifier si un objectif fitness est atteint
   * C'est la fonction principale utilisée pour la validation des défis
   */
  async verifyGoal(
    dataType: UnifiedFitnessDataType,
    targetValue: number,
    startDate: Date,
    endDate: Date
  ): Promise<FitnessResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        achieved: false,
        actualValue: 0,
        targetValue,
        unit: "",
        percentage: 0,
        source: "none",
        startDate,
        endDate,
        error: "Service fitness non disponible sur cette plateforme",
      };
    }

    if (!this.connectedPermissions.has(dataType)) {
      return {
        success: false,
        achieved: false,
        actualValue: 0,
        targetValue,
        unit: "",
        percentage: 0,
        source: this.platform === "ios" ? "healthkit" : "googlefit",
        startDate,
        endDate,
        error: "Autorisation requise. Connectez-vous aux données de santé.",
      };
    }

    try {
      if (this.platform === "ios") {
        const healthKitType = this.mapToHealthKit(dataType);
        const result = await healthKitService.verifyGoal(
          healthKitType,
          targetValue,
          startDate,
          endDate
        );

        return {
          success: result.success,
          achieved: result.achieved,
          actualValue: result.actualValue,
          targetValue: result.targetValue,
          unit: result.unit,
          percentage: result.percentage,
          source: "healthkit",
          startDate,
          endDate,
          error: result.error,
        };

      } else if (this.platform === "android") {
        const googleFitType = this.mapToGoogleFit(dataType);
        const result = await googleFitService.verifyGoal(
          googleFitType,
          targetValue,
          startDate,
          endDate
        );

        return {
          success: result.success,
          achieved: result.achieved,
          actualValue: result.actualValue,
          targetValue: result.targetValue,
          unit: result.unit,
          percentage: result.percentage,
          source: "googlefit",
          startDate,
          endDate,
          error: result.error,
        };
      }

      return this.errorResult("Plateforme non supportée");
    } catch (error: any) {
      return {
        success: false,
        achieved: false,
        actualValue: 0,
        targetValue,
        unit: "",
        percentage: 0,
        source: this.platform === "ios" ? "healthkit" : "googlefit",
        startDate,
        endDate,
        error: error.message,
      };
    }
  }

  /**
   * Mapper une catégorie de défi à un type de données fitness
   */
  static mapChallengeToFitnessType(
    category: string,
    goalUnit?: string
  ): UnifiedFitnessDataType | null {
    const categoryLower = category.toLowerCase();
    const unitLower = goalUnit?.toLowerCase();

    // Mapping par catégorie
    if (categoryLower === "fitness" || categoryLower === "walking") {
      return "steps";
    }
    if (categoryLower === "running") {
      return unitLower === "km" || unitLower === "m" ? "distance" : "steps";
    }
    if (categoryLower === "workout" || categoryLower === "exercise") {
      return "workouts";
    }
    if (categoryLower === "cardio" || categoryLower === "calories") {
      return "calories";
    }

    // Mapping par unité
    if (unitLower === "steps" || unitLower === "pas") {
      return "steps";
    }
    if (unitLower === "km" || unitLower === "m" || unitLower === "meters") {
      return "distance";
    }
    if (unitLower === "min" || unitLower === "minutes") {
      return "activeMinutes";
    }
    if (unitLower === "kcal" || unitLower === "cal" || unitLower === "calories") {
      return "calories";
    }

    return null;
  }

  /**
   * Obtenir les types de défis supportés par la vérification automatique
   */
  static getSupportedChallengeTypes(): string[] {
    return [
      "fitness",
      "walking",
      "running",
      "workout",
      "exercise",
      "cardio",
      "calories",
    ];
  }

  // Méthodes privées

  private async getHealthKitData(
    dataType: UnifiedFitnessDataType,
    startDate: Date,
    endDate: Date
  ): Promise<FitnessResult> {
    const healthKitType = this.mapToHealthKit(dataType);
    let result;

    switch (healthKitType) {
      case "steps":
        result = await healthKitService.getStepCount(startDate, endDate);
        break;
      case "distance":
        result = await healthKitService.getDistanceWalkingRunning(startDate, endDate);
        break;
      case "activeEnergy":
        result = await healthKitService.getActiveEnergyBurned(startDate, endDate);
        break;
      case "workoutMinutes":
        result = await healthKitService.getExerciseMinutes(startDate, endDate);
        break;
      case "workoutCount":
        result = await healthKitService.getWorkoutCount(startDate, endDate);
        break;
      default:
        return this.errorResult(`Type non supporté: ${dataType}`);
    }

    return {
      success: result.success,
      actualValue: result.value,
      unit: result.unit,
      source: "healthkit",
      startDate: result.startDate,
      endDate: result.endDate,
      error: result.error,
    };
  }

  private async getGoogleFitData(
    dataType: UnifiedFitnessDataType,
    startDate: Date,
    endDate: Date
  ): Promise<FitnessResult> {
    const googleFitType = this.mapToGoogleFit(dataType);
    let result;

    switch (googleFitType) {
      case "steps":
        result = await googleFitService.getStepCount(startDate, endDate);
        break;
      case "distance":
        result = await googleFitService.getDistance(startDate, endDate);
        break;
      case "calories":
        result = await googleFitService.getCaloriesBurned(startDate, endDate);
        break;
      case "activeMinutes":
        result = await googleFitService.getActiveMinutes(startDate, endDate);
        break;
      case "workoutSessions":
        result = await googleFitService.getWorkoutSessions(startDate, endDate);
        break;
      default:
        return this.errorResult(`Type non supporté: ${dataType}`);
    }

    return {
      success: result.success,
      actualValue: result.value,
      unit: result.unit,
      source: "googlefit",
      startDate: result.startTime,
      endDate: result.endTime,
      error: result.error,
    };
  }

  private mapToHealthKit(type: UnifiedFitnessDataType): HealthDataType {
    const mapping: Record<UnifiedFitnessDataType, HealthDataType> = {
      steps: "steps",
      distance: "distance",
      calories: "activeEnergy",
      activeMinutes: "workoutMinutes",
      workouts: "workoutCount",
    };
    return mapping[type];
  }

  private mapToGoogleFit(type: UnifiedFitnessDataType): FitnessDataType {
    const mapping: Record<UnifiedFitnessDataType, FitnessDataType> = {
      steps: "steps",
      distance: "distance",
      calories: "calories",
      activeMinutes: "activeMinutes",
      workouts: "workoutSessions",
    };
    return mapping[type];
  }

  private errorResult(message: string): FitnessResult {
    return {
      success: false,
      actualValue: 0,
      unit: "",
      source: "none",
      startDate: new Date(),
      endDate: new Date(),
      error: message,
    };
  }
}

// Export singleton
export const fitnessService = new UnifiedFitnessService();

// Export pour utilisation directe
export { UnifiedFitnessService };
