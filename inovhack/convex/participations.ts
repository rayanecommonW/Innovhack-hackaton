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

// Rejoindre un pact sponsorisé
export const joinSponsoredChallenge = mutation({
  args: {
    sponsoredId: v.string(),
    title: v.string(),
    brandName: v.string(),
    category: v.string(),
    minBet: v.number(),
    reward: v.number(),
    rewardText: v.optional(v.string()),
    durationDays: v.number(),
    userId: v.id("users"),
    betAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier la mise minimum
    if (args.betAmount < args.minBet) {
      throw new Error(`Mise minimum: ${args.minBet}€`);
    }

    // Vérifier le solde de l'utilisateur
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");
    if (user.balance < args.betAmount) throw new Error("Solde insuffisant");

    // Chercher si le challenge sponsorisé existe déjà
    let challenge = await ctx.db
      .query("challenges")
      .withIndex("by_sponsor", (q) => q.eq("sponsorId", args.sponsoredId))
      .first();

    // Si non, créer le challenge
    if (!challenge) {
      const challengeId = await ctx.db.insert("challenges", {
        title: args.title,
        description: `Pact sponsorisé par ${args.brandName}`,
        goal: args.title,
        category: args.category,
        minBet: args.minBet,
        maxParticipants: 10000,
        currentParticipants: 0,
        durationDays: args.durationDays,
        status: "active",
        type: "public",
        creatorId: args.userId,
        startDate: Date.now(),
        endDate: Date.now() + args.durationDays * 24 * 60 * 60 * 1000,
        sponsorName: args.brandName,
        sponsorReward: args.reward,
        sponsorRewardText: args.rewardText,
        sponsorId: args.sponsoredId,
        proofType: "photo",
        proofDescription: "Prends une photo prouvant que tu as réalisé le défi",
        proofValidationCriteria: "La photo doit montrer clairement la réalisation du défi",
      });
      challenge = await ctx.db.get(challengeId);
    }

    if (!challenge) throw new Error("Erreur lors de la création du pact");

    // Vérifier que l'utilisateur n'a pas déjà rejoint
    const existing = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", challenge!._id).eq("usertId", args.userId)
      )
      .first();

    if (existing) throw new Error("Vous participez déjà à ce pact");

    // Débiter le montant
    await ctx.db.patch(args.userId, {
      balance: user.balance - args.betAmount,
    });

    // Mettre à jour le nombre de participants
    await ctx.db.patch(challenge._id, {
      currentParticipants: (challenge.currentParticipants || 0) + 1,
    });

    // Créer la participation
    return await ctx.db.insert("participations", {
      challengeId: challenge._id,
      usertId: args.userId,
      betAmount: args.betAmount,
      status: "active",
      joinedAt: Date.now(),
    });
  },
});
