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
import { verifyAuthenticatedUser } from "./authHelper";

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
    type: v.string(), // "public", "friends", or "group"
    creatorId: v.id("users"),
    groupId: v.optional(v.id("groups")), // Optional: if creating in a group
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
    validationDeadline: v.optional(v.number()), // endDate + 24h pour validation
    // Group pact settings
    allowMembersToJoin: v.optional(v.boolean()), // Allow group members to join (default true)
    groupValidationDeadlineHours: v.optional(v.number()), // Hours for group to vote (default 24h)
    groupValidationThreshold: v.optional(v.number()), // Percentage needed (default 50)
    creatorBetAmount: v.optional(v.number()), // Creator's own bet (can be different from minBet)
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le créateur
    await verifyAuthenticatedUser(ctx, args.creatorId);

    const now = Date.now();

    // === INPUT VALIDATION ===
    // Title validation
    if (!args.title.trim() || args.title.length < 3 || args.title.length > 100) {
      throw new Error("Le titre doit contenir entre 3 et 100 caractères");
    }

    // Bet amount validation
    if (args.minBet < 1) {
      throw new Error("La mise minimum doit être d'au moins 1€");
    }
    if (args.minBet > 1000) {
      throw new Error("La mise maximum est de 1000€");
    }

    // Date validation
    if (args.endDate <= args.startDate) {
      throw new Error("La date de fin doit être après la date de début");
    }
    if (args.endDate <= now) {
      throw new Error("La date de fin doit être dans le futur");
    }
    // Max duration: 1 year
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (args.endDate - args.startDate > maxDuration) {
      throw new Error("La durée maximum d'un pact est de 1 an");
    }

    // Type validation
    if (!["public", "friends", "group"].includes(args.type)) {
      throw new Error("Type invalide (public, friends ou group)");
    }

    // If groupId is provided, verify membership
    if (args.groupId) {
      const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", args.groupId!).eq("userId", args.creatorId))
        .first();

      if (!membership) {
        throw new Error("Tu dois être membre du groupe pour créer un pact");
      }
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) {
      throw new Error("Utilisateur non trouvé");
    }

    // For group pacts, check balance upfront (use creatorBetAmount or minBet)
    const creatorBet = args.creatorBetAmount || args.minBet;
    if (args.groupId && (creator.balance || 0) < creatorBet) {
      throw new Error(`Solde insuffisant. Tu as ${creator.balance || 0}€ et ta mise est de ${creatorBet}€`);
    }

    // Récupérer le code promo sponsor pour cette catégorie
    const promo = SPONSOR_PROMOS[args.category];

    // Calculer la deadline de validation si non fournie
    const validationDeadline = args.validationDeadline || (args.endDate + 24 * 60 * 60 * 1000);

    // Set defaults for group pacts
    const allowMembersToJoin = args.allowMembersToJoin !== undefined ? args.allowMembersToJoin : true;
    const groupValidationDeadlineHours = args.groupValidationDeadlineHours || 24;
    const groupValidationThreshold = args.groupValidationThreshold || 50;

    const challengeId = await ctx.db.insert("challenges", {
      ...args,
      validationDeadline,
      status: args.groupId ? "active" : "pending", // Group pacts are active immediately
      sponsorName: promo?.sponsor,
      sponsorPromoCode: promo?.code,
      sponsorDiscount: promo?.discount,
      // Group pact settings
      allowMembersToJoin: args.groupId ? allowMembersToJoin : undefined,
      groupValidationDeadlineHours: args.groupId ? groupValidationDeadlineHours : undefined,
      groupValidationThreshold: args.groupId ? groupValidationThreshold : undefined,
      currentParticipants: args.groupId ? 1 : 0,
    });

    // For group pacts, automatically add creator as participant
    if (args.groupId) {
      const creatorBetAmount = args.creatorBetAmount || args.minBet;

      // Debit the bet amount from creator (balance already checked above)
      await ctx.db.patch(args.creatorId, {
        balance: (creator.balance || 0) - creatorBetAmount,
        totalPacts: (creator.totalPacts || 0) + 1,
      });

      // Create participation for creator
      await ctx.db.insert("participations", {
        challengeId,
        usertId: args.creatorId,
        betAmount: creatorBetAmount,
        status: "active",
        joinedAt: Date.now(),
      });
    }

    return challengeId;
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
    endTimestamp: v.optional(v.number()), // Timestamp précis de fin (optionnel)
  },
  handler: async (ctx, args) => {
    // L'IA génère les critères de preuve basés sur le titre
    const proofReqs = await generateProofFromTitle(args.title);

    const now = Date.now();
    // Utiliser le timestamp précis si fourni, sinon calculer depuis durationDays
    const endDate = args.endTimestamp || (now + args.durationDays * 24 * 60 * 60 * 1000);

    // Période de grâce pour validation = 24h après endDate
    const validationDeadline = endDate + 24 * 60 * 60 * 1000;

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
      validationDeadline,
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

// Lister les défis créés par un utilisateur avec les participants
export const getMyCreatedChallengesWithParticipants = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();

    // Pour chaque challenge, récupérer les participants
    const challengesWithParticipants = await Promise.all(
      challenges.map(async (challenge) => {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        // Récupérer les infos des utilisateurs
        const participants = await Promise.all(
          participations
            .filter((p) => p.usertId) // Filter out participations without userId
            .map(async (p) => {
              const user = p.usertId ? await ctx.db.get(p.usertId) : null;
              return {
                participationId: p._id,
                userId: p.usertId,
                name: user?.name || "Anonyme",
                username: user?.username,
                profileImageUrl: user?.profileImageUrl,
                betAmount: p.betAmount,
                status: p.status,
                joinedAt: p._creationTime,
              };
            })
        );

        return {
          ...challenge,
          participants,
          participantCount: participants.length,
          totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
        };
      })
    );

    return challengesWithParticipants;
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

// Supprimer un défi (seulement si aucun participant)
export const deleteChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Vérifier que le défi existe
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Vérifier que l'utilisateur est le créateur
    if (challenge.creatorId !== args.userId) {
      throw new Error("Seul le créateur peut supprimer ce pact");
    }

    // Vérifier qu'il n'y a pas de participants
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    if (participations.length > 0) {
      throw new Error("Impossible de supprimer un pact avec des participants");
    }

    // Supprimer les messages associés
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Supprimer le défi
    await ctx.db.delete(args.challengeId);

    return { success: true };
  },
});

// Get public/active challenges (for discovery)
export const getPublicChallenges = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const now = Date.now();

    // Get active public challenges
    let challenges = await ctx.db
      .query("challenges")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "public"),
          q.or(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "pending")
          ),
          q.gt(q.field("endDate"), now)
        )
      )
      .order("desc")
      .take(limit * 2); // Take more to filter

    // Filter by category if specified
    if (args.category) {
      challenges = challenges.filter((c) => c.category === args.category);
    }

    // Enrich with participant count
    const enriched = await Promise.all(
      challenges.slice(0, limit).map(async (challenge) => {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        const creator = await ctx.db.get(challenge.creatorId);

        return {
          ...challenge,
          participantCount: participations.length,
          totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
          creator: creator ? { name: creator.name, username: creator.username } : null,
        };
      })
    );

    return enriched;
  },
});

// Get challenges for a specific group
export const getGroupChallenges = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    // Get all challenges in this group
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Enrich with creator info and participants
    const enriched = await Promise.all(
      challenges.map(async (challenge) => {
        const creator = await ctx.db.get(challenge.creatorId);

        // Get creator profile image
        let creatorWithImage = creator;
        if (creator?.profileImageId) {
          const imageUrl = await ctx.storage.getUrl(creator.profileImageId);
          creatorWithImage = { ...creator, profileImageUrl: imageUrl || creator.profileImageUrl };
        }

        const participations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        // Enrich participations with user info
        const enrichedParticipants = await Promise.all(
          participations.map(async (p) => {
            const user = await ctx.db.get(p.usertId);
            return { ...p, user };
          })
        );

        return {
          ...challenge,
          creator: creatorWithImage,
          participants: enrichedParticipants,
          currentParticipants: participations.length,
          totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
        };
      })
    );

    // Sort by status (active first) then by end date
    return enriched.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return b.endDate - a.endDate;
    });
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

// ============ CLEANUP MUTATIONS ============

// Delete ALL challenges and related data (use with caution - admin only)
export const deleteAllChallenges = mutation({
  handler: async (ctx) => {
    // Get all challenges
    const challenges = await ctx.db.query("challenges").collect();
    let deletedChallenges = 0;
    let deletedParticipations = 0;
    let deletedProofs = 0;
    let deletedMessages = 0;

    for (const challenge of challenges) {
      // Delete participations for this challenge
      const participations = await ctx.db
        .query("participations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const p of participations) {
        await ctx.db.delete(p._id);
        deletedParticipations++;
      }

      // Delete proofs for this challenge
      const proofs = await ctx.db
        .query("proofs")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const proof of proofs) {
        await ctx.db.delete(proof._id);
        deletedProofs++;
      }

      // Delete messages for this challenge
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
        deletedMessages++;
      }

      // Delete the challenge itself
      await ctx.db.delete(challenge._id);
      deletedChallenges++;
    }

    return {
      deletedChallenges,
      deletedParticipations,
      deletedProofs,
      deletedMessages,
    };
  },
});

// Delete only sponsored challenges
export const deleteSponsoredChallenges = mutation({
  handler: async (ctx) => {
    const challenges = await ctx.db.query("challenges").collect();
    const sponsoredChallenges = challenges.filter(c => c.sponsorName);

    let deleted = 0;
    let deletedParticipations = 0;

    for (const challenge of sponsoredChallenges) {
      // Delete participations
      const participations = await ctx.db
        .query("participations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const p of participations) {
        await ctx.db.delete(p._id);
        deletedParticipations++;
      }

      // Delete proofs
      const proofs = await ctx.db
        .query("proofs")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const proof of proofs) {
        await ctx.db.delete(proof._id);
      }

      // Delete messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      await ctx.db.delete(challenge._id);
      deleted++;
    }

    return { deleted, deletedParticipations };
  },
});

// Delete only community (non-sponsored public) challenges
export const deleteCommunityPublicChallenges = mutation({
  handler: async (ctx) => {
    const challenges = await ctx.db.query("challenges").collect();
    const communityChallenges = challenges.filter(c => c.type === "public" && !c.sponsorName);

    let deleted = 0;
    let deletedParticipations = 0;

    for (const challenge of communityChallenges) {
      // Delete participations
      const participations = await ctx.db
        .query("participations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const p of participations) {
        await ctx.db.delete(p._id);
        deletedParticipations++;
      }

      // Delete proofs
      const proofs = await ctx.db
        .query("proofs")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const proof of proofs) {
        await ctx.db.delete(proof._id);
      }

      // Delete messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      await ctx.db.delete(challenge._id);
      deleted++;
    }

    return { deleted, deletedParticipations };
  },
});
