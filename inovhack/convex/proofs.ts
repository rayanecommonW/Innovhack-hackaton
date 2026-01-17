import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { validateProof } from "./ai";

// Soumettre une preuve
export const submitProof = mutation({
  args: {
    participationId: v.id("participations"),
    proofContent: v.string(), // URL de l'image ou texte
    proofValue: v.optional(v.number()), // Valeur numérique si applicable
  },
  handler: async (ctx, args) => {
    // Récupérer la participation
    const participation = await ctx.db.get(args.participationId);
    if (!participation) throw new Error("Participation non trouvée");

    // Vérifier qu'aucune preuve n'a déjà été soumise
    const existingProof = await ctx.db
      .query("proofs")
      .withIndex("by_participation", (q) =>
        q.eq("participationId", args.participationId)
      )
      .first();

    if (existingProof) throw new Error("Une preuve a déjà été soumise");

    // Créer la preuve
    return await ctx.db.insert("proofs", {
      participationId: args.participationId,
      challengeId: participation.challengeId,
      userId: participation.usertId,
      proofContent: args.proofContent,
      proofValue: args.proofValue,
      aiValidation: "pending",
      communityValidation: "pending",
      approveCount: 0,
      vetoCount: 0,
      submittedAt: Date.now(),
    });
  },
});

// Action pour soumettre et valider une preuve avec l'IA
export const submitAndValidateProof = action({
  args: {
    participationId: v.id("participations"),
    proofContent: v.string(),
    proofValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Récupérer les infos nécessaires
    const participation = await ctx.runQuery(api.proofs.getParticipationForProof, {
      participationId: args.participationId,
    });

    if (!participation) throw new Error("Participation non trouvée");

    const challenge = await ctx.runQuery(api.challenges.getChallenge, {
      challengeId: participation.challengeId,
    });

    if (!challenge) throw new Error("Défi non trouvé");

    // Soumettre la preuve
    const proofId = await ctx.runMutation(api.proofs.submitProof, {
      participationId: args.participationId,
      proofContent: args.proofContent,
      proofValue: args.proofValue,
    });

    // Valider avec l'IA
    const validation = await validateProof(
      args.proofContent,
      args.proofValue,
      challenge.proofDescription,
      challenge.proofValidationCriteria,
      challenge.goalValue || 0
    );

    // Mettre à jour la preuve avec le résultat de la validation
    await ctx.runMutation(api.proofs.updateProofValidation, {
      proofId,
      approved: validation.approved,
      comment: validation.comment,
    });

    // Si validée, marquer la participation comme gagnée
    if (validation.approved) {
      await ctx.runMutation(api.participations.updateParticipationStatus, {
        participationId: args.participationId,
        status: "won",
      });
    }

    return {
      proofId,
      validation,
    };
  },
});

// Mettre à jour la validation d'une preuve
export const updateProofValidation = mutation({
  args: {
    proofId: v.id("proofs"),
    approved: v.boolean(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proofId, {
      aiValidation: args.approved ? "approved" : "rejected",
      aiComment: args.comment,
      validatedAt: Date.now(),
    });
  },
});

// Helper pour récupérer une participation (utilisé par l'action)
export const getParticipationForProof = query({
  args: { participationId: v.id("participations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.participationId);
  },
});

// Récupérer les preuves d'un défi
export const getChallengeProofs = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Enrichir avec les données utilisateur
    const enriched = await Promise.all(
      proofs.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user };
      })
    );

    return enriched;
  },
});

// Récupérer les preuves d'un utilisateur
export const getMyProofs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrichir avec les données du défi
    const enriched = await Promise.all(
      proofs.map(async (p) => {
        const challenge = await ctx.db.get(p.challengeId);
        return { ...p, challenge };
      })
    );

    return enriched;
  },
});

// Récupérer une preuve par participation
export const getProofByParticipation = query({
  args: { participationId: v.id("participations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofs")
      .withIndex("by_participation", (q) =>
        q.eq("participationId", args.participationId)
      )
      .first();
  },
});
