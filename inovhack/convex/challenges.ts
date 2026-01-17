import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  generateChallengeIdeas,
  determineProofRequirements,
  selectCategoryFromTitle,
  generateProofFromTitle,
  SPONSOR_PROMOS,
} from "./ai";

// Générer un code d'invitation unique à 6 chiffres
function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Créer un nouveau défi
export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.string(), // "public" ou "friends"
    creatorId: v.id("users"),
    goal: v.optional(v.string()),
    goalValue: v.optional(v.number()),
    goalUnit: v.optional(v.string()),
    proofType: v.string(),
    proofDescription: v.string(),
    proofValidationCriteria: v.string(),
    minBet: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    inviteCode: v.optional(v.string()),
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

// Nouvelle action simplifiée pour créer un Pact
// L'IA détermine automatiquement la catégorie et les preuves
export const createPactSimple = action({
  args: {
    title: v.string(),
    category: v.string(), // Catégorie sélectionnée ou auto-détectée
    type: v.string(), // "public" ou "friends"
    creatorId: v.id("users"),
    minBet: v.number(),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    // L'IA génère les critères de preuve basés sur le titre
    const proofReqs = await generateProofFromTitle(args.title);

    const now = Date.now();
    const endDate = now + args.durationDays * 24 * 60 * 60 * 1000;

    // Générer un code d'invitation si c'est un pact entre amis
    let inviteCode: string | undefined;
    if (args.type === "friends") {
      inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Créer le défi
    const challengeId = await ctx.runMutation(api.challenges.createChallenge, {
      title: args.title,
      description: args.title,
      category: args.category,
      type: args.type,
      creatorId: args.creatorId,
      proofType: proofReqs.proofType,
      proofDescription: proofReqs.proofDescription,
      proofValidationCriteria: proofReqs.proofValidationCriteria,
      minBet: args.minBet,
      startDate: now,
      endDate: endDate,
      inviteCode,
    });

    return { challengeId, inviteCode };
  },
});

// Action pour auto-sélectionner la catégorie via l'IA
export const autoSelectCategory = action({
  args: {
    title: v.string(),
    categories: v.array(v.object({ id: v.string(), name: v.string() })),
  },
  handler: async (ctx, args) => {
    const categoryId = await selectCategoryFromTitle(args.title, args.categories);
    return categoryId;
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

// Lister les défis sponsorisés (avec sponsorName)
export const listSponsoredChallenges = query({
  handler: async (ctx) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_type", (q) => q.eq("type", "public"))
      .filter((q) =>
        q.and(
          q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "active")),
          q.neq(q.field("sponsorName"), undefined)
        )
      )
      .collect();
    return challenges.filter((c) => c.sponsorName);
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

// Récupérer un défi par code d'invitation
export const getChallengeByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode))
      .first();
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
        category: "steps",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de votre compteur de pas",
        proofValidationCriteria: "Le nombre de pas affiché doit être >= 10000",
        minBet: 10,
      },
      {
        title: "Digital Detox",
        description: "Moins de 2h de téléphone dans la journée",
        category: "screen_time",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot du temps d'écran",
        proofValidationCriteria: "Le temps d'écran total doit être <= 120 minutes",
        minBet: 15,
      },
      {
        title: "Morning Runner",
        description: "Cours 5km chaque matin pendant une semaine",
        category: "running",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de votre app de running",
        proofValidationCriteria: "Distance >= 5km",
        minBet: 20,
      },
      {
        title: "Read 30 Pages Daily",
        description: "Lis 30 pages par jour pendant 7 jours",
        category: "reading",
        type: "public",
        proofType: "photo",
        proofDescription: "Photo de ta progression de lecture",
        proofValidationCriteria: "Photo montrant la page actuelle",
        minBet: 10,
      },
    ];

    // Sponsored challenges (B2B)
    const sponsoredChallenges = [
      {
        title: "Design Challenge Figma",
        description: "Crée un design system complet sur Figma",
        category: "design",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de ton design system Figma",
        proofValidationCriteria: "Design system avec composants",
        minBet: 25,
        sponsorName: "Figma",
        sponsorPromoCode: "FIGMA2024",
        sponsorDiscount: "3 mois Pro gratuits",
        sponsorReward: 50,
      },
      {
        title: "Productivité Notion",
        description: "Organise ta vie avec Notion pendant 30 jours",
        category: "organization",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de ton workspace Notion",
        proofValidationCriteria: "Workspace organisé avec tâches",
        minBet: 15,
        sponsorName: "Notion",
        sponsorPromoCode: "NOTION30",
        sponsorDiscount: "1 mois gratuit Plus",
        sponsorReward: 30,
      },
      {
        title: "Amazon Reading Challenge",
        description: "Termine 3 livres Kindle ce mois-ci",
        category: "reading",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de ta bibliothèque Kindle",
        proofValidationCriteria: "3 livres marqués terminés",
        minBet: 20,
        sponsorName: "Amazon",
        sponsorPromoCode: "KINDLE20",
        sponsorDiscount: "20€ de crédit Kindle",
        sponsorReward: 40,
      },
      {
        title: "Duolingo Streak 30 jours",
        description: "Maintiens ta streak Duolingo pendant 30 jours",
        category: "language",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de ta streak Duolingo",
        proofValidationCriteria: "Streak >= 30 jours",
        minBet: 10,
        sponsorName: "Duolingo",
        sponsorPromoCode: "DUO30FREE",
        sponsorDiscount: "1 mois Super gratuit",
        sponsorReward: 25,
      },
      {
        title: "Calm Meditation Challenge",
        description: "Médite 10 min par jour pendant 21 jours",
        category: "meditation",
        type: "public",
        proofType: "screenshot",
        proofDescription: "Screenshot de ton historique Calm",
        proofValidationCriteria: "21 sessions complétées",
        minBet: 15,
        sponsorName: "Calm",
        sponsorPromoCode: "CALM21",
        sponsorDiscount: "50% sur l'abonnement annuel",
        sponsorReward: 35,
      },
    ];

    const challengeIds = [];

    // Insert regular challenges
    for (const challenge of demoChallenges) {
      const id = await ctx.db.insert("challenges", {
        ...challenge,
        creatorId: args.creatorId,
        startDate: now,
        endDate: now + oneWeek,
        status: "active",
      });
      challengeIds.push(id);
    }

    // Insert sponsored challenges
    for (const challenge of sponsoredChallenges) {
      const id = await ctx.db.insert("challenges", {
        ...challenge,
        creatorId: args.creatorId,
        startDate: now,
        endDate: now + oneWeek * 4, // 1 month for sponsored
        status: "active",
      });
      challengeIds.push(id);
    }

    return challengeIds;
  },
});
