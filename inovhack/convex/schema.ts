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
    category: v.string(), // "procrastination", "sport", "screen_time", "social", etc.
    type: v.string(), // "public" ou "friends"
    creatorId: v.id("users"),

    // Objectif du défi
    goal: v.string(), // Ex: "10000 pas par jour"
    goalValue: v.optional(v.number()), // Ex: 10000
    goalUnit: v.optional(v.string()), // Ex: "pas"

    // Preuve requise (générée par l'IA)
    proofType: v.string(), // "screenshot", "photo", "text", "number"
    proofDescription: v.string(), // Ex: "Screenshot de votre compteur de pas"
    proofValidationCriteria: v.string(), // Ex: "Le nombre de pas doit être >= 10000"

    // Mise minimum
    minBet: v.number(),

    // Dates
    startDate: v.number(),
    endDate: v.number(),

    // Status
    status: v.string(), // "pending", "active", "completed", "cancelled"

    // Code promo sponsor (hardcodé pour la démo)
    sponsorName: v.optional(v.string()),
    sponsorPromoCode: v.optional(v.string()),
    sponsorDiscount: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_creator", ["creatorId"]),

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

    submittedAt: v.number(),
    validatedAt: v.optional(v.number()),
  })
    .index("by_participation", ["participationId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

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
});
