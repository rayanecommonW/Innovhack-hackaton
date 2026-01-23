/**
 * KYC (Know Your Customer) - Stripe Identity Integration
 * Vérification d'identité conforme aux réglementations françaises
 *
 * Architecture:
 * - Utilise Stripe Identity pour la vérification
 * - Requis avant le premier retrait
 * - Stocke uniquement le statut, pas les documents (RGPD)
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { verifyAuthenticatedUser } from "./authHelper";

/**
 * Statuts KYC possibles
 */
type KycStatus = "none" | "pending" | "verified" | "rejected" | "requires_input";

/**
 * Créer une session de vérification Stripe Identity (Action)
 * Utilise la vraie API Stripe Identity
 */
export const createVerificationSession = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Récupérer l'utilisateur
    const user = await ctx.runQuery(api.users.getUser, { userId: args.userId });
    if (!user) throw new Error("Utilisateur non trouvé");

    // Vérifier si déjà vérifié
    if (user.kycVerified) {
      return {
        success: true,
        alreadyVerified: true,
        message: "Identité déjà vérifiée",
      };
    }

    // Vérifier si une vérification est en cours
    if (user.kycStatus === "pending") {
      return {
        success: false,
        pending: true,
        message: "Une vérification est déjà en cours",
      };
    }

    // Appeler Stripe Identity API
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("Configuration Stripe manquante");
    }

    try {
      const response = await fetch("https://api.stripe.com/v1/identity/verification_sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "type": "document",
          "metadata[userId]": args.userId,
          "options[document][allowed_types][0]": "driving_license",
          "options[document][allowed_types][1]": "passport",
          "options[document][allowed_types][2]": "id_card",
          "options[document][require_live_capture]": "true",
          "options[document][require_matching_selfie]": "true",
          "return_url": args.returnUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Stripe Identity error:", error);
        throw new Error("Erreur lors de la création de la session de vérification");
      }

      const session = await response.json();

      // Mettre à jour le statut KYC
      await ctx.runMutation(internal.kyc.updateKycSession, {
        userId: args.userId,
        sessionId: session.id,
        clientSecret: session.client_secret,
      });

      return {
        success: true,
        sessionId: session.id,
        clientSecret: session.client_secret,
        url: session.url,
      };
    } catch (error: any) {
      console.error("KYC session creation failed:", error);
      throw new Error("Impossible de créer la session de vérification");
    }
  },
});

/**
 * Internal mutation to update KYC session
 */
export const updateKycSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    clientSecret: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      kycStatus: "pending",
      kycSessionId: args.sessionId,
      kycStartedAt: Date.now(),
    });
  },
});

/**
 * Vérifier le statut d'une session de vérification (Action)
 */
export const checkVerificationStatus = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUser, { userId: args.userId });
    if (!user) throw new Error("Utilisateur non trouvé");

    if (!user.kycSessionId) {
      return {
        status: "none" as KycStatus,
        verified: false,
        message: "Aucune vérification en cours",
      };
    }

    // Appeler Stripe Identity API pour récupérer le statut
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("Configuration Stripe manquante");
    }

    try {
      const response = await fetch(
        `https://api.stripe.com/v1/identity/verification_sessions/${user.kycSessionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Stripe Identity status error:", error);
        // Retourner le statut en cache si l'API échoue
        return {
          status: (user.kycStatus || "pending") as KycStatus,
          verified: user.kycVerified || false,
          sessionId: user.kycSessionId,
          startedAt: user.kycStartedAt,
        };
      }

      const session = await response.json();

      // Mapper le statut Stripe vers notre statut
      let status: KycStatus = "pending";
      if (session.status === "verified") {
        status = "verified";
      } else if (session.status === "requires_input") {
        status = "requires_input";
      } else if (session.status === "canceled") {
        status = "rejected";
      }

      // Mettre à jour si le statut a changé
      if (status !== user.kycStatus) {
        await ctx.runMutation(internal.kyc.handleVerificationUpdate, {
          sessionId: user.kycSessionId,
          status: status,
        });
      }

      return {
        status,
        verified: status === "verified",
        sessionId: user.kycSessionId,
        startedAt: user.kycStartedAt,
      };
    } catch (error: any) {
      console.error("KYC status check failed:", error);
      // Retourner le statut en cache
      return {
        status: (user.kycStatus || "pending") as KycStatus,
        verified: user.kycVerified || false,
        sessionId: user.kycSessionId,
        startedAt: user.kycStartedAt,
      };
    }
  },
});

/**
 * Webhook handler pour les mises à jour de vérification
 * Appelé par Stripe via webhook
 */
export const handleVerificationUpdate = mutation({
  args: {
    sessionId: v.string(),
    status: v.string(), // 'verified', 'requires_input', 'canceled'
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Trouver l'utilisateur avec cette session
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("kycSessionId"), args.sessionId))
      .collect();

    const user = users[0];
    if (!user) {
      throw new Error("Utilisateur non trouvé pour cette session");
    }

    const isVerified = args.status === "verified";

    // Mettre à jour le statut KYC
    await ctx.db.patch(user._id, {
      kycStatus: args.status as any,
      kycVerified: isVerified,
      kycVerifiedAt: isVerified ? Date.now() : undefined,
    });

    // Si vérifié, créer une notification
    if (isVerified) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "kyc_verified",
        title: "Identité vérifiée",
        body: "Ton identité a été vérifiée avec succès. Tu peux maintenant effectuer des retraits.",
        read: false,
        createdAt: Date.now(),
      });
    } else if (args.status === "requires_input") {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "kyc_action_required",
        title: "Action requise",
        body: "Des informations supplémentaires sont nécessaires pour vérifier ton identité.",
        read: false,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      userId: user._id,
      verified: isVerified,
    };
  },
});

/**
 * Obtenir le statut KYC d'un utilisateur
 */
export const getKycStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      status: (user.kycStatus || "none") as KycStatus,
      verified: user.kycVerified || false,
      verifiedAt: user.kycVerifiedAt,
      sessionId: user.kycSessionId,
      startedAt: user.kycStartedAt,
      canWithdraw: user.kycVerified || false,
      requiresVerification: !user.kycVerified,
    };
  },
});

/**
 * Vérifier si l'utilisateur doit compléter le KYC
 * Requis pour:
 * - Premier retrait
 * - Dépôts > 150€
 * - Gains cumulés > 500€
 */
export const checkKycRequired = query({
  args: {
    userId: v.id("users"),
    action: v.union(v.literal("withdrawal"), v.literal("deposit"), v.literal("participation")),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { required: true, reason: "Utilisateur non trouvé" };

    // Si déjà vérifié, pas besoin
    if (user.kycVerified) {
      return { required: false };
    }

    // KYC toujours requis pour les retraits
    if (args.action === "withdrawal") {
      return {
        required: true,
        reason: "Vérification d'identité requise pour les retraits",
      };
    }

    // KYC requis pour les dépôts > 150€
    if (args.action === "deposit" && args.amount && args.amount > 150) {
      return {
        required: true,
        reason: "Vérification d'identité requise pour les dépôts supérieurs à 150€",
      };
    }

    // KYC requis si gains cumulés > 500€
    if ((user.totalEarnings || 0) > 500) {
      return {
        required: true,
        reason: "Vérification d'identité requise (gains cumulés > 500€)",
      };
    }

    return { required: false };
  },
});
