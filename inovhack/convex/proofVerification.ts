/**
 * Proof Verification System
 * Système de vérification des preuves côté serveur
 *
 * Fonctionnalités:
 * - Validation des métadonnées de preuve
 * - Vérification de l'horodatage serveur
 * - Score de confiance pour chaque preuve
 * - Détection des preuves suspectes
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Types de vérification
type VerificationConfidence = "high" | "medium" | "low" | "suspicious";

interface VerificationResult {
  isValid: boolean;
  confidence: VerificationConfidence;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

/**
 * Soumettre une preuve avec vérification
 */
export const submitVerifiedProof = mutation({
  args: {
    participationId: v.id("participations"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    // Contenu de la preuve
    proofContent: v.string(), // URL de l'image
    proofType: v.string(), // "photo_camera", "photo_gallery", "text", "api"
    // Métadonnées de capture
    capturedAt: v.number(),
    deviceTime: v.number(),
    platform: v.string(),
    captureMethod: v.string(),
    imageHash: v.optional(v.string()),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Timestamp serveur au moment de la soumission
    const serverSubmissionTime = Date.now();

    // Vérifier que la participation existe et est active
    const participation = await ctx.db.get(args.participationId);
    if (!participation) {
      throw new Error("Participation non trouvée");
    }
    if (participation.status === "won" || participation.status === "lost") {
      throw new Error("Cette participation est déjà terminée");
    }

    // Vérifier que le challenge existe
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge non trouvé");
    }

    // Effectuer les vérifications
    const verification = verifyProofSubmission({
      capturedAt: args.capturedAt,
      deviceTime: args.deviceTime,
      captureMethod: args.captureMethod,
      platform: args.platform,
      imageHash: args.imageHash,
      hasLocation: !!args.location,
      locationAccuracy: args.location?.accuracy,
      serverSubmissionTime,
      challengeStartDate: challenge.startDate,
      challengeEndDate: challenge.endDate,
    });

    // Rejeter les preuves suspectes automatiquement
    if (verification.confidence === "suspicious" || verification.score < 30) {
      throw new Error(
        "Cette preuve ne peut pas être acceptée: " + verification.issues.join(", ")
      );
    }

    // Créer la preuve
    const proofId = await ctx.db.insert("proofs", {
      participationId: args.participationId,
      challengeId: args.challengeId,
      userId: args.userId,
      proofContent: args.proofContent,
      proofType: args.proofType,
      // Validation
      organizerValidation: "pending",
      communityValidation: "pending",
      approveCount: 0,
      rejectCount: 0,
      submittedAt: serverSubmissionTime,
    });

    // Stocker les métadonnées de vérification séparément (pour audit)
    await ctx.db.insert("proofVerifications" as any, {
      proofId,
      userId: args.userId,
      // Métadonnées soumises
      capturedAt: args.capturedAt,
      deviceTime: args.deviceTime,
      platform: args.platform,
      captureMethod: args.captureMethod,
      imageHash: args.imageHash,
      location: args.location ? JSON.stringify(args.location) : undefined,
      // Résultat de la vérification
      serverSubmissionTime,
      verificationScore: verification.score,
      verificationConfidence: verification.confidence,
      verificationIssues: verification.issues.join("; "),
      // Métadonnées système
      verifiedAt: serverSubmissionTime,
    });

    // Mettre à jour le statut de la participation
    await ctx.db.patch(args.participationId, {
      status: "pending_validation",
      proofSubmittedAt: serverSubmissionTime,
    });

    // Créer une notification pour l'organisateur (si pact type friends/group)
    if (challenge.type !== "public" && challenge.creatorId !== args.userId) {
      await ctx.db.insert("notifications", {
        userId: challenge.creatorId,
        type: "proof_submitted",
        title: "Nouvelle preuve à valider",
        body: `Un participant a soumis une preuve pour "${challenge.title}"`,
        data: JSON.stringify({
          proofId,
          challengeId: args.challengeId,
        }),
        read: false,
        createdAt: serverSubmissionTime,
      });
    }

    return {
      success: true,
      proofId,
      verification: {
        score: verification.score,
        confidence: verification.confidence,
        issues: verification.issues,
      },
    };
  },
});

/**
 * Obtenir les détails de vérification d'une preuve
 */
export const getProofVerificationDetails = query({
  args: {
    proofId: v.id("proofs"),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) return null;

    // Récupérer les métadonnées de vérification
    const verifications = await ctx.db
      .query("proofVerifications" as any)
      .filter((q) => q.eq(q.field("proofId"), args.proofId))
      .collect();

    const verification = verifications[0];

    return {
      proof,
      verification: verification ? {
        score: verification.verificationScore,
        confidence: verification.verificationConfidence,
        issues: verification.verificationIssues?.split("; ") || [],
        capturedAt: verification.capturedAt,
        captureMethod: verification.captureMethod,
        platform: verification.platform,
        hasLocation: !!verification.location,
      } : null,
    };
  },
});

/**
 * Fonction de vérification des preuves
 */
function verifyProofSubmission(params: {
  capturedAt: number;
  deviceTime: number;
  captureMethod: string;
  platform: string;
  imageHash?: string;
  hasLocation: boolean;
  locationAccuracy?: number;
  serverSubmissionTime: number;
  challengeStartDate: number;
  challengeEndDate: number;
}): VerificationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Vérifier la méthode de capture (30 points)
  if (params.captureMethod !== "camera") {
    issues.push("Photo non capturée directement via l'application");
    score -= 30;
    recommendations.push("Utilisez l'appareil photo intégré à PACT pour plus de crédibilité");
  }

  // 2. Vérifier le délai capture -> soumission (20 points)
  const captureToSubmitDelay = params.serverSubmissionTime - params.capturedAt;
  const maxAcceptableDelay = 10 * 60 * 1000; // 10 minutes
  const suspiciousDelay = 30 * 60 * 1000; // 30 minutes

  if (captureToSubmitDelay < 0) {
    issues.push("Timestamp de capture incohérent (futur)");
    score -= 40;
  } else if (captureToSubmitDelay > suspiciousDelay) {
    issues.push("Délai très long entre capture et soumission");
    score -= 20;
    recommendations.push("Soumettez vos preuves rapidement après la capture");
  } else if (captureToSubmitDelay > maxAcceptableDelay) {
    issues.push("Délai important entre capture et soumission");
    score -= 10;
  }

  // 3. Vérifier la cohérence device/server time (15 points)
  const deviceServerDiff = Math.abs(params.deviceTime - params.capturedAt);
  if (deviceServerDiff > 5 * 60 * 1000) { // Plus de 5 minutes
    issues.push("Incohérence entre horloge appareil et serveur");
    score -= 15;
  }

  // 4. Vérifier le hash d'intégrité (15 points)
  if (!params.imageHash) {
    issues.push("Hash d'intégrité manquant");
    score -= 10;
  }

  // 5. Bonus/Malus localisation (±10 points)
  if (params.hasLocation) {
    if (params.locationAccuracy && params.locationAccuracy <= 50) {
      score += 10; // Bonus pour localisation précise
    } else if (params.locationAccuracy && params.locationAccuracy > 100) {
      issues.push("Localisation imprécise");
      score -= 5;
    }
  } else {
    score -= 5; // Légère pénalité sans localisation
    recommendations.push("Activez la localisation pour renforcer la crédibilité");
  }

  // 6. Vérifier que la capture est dans la période du challenge (crucial)
  if (params.capturedAt < params.challengeStartDate) {
    issues.push("Photo capturée avant le début du challenge");
    score -= 50;
  }
  if (params.capturedAt > params.challengeEndDate) {
    issues.push("Photo capturée après la fin du challenge");
    score -= 50;
  }

  // Calculer le niveau de confiance
  let confidence: VerificationConfidence;
  if (score >= 80) {
    confidence = "high";
  } else if (score >= 60) {
    confidence = "medium";
  } else if (score >= 40) {
    confidence = "low";
  } else {
    confidence = "suspicious";
  }

  return {
    isValid: score >= 40,
    confidence,
    score: Math.max(0, Math.min(100, score)),
    issues,
    recommendations,
  };
}

/**
 * Vérifier automatiquement les preuves API (HealthKit/Google Fit)
 */
export const submitApiVerifiedProof = mutation({
  args: {
    participationId: v.id("participations"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    // Données de l'API fitness
    dataType: v.string(), // "steps", "distance", etc.
    actualValue: v.number(),
    targetValue: v.number(),
    unit: v.string(),
    source: v.string(), // "healthkit", "googlefit"
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const serverTime = Date.now();

    // Vérifier la participation et le challenge
    const participation = await ctx.db.get(args.participationId);
    if (!participation) throw new Error("Participation non trouvée");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge non trouvé");

    // Calculer si l'objectif est atteint
    const achieved = args.actualValue >= args.targetValue;
    const percentage = Math.min(100, Math.round((args.actualValue / args.targetValue) * 100));

    // Les preuves API ont une confiance élevée si vérifiées
    const verificationScore = achieved ? 95 : 50;

    // Créer la preuve
    const proofContent = JSON.stringify({
      type: "api_verification",
      source: args.source,
      dataType: args.dataType,
      actualValue: args.actualValue,
      targetValue: args.targetValue,
      unit: args.unit,
      percentage,
      achieved,
      period: {
        start: new Date(args.startDate).toISOString(),
        end: new Date(args.endDate).toISOString(),
      },
    });

    const proofId = await ctx.db.insert("proofs", {
      participationId: args.participationId,
      challengeId: args.challengeId,
      userId: args.userId,
      proofContent,
      proofType: "api",
      proofValue: args.actualValue,
      // Auto-validation pour les preuves API réussies
      organizerValidation: achieved ? "approved" : "pending",
      communityValidation: achieved ? "approved" : "pending",
      submittedAt: serverTime,
      validatedAt: achieved ? serverTime : undefined,
    });

    // Mettre à jour la participation si objectif atteint
    if (achieved) {
      await ctx.db.patch(args.participationId, {
        status: "won",
        proofSubmittedAt: serverTime,
        validatedAt: serverTime,
      });
    } else {
      await ctx.db.patch(args.participationId, {
        status: "pending_validation",
        proofSubmittedAt: serverTime,
      });
    }

    return {
      success: true,
      proofId,
      achieved,
      actualValue: args.actualValue,
      targetValue: args.targetValue,
      percentage,
      verificationScore,
    };
  },
});
