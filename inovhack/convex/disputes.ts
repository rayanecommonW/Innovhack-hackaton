/**
 * Disputes / Contestations
 * Système de gestion des litiges pour les preuves contestées
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuthenticatedUser, verifyAuthenticatedAdmin } from "./authHelper";

// Raisons de contestation prédéfinies
export const DISPUTE_REASONS = [
  { key: "fake_proof", label: "Preuve falsifiée", description: "La preuve semble être truquée ou modifiée" },
  { key: "wrong_date", label: "Mauvaise date", description: "La preuve n'a pas été faite pendant la période du pact" },
  { key: "not_matching", label: "Ne correspond pas", description: "La preuve ne correspond pas à l'objectif demandé" },
  { key: "cheating", label: "Triche", description: "Le participant a triché pour atteindre l'objectif" },
  { key: "other", label: "Autre", description: "Autre raison" },
];

/**
 * Créer une contestation
 */
export const createDispute = mutation({
  args: {
    proofId: v.id("proofs"),
    disputerId: v.id("users"),
    reason: v.string(),
    description: v.string(),
    evidence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le contestataire
    await verifyAuthenticatedUser(ctx, args.disputerId);

    // Récupérer la preuve
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    // Vérifier que l'utilisateur ne conteste pas sa propre preuve
    if (proof.userId === args.disputerId) {
      throw new Error("Tu ne peux pas contester ta propre preuve");
    }

    // Vérifier si une contestation existe déjà pour cette preuve par cet utilisateur
    const existingDispute = await ctx.db
      .query("disputes")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .filter((q) => q.eq(q.field("disputerId"), args.disputerId))
      .first();

    if (existingDispute) {
      throw new Error("Tu as déjà contesté cette preuve");
    }

    // Vérifier que le contestataire participe au même challenge
    const challenge = await ctx.db.get(proof.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    const disputerParticipation = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", proof.challengeId).eq("usertId", args.disputerId)
      )
      .first();

    // Permettre à l'organisateur ou aux participants de contester
    const isOrganizer = challenge.creatorId === args.disputerId;
    if (!disputerParticipation && !isOrganizer) {
      throw new Error("Tu dois participer au pact pour contester une preuve");
    }

    // Créer la contestation
    const disputeId = await ctx.db.insert("disputes", {
      proofId: args.proofId,
      challengeId: proof.challengeId,
      disputerId: args.disputerId,
      targetUserId: proof.userId,
      reason: args.reason,
      description: args.description,
      evidence: args.evidence,
      status: "pending",
      createdAt: Date.now(),
    });

    // Notifier le propriétaire de la preuve
    const disputer = await ctx.db.get(args.disputerId);
    await ctx.db.insert("notifications", {
      userId: proof.userId,
      type: "dispute_created",
      title: "Ta preuve est contestée",
      body: `${disputer?.name || "Quelqu'un"} a contesté ta preuve pour "${challenge.title}"`,
      data: JSON.stringify({ disputeId, proofId: args.proofId, challengeId: proof.challengeId }),
      read: false,
      createdAt: Date.now(),
    });

    // Notifier l'organisateur si ce n'est pas lui qui conteste
    if (!isOrganizer) {
      await ctx.db.insert("notifications", {
        userId: challenge.creatorId,
        type: "dispute_created",
        title: "Nouvelle contestation",
        body: `Une preuve a été contestée dans ton pact "${challenge.title}"`,
        data: JSON.stringify({ disputeId, proofId: args.proofId, challengeId: proof.challengeId }),
        read: false,
        createdAt: Date.now(),
      });
    }

    return disputeId;
  },
});

/**
 * Résoudre une contestation (par un ADMIN PACT uniquement)
 * Les admins sont neutres et tranchent les litiges
 */
export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    resolverId: v.id("users"),
    decision: v.string(), // "favor_disputer" | "favor_target" | "dismissed"
    resolution: v.string(), // Explication
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est un admin
    await verifyAuthenticatedAdmin(ctx, args.resolverId);

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Contestation non trouvée");

    if (dispute.status !== "pending" && dispute.status !== "under_review") {
      throw new Error("Cette contestation a déjà été résolue");
    }

    const challenge = await ctx.db.get(dispute.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Seul un ADMIN PACT peut résoudre les litiges (pas l'organisateur)
    const resolver = await ctx.db.get(args.resolverId);
    if (!resolver?.isAdmin) {
      throw new Error("Seul un administrateur PACT peut résoudre les litiges");
    }

    // Mettre à jour la contestation
    const statusMap: Record<string, string> = {
      favor_disputer: "resolved_favor_disputer",
      favor_target: "resolved_favor_target",
      dismissed: "dismissed",
    };

    await ctx.db.patch(args.disputeId, {
      status: statusMap[args.decision] || "dismissed",
      resolution: args.resolution,
      resolvedBy: args.resolverId,
      resolvedAt: Date.now(),
    });

    // Si la contestation est en faveur du contestataire, invalider la preuve
    if (args.decision === "favor_disputer") {
      const proof = await ctx.db.get(dispute.proofId);
      if (proof) {
        await ctx.db.patch(dispute.proofId, {
          organizerValidation: "rejected",
          organizerComment: `Preuve invalidée suite à contestation: ${args.resolution}`,
          validatedAt: Date.now(),
        });

        // Mettre à jour la participation
        const participation = await ctx.db
          .query("participations")
          .withIndex("by_challenge_user", (q) =>
            q.eq("challengeId", dispute.challengeId).eq("usertId", dispute.targetUserId)
          )
          .first();

        if (participation && participation.status === "won") {
          await ctx.db.patch(participation._id, {
            status: "lost",
            validatedAt: Date.now(),
          });

          // Mettre à jour les stats
          const user = await ctx.db.get(dispute.targetUserId);
          if (user) {
            await ctx.db.patch(dispute.targetUserId, {
              totalWins: Math.max(0, (user.totalWins || 0) - 1),
              totalLosses: (user.totalLosses || 0) + 1,
              currentStreak: 0,
            });
          }
        }
      }
    }

    // Notifier les deux parties
    const disputer = await ctx.db.get(dispute.disputerId);
    const target = await ctx.db.get(dispute.targetUserId);

    const isDisputerWin = args.decision === "favor_disputer";

    await ctx.db.insert("notifications", {
      userId: dispute.disputerId,
      type: "dispute_resolved",
      title: isDisputerWin ? "Contestation acceptée" : "Contestation rejetée",
      body: isDisputerWin
        ? `Ta contestation a été acceptée. ${args.resolution}`
        : `Ta contestation a été rejetée. ${args.resolution}`,
      data: JSON.stringify({ disputeId: args.disputeId }),
      read: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: dispute.targetUserId,
      type: "dispute_resolved",
      title: isDisputerWin ? "Preuve invalidée" : "Preuve maintenue",
      body: isDisputerWin
        ? `Ta preuve a été invalidée suite à une contestation. ${args.resolution}`
        : `La contestation contre ta preuve a été rejetée. ${args.resolution}`,
      data: JSON.stringify({ disputeId: args.disputeId }),
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Récupérer les contestations d'un pact
 */
export const getChallengeDisputes = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const disputer = await ctx.db.get(dispute.disputerId);
        const target = await ctx.db.get(dispute.targetUserId);
        const proof = await ctx.db.get(dispute.proofId);
        const resolver = dispute.resolvedBy ? await ctx.db.get(dispute.resolvedBy) : null;

        return {
          ...dispute,
          disputer,
          target,
          proof,
          resolver,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Récupérer TOUTES les contestations en attente (pour les ADMINS PACT)
 */
export const getPendingDisputesForAdmin = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    // Vérifier que c'est un admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin?.isAdmin) {
      return []; // Non-admin ne voit rien
    }

    // Récupérer toutes les contestations en attente
    const pendingDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const enriched = await Promise.all(
      pendingDisputes.map(async (dispute) => {
        const disputer = await ctx.db.get(dispute.disputerId);
        const target = await ctx.db.get(dispute.targetUserId);
        const proof = await ctx.db.get(dispute.proofId);
        const challenge = await ctx.db.get(dispute.challengeId);
        const organizer = challenge ? await ctx.db.get(challenge.creatorId) : null;

        return {
          ...dispute,
          disputer,
          target,
          proof,
          challenge,
          organizer,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Vérifier si l'utilisateur est admin
 */
export const isUserAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.isAdmin === true;
  },
});

/**
 * Récupérer les contestations créées par un utilisateur
 */
export const getMyDisputes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_disputer", (q) => q.eq("disputerId", args.userId))
      .collect();

    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const target = await ctx.db.get(dispute.targetUserId);
        const challenge = await ctx.db.get(dispute.challengeId);
        const proof = await ctx.db.get(dispute.proofId);

        return {
          ...dispute,
          target,
          challenge,
          proof,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Récupérer les contestations contre un utilisateur
 */
export const getDisputesAgainstMe = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_target", (q) => q.eq("targetUserId", args.userId))
      .collect();

    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const disputer = await ctx.db.get(dispute.disputerId);
        const challenge = await ctx.db.get(dispute.challengeId);
        const proof = await ctx.db.get(dispute.proofId);

        return {
          ...dispute,
          disputer,
          challenge,
          proof,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Vérifier si une preuve a une contestation en cours
 */
export const hasActiveDispute = query({
  args: { proofId: v.id("proofs") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db
      .query("disputes")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "under_review")
        )
      )
      .first();

    return !!dispute;
  },
});

/**
 * Récupérer une contestation par son ID
 */
export const getDisputeById = query({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    const disputer = await ctx.db.get(dispute.disputerId);
    const target = await ctx.db.get(dispute.targetUserId);
    const proof = await ctx.db.get(dispute.proofId);
    const challenge = await ctx.db.get(dispute.challengeId);
    const resolver = dispute.resolvedBy ? await ctx.db.get(dispute.resolvedBy) : null;

    return {
      ...dispute,
      disputer,
      target,
      proof,
      challenge,
      resolver,
    };
  },
});

/**
 * Compter les contestations en attente pour un organisateur
 */
export const countPendingDisputes = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.organizerId))
      .collect();

    const challengeIds = challenges.map((c) => c._id);

    const pendingDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return pendingDisputes.filter((d) => challengeIds.includes(d.challengeId)).length;
  },
});
