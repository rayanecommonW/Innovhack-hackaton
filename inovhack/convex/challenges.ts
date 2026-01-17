import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  generateChallengeIdeas,
  determineProofRequirements,
  SPONSOR_PROMOS,
} from "./ai";

// Créer un nouveau défi
export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.string(), // "public" ou "friends"
    creatorId: v.id("users"),
    goal: v.string(),
    goalValue: v.optional(v.number()),
    goalUnit: v.optional(v.string()),
    proofType: v.string(),
    proofDescription: v.string(),
    proofValidationCriteria: v.string(),
    minBet: v.number(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Récupérer le code promo sponsor pour cette catégorie
    const promo = SPONSOR_PROMOS[args.category];

    return await ctx.db.insert("challenges", {
      ...args,
      status: "pending",
      sponsorName: promo?.sponsor,
      sponsorPromoCode: promo?.code,
      sponsorDiscount: promo?.discount,
    });
  },
});

// Action pour créer un défi avec l'IA qui détermine les preuves
export const createChallengeWithAI = action({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.string(),
    creatorId: v.id("users"),
    goal: v.string(),
    goalValue: v.number(),
    goalUnit: v.string(),
    minBet: v.number(),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    // L'IA détermine le type de preuve requis
    const proofReqs = await determineProofRequirements(
      args.goal,
      args.goalValue,
      args.goalUnit
    );

    const now = Date.now();
    const endDate = now + args.durationDays * 24 * 60 * 60 * 1000;

    // Créer le défi
    const challengeId = await ctx.runMutation(api.challenges.createChallenge, {
      title: args.title,
      description: args.description,
      category: args.category,
      type: args.type,
      creatorId: args.creatorId,
      goal: args.goal,
      goalValue: args.goalValue,
      goalUnit: args.goalUnit,
      proofType: proofReqs.proofType,
      proofDescription: proofReqs.proofDescription,
      proofValidationCriteria: proofReqs.proofValidationCriteria,
      minBet: args.minBet,
      startDate: now,
      endDate: endDate,
    });

    return challengeId;
  },
});

// Générer des suggestions de défis avec l'IA
export const suggestChallenges = action({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const suggestions = await generateChallengeIdeas(args.category);
    return suggestions;
  },
});

// Lister les défis publics actifs
export const listPublicChallenges = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_type", (q) => q.eq("type", "public"))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active"))
      )
      .collect();
  },
});

// Lister les défis par catégorie
export const listChallengesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active"))
      )
      .collect();
  },
});

// Récupérer un défi par ID
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.challengeId);
  },
});

// Lister les défis créés par un utilisateur
export const getMyChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
  },
});

// Activer un défi (quand assez de participants)
export const activateChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, { status: "active" });
  },
});

// Terminer un défi
export const completeChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, { status: "completed" });
  },
});

// Créer des défis de démo
export const seedDemoChallenges = mutation({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const demoChallenges = [
      {
        title: "10K Steps Challenge",
        description: "Marche 10 000 pas chaque jour pendant une semaine",
        category: "sport",
        type: "public",
        goal: "Faire 10000 pas par jour",
        goalValue: 10000,
        goalUnit: "pas",
        proofType: "screenshot",
        proofDescription: "Screenshot de votre compteur de pas (iPhone Santé ou autre)",
        proofValidationCriteria: "Le nombre de pas affiché doit être >= 10000",
        minBet: 10,
      },
      {
        title: "Digital Detox",
        description: "Moins de 2h de téléphone dans la journée",
        category: "screen_time",
        type: "public",
        goal: "Maximum 2h d'écran",
        goalValue: 120,
        goalUnit: "minutes",
        proofType: "screenshot",
        proofDescription: "Screenshot du temps d'écran de votre téléphone",
        proofValidationCriteria: "Le temps d'écran total doit être <= 120 minutes",
        minBet: 15,
      },
      {
        title: "Deep Work Session",
        description: "2 heures de travail concentré sans distraction",
        category: "procrastination",
        type: "friends",
        goal: "Travailler 2h sans interruption",
        goalValue: 2,
        goalUnit: "heures",
        proofType: "screenshot",
        proofDescription: "Screenshot de votre timer/app de focus (Forest, etc.)",
        proofValidationCriteria: "Le timer doit montrer >= 2 heures de focus",
        minBet: 20,
      },
      {
        title: "Social Butterfly",
        description: "Engage la conversation avec 3 inconnus aujourd'hui",
        category: "social",
        type: "friends",
        goal: "Parler à 3 inconnus",
        goalValue: 3,
        goalUnit: "personnes",
        proofType: "text",
        proofDescription: "Décris brièvement tes 3 conversations",
        proofValidationCriteria: "3 conversations distinctes décrites",
        minBet: 5,
      },
    ];

    const challengeIds = [];
    for (const challenge of demoChallenges) {
      const promo = SPONSOR_PROMOS[challenge.category];
      const id = await ctx.db.insert("challenges", {
        ...challenge,
        creatorId: args.creatorId,
        startDate: now,
        endDate: now + oneWeek,
        status: "active",
        sponsorName: promo?.sponsor,
        sponsorPromoCode: promo?.code,
        sponsorDiscount: promo?.discount,
      });
      challengeIds.push(id);
    }

    return challengeIds;
  },
});
