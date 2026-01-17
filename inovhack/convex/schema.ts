import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Utilisateurs
  users: defineTable({
    name: v.string(),
    email: v.string(),
    balance: v.number(), // Solde en euros
    totalWins: v.number(),
    totalLosses: v.number(),
  }).index("by_email", ["email"]),

  // Défis
  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(), // catégorie parmi 99+
    type: v.string(), // "public" ou "friends"
    creatorId: v.id("users"),

    // Code invitation (pour pacts entre amis)
    inviteCode: v.optional(v.string()), // 6 chiffres

    // Objectif du défi (optionnel maintenant)
    goal: v.optional(v.string()),
    goalValue: v.optional(v.number()),
    goalUnit: v.optional(v.string()),

    // Preuve requise (générée par l'IA)
    proofType: v.string(), // "screenshot", "photo", "text", "number"
    proofDescription: v.string(),
    proofValidationCriteria: v.string(),

    // Mise minimum
    minBet: v.number(),

    // Dates
    startDate: v.number(),
    endDate: v.number(),

    // Status
    status: v.string(), // "pending", "active", "completed", "cancelled"

    // Sponsor (pour pacts B2B)
    sponsorName: v.optional(v.string()),
    sponsorPromoCode: v.optional(v.string()),
    sponsorDiscount: v.optional(v.string()),
    sponsorReward: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_creator", ["creatorId"])
    .index("by_invite_code", ["inviteCode"]),

  // Participations aux défis (paris)
  participations: defineTable({
    challengeId: v.id("challenges"),
    usertId: v.id("users"),
    betAmount: v.number(), // Montant misé
    status: v.string(), // "active", "won", "lost"
    joinedAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["usertId"])
    .index("by_challenge_user", ["challengeId", "usertId"]),

  // Preuves soumises
  proofs: defineTable({
    participationId: v.id("participations"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),

    // Contenu de la preuve
    proofContent: v.string(), // URL de l'image ou texte
    proofValue: v.optional(v.number()), // Valeur numérique si applicable

    // Validation par l'IA
    aiValidation: v.optional(v.string()), // "pending", "approved", "rejected"
    aiComment: v.optional(v.string()), // Commentaire de l'IA

    // Validation communautaire
    communityValidation: v.optional(v.string()), // "pending", "approved", "rejected"
    approveCount: v.optional(v.number()),
    vetoCount: v.optional(v.number()),

    submittedAt: v.number(),
    validatedAt: v.optional(v.number()),
  })
    .index("by_participation", ["participationId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

  // Votes communautaires sur les preuves
  votes: defineTable({
    proofId: v.id("proofs"),
    voterId: v.id("users"),
    challengeId: v.id("challenges"),
    voteType: v.string(), // "approve" ou "veto"
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_voter", ["voterId"])
    .index("by_proof_voter", ["proofId", "voterId"]),

  // Gains distribués
  rewards: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    amount: v.number(),
    promoCode: v.optional(v.string()),
    promoSponsor: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

  // Transactions (dépôts/retraits)
  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(), // "deposit", "withdrawal"
    method: v.string(), // "card", "crypto", "apple_pay", "google_pay"
    status: v.string(), // "pending", "completed", "failed"
    reference: v.optional(v.string()), // ID externe (Stripe, etc.)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
