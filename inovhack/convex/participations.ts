import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Rejoindre un défi et miser
export const joinChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    betAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier que le défi existe
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Défi non trouvé");

    // Vérifier que le défi est ouvert
    if (challenge.status !== "pending" && challenge.status !== "active") {
      throw new Error("Ce défi n'accepte plus de participants");
    }

    // Vérifier la mise minimum
    if (args.betAmount < challenge.minBet) {
      throw new Error(`Mise minimum: ${challenge.minBet}€`);
    }

    // Vérifier que l'utilisateur n'a pas déjà rejoint
    const existing = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("usertId", args.userId)
      )
      .first();

    if (existing) throw new Error("Vous participez déjà à ce défi");

    // Vérifier le solde de l'utilisateur
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");
    if (user.balance < args.betAmount) throw new Error("Solde insuffisant");

    // Débiter le montant
    await ctx.db.patch(args.userId, {
      balance: user.balance - args.betAmount,
    });

    // Créer la participation
    return await ctx.db.insert("participations", {
      challengeId: args.challengeId,
      usertId: args.userId,
      betAmount: args.betAmount,
      status: "active",
      joinedAt: Date.now(),
    });
  },
});

// Récupérer les participations d'un utilisateur
export const getMyParticipations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .collect();

    // Enrichir avec les données du défi
    const enriched = await Promise.all(
      participations.map(async (p) => {
        const challenge = await ctx.db.get(p.challengeId);
        return { ...p, challenge };
      })
    );

    return enriched;
  },
});

// Récupérer les participants d'un défi
export const getChallengeParticipants = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Enrichir avec les données utilisateur
    const enriched = await Promise.all(
      participations.map(async (p) => {
        const user = await ctx.db.get(p.usertId);
        return { ...p, user };
      })
    );

    return enriched;
  },
});

// Récupérer une participation spécifique
export const getParticipation = query({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("usertId", args.userId)
      )
      .first();
  },
});

// Calculer le pot total d'un défi
export const getChallengePot = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const total = participations.reduce((sum, p) => sum + p.betAmount, 0);
    return {
      total,
      participantCount: participations.length,
    };
  },
});

// Mettre à jour le status d'une participation (gagné/perdu)
export const updateParticipationStatus = mutation({
  args: {
    participationId: v.id("participations"),
    status: v.string(), // "won" ou "lost"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participationId, { status: args.status });
  },
});
