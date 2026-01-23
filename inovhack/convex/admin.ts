/**
 * Admin Panel - Backend
 *
 * Queries et mutations pour la gestion admin de PACT
 * Accessible uniquement aux utilisateurs avec isAdmin=true
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// VÉRIFICATION ADMIN
// ============================================

const verifyAdmin = async (ctx: any, userId: any) => {
  const user = await ctx.db.get(userId);
  if (!user || !user.isAdmin) {
    throw new Error("Accès non autorisé. Droits admin requis.");
  }
  return user;
};

// ============================================
// AUDIT LOGGING
// ============================================

interface AuditLogParams {
  adminId: any;
  action: string;
  targetType: string;
  targetId?: string;
  details: Record<string, any>;
  result: "success" | "failure";
  errorMessage?: string;
}

const logAdminAction = async (ctx: any, params: AuditLogParams) => {
  try {
    await ctx.db.insert("auditLogs", {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: JSON.stringify(params.details),
      result: params.result,
      errorMessage: params.errorMessage,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - audit logging should not break the main action
  }
};

// ============================================
// DISPUTES
// ============================================

// Liste des disputes en attente
export const getPendingDisputes = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrichir avec les infos
    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const proof = await ctx.db.get(dispute.proofId);
        const challenge = await ctx.db.get(dispute.challengeId);
        const disputer = await ctx.db.get(dispute.disputerId);
        const target = await ctx.db.get(dispute.targetUserId);

        return {
          ...dispute,
          proof,
          challenge,
          disputer: disputer ? { name: disputer.name, username: disputer.username } : null,
          target: target ? { name: target.name, username: target.username } : null,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Liste de toutes les disputes
export const getAllDisputes = query({
  args: {
    adminId: v.id("users"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    let disputes;
    if (args.status) {
      disputes = await ctx.db
        .query("disputes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      disputes = await ctx.db.query("disputes").collect();
    }

    const enriched = await Promise.all(
      disputes.map(async (dispute) => {
        const challenge = await ctx.db.get(dispute.challengeId);
        const disputer = await ctx.db.get(dispute.disputerId);
        const target = await ctx.db.get(dispute.targetUserId);

        return {
          ...dispute,
          challenge: challenge ? { title: challenge.title } : null,
          disputer: disputer ? { name: disputer.name, username: disputer.username } : null,
          target: target ? { name: target.name, username: target.username } : null,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Détails d'une dispute
export const getDisputeDetails = query({
  args: {
    adminId: v.id("users"),
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute non trouvée");

    const proof = await ctx.db.get(dispute.proofId);
    const challenge = await ctx.db.get(dispute.challengeId);
    const disputer = await ctx.db.get(dispute.disputerId);
    const target = await ctx.db.get(dispute.targetUserId);

    // Récupérer la participation
    let participation = null;
    if (proof) {
      participation = await ctx.db.get(proof.participationId);
    }

    return {
      ...dispute,
      proof,
      challenge,
      participation,
      disputer: disputer ? {
        id: disputer._id,
        name: disputer.name,
        username: disputer.username,
        email: disputer.email,
      } : null,
      target: target ? {
        id: target._id,
        name: target.name,
        username: target.username,
        email: target.email,
      } : null,
    };
  },
});

// Résoudre une dispute
export const resolveDispute = mutation({
  args: {
    adminId: v.id("users"),
    disputeId: v.id("disputes"),
    resolution: v.string(), // "favor_disputer" ou "favor_target" ou "dismissed"
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute non trouvée");
    if (dispute.status !== "pending" && dispute.status !== "under_review") {
      throw new Error("Cette dispute a déjà été résolue");
    }

    const now = Date.now();
    let status = "";

    // Mettre à jour la dispute
    if (args.resolution === "favor_disputer") {
      status = "resolved_favor_disputer";

      // Rembourser le contestataire et invalider la preuve
      const proof = await ctx.db.get(dispute.proofId);
      if (proof) {
        await ctx.db.patch(proof._id, {
          organizerValidation: "rejected",
          organizerComment: `Rejeté suite à dispute: ${args.comment}`,
        });

        // Mettre à jour la participation
        const participation = await ctx.db.get(proof.participationId);
        if (participation && participation.status === "won") {
          await ctx.db.patch(participation._id, { status: "lost" });

          // Retirer les gains si déjà distribués
          const target = await ctx.db.get(dispute.targetUserId);
          if (target && participation.earnings) {
            await ctx.db.patch(dispute.targetUserId, {
              balance: Math.max(0, (target.balance || 0) - participation.earnings),
            });
          }
        }
      }

      // Notifier le contestataire
      await ctx.db.insert("notifications", {
        userId: dispute.disputerId,
        type: "dispute_resolved",
        title: "Dispute résolue en ta faveur",
        body: args.comment,
        data: JSON.stringify({ disputeId: dispute._id }),
        read: false,
        createdAt: now,
      });

      // Notifier la cible
      await ctx.db.insert("notifications", {
        userId: dispute.targetUserId,
        type: "dispute_resolved",
        title: "Dispute résolue contre toi",
        body: args.comment,
        data: JSON.stringify({ disputeId: dispute._id }),
        read: false,
        createdAt: now,
      });

    } else if (args.resolution === "favor_target") {
      status = "resolved_favor_target";

      // Notifier les deux parties
      await ctx.db.insert("notifications", {
        userId: dispute.disputerId,
        type: "dispute_resolved",
        title: "Dispute rejetée",
        body: args.comment,
        data: JSON.stringify({ disputeId: dispute._id }),
        read: false,
        createdAt: now,
      });

      await ctx.db.insert("notifications", {
        userId: dispute.targetUserId,
        type: "dispute_resolved",
        title: "Dispute résolue en ta faveur",
        body: args.comment,
        data: JSON.stringify({ disputeId: dispute._id }),
        read: false,
        createdAt: now,
      });

    } else {
      status = "dismissed";

      await ctx.db.insert("notifications", {
        userId: dispute.disputerId,
        type: "dispute_dismissed",
        title: "Dispute classée sans suite",
        body: args.comment,
        data: JSON.stringify({ disputeId: dispute._id }),
        read: false,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.disputeId, {
      status,
      resolution: args.comment,
      resolvedBy: args.adminId,
      resolvedAt: now,
    });

    // Audit log
    await logAdminAction(ctx, {
      adminId: args.adminId,
      action: "resolve_dispute",
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        resolution: args.resolution,
        comment: args.comment,
        status,
        disputerId: dispute.disputerId,
        targetUserId: dispute.targetUserId,
      },
      result: "success",
    });

    return { success: true, status };
  },
});

// ============================================
// UTILISATEURS
// ============================================

// Liste des utilisateurs
export const getAllUsers = query({
  args: {
    adminId: v.id("users"),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    let users = await ctx.db.query("users").collect();

    // Recherche
    if (args.search) {
      const search = args.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.username?.toLowerCase().includes(search)
      );
    }

    // Limiter
    const limit = args.limit || 50;
    users = users.slice(0, limit);

    return users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      username: u.username,
      balance: u.balance,
      isAdmin: u.isAdmin,
      isBlocked: u.isBlocked,
      kycVerified: u.kycVerified,
      totalWins: u.totalWins || 0,
      totalLosses: u.totalLosses || 0,
      createdAt: u.createdAt || u._creationTime,
    }));
  },
});

// Détails utilisateur
export const getUserDetails = query({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Récupérer les participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .collect();

    // Récupérer les transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      ...user,
      participationsCount: participations.length,
      transactionsCount: transactions.length,
      recentTransactions: transactions.slice(-10).reverse(),
    };
  },
});

// Bloquer/débloquer un utilisateur
export const toggleUserBlock = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    blocked: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    await ctx.db.patch(args.userId, { isBlocked: args.blocked });

    // Notifier l'utilisateur
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.blocked ? "account_blocked" : "account_unblocked",
      title: args.blocked ? "Compte suspendu" : "Compte réactivé",
      body: args.blocked
        ? `Ton compte a été suspendu. Raison: ${args.reason || "Non spécifiée"}`
        : "Ton compte a été réactivé.",
      data: "{}",
      read: false,
      createdAt: Date.now(),
    });

    // Audit log
    await logAdminAction(ctx, {
      adminId: args.adminId,
      action: args.blocked ? "block_user" : "unblock_user",
      targetType: "user",
      targetId: args.userId,
      details: {
        blocked: args.blocked,
        reason: args.reason,
        userName: user.name,
        userEmail: user.email,
      },
      result: "success",
    });

    return { success: true };
  },
});

// Promouvoir/rétrograder un admin
export const toggleAdmin = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    if (args.adminId === args.userId) {
      throw new Error("Tu ne peux pas modifier tes propres droits admin");
    }

    const targetUser = await ctx.db.get(args.userId);
    await ctx.db.patch(args.userId, { isAdmin: args.isAdmin });

    // Audit log
    await logAdminAction(ctx, {
      adminId: args.adminId,
      action: args.isAdmin ? "promote_admin" : "demote_admin",
      targetType: "user",
      targetId: args.userId,
      details: {
        isAdmin: args.isAdmin,
        targetUserName: targetUser?.name,
        targetUserEmail: targetUser?.email,
      },
      result: "success",
    });

    return { success: true };
  },
});

// ============================================
// STATISTIQUES
// ============================================

// Stats globales admin
export const getAdminStats = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const users = await ctx.db.query("users").collect();
    const challenges = await ctx.db.query("challenges").collect();
    const disputes = await ctx.db.query("disputes").collect();
    const transactions = await ctx.db.query("transactions").collect();

    const pendingDisputes = disputes.filter((d) => d.status === "pending").length;
    const activeChallenges = challenges.filter((c) => c.status === "active").length;
    const validatingChallenges = challenges.filter((c) => c.status === "validating").length;

    const totalDeposits = transactions
      .filter((t) => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    return {
      totalUsers: users.length,
      verifiedUsers: users.filter((u) => u.kycVerified).length,
      blockedUsers: users.filter((u) => u.isBlocked).length,
      totalChallenges: challenges.length,
      activeChallenges,
      validatingChallenges,
      completedChallenges: challenges.filter((c) => c.status === "completed").length,
      pendingDisputes,
      totalDisputes: disputes.length,
      totalDeposits,
      totalWithdrawals,
      totalBalance,
      platformProfit: totalDeposits - totalWithdrawals - totalBalance, // Approximation
    };
  },
});

// ============================================
// CHALLENGES
// ============================================

// Liste des challenges (admin view)
export const getAllChallenges = query({
  args: {
    adminId: v.id("users"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    let challenges;
    if (args.status) {
      challenges = await ctx.db
        .query("challenges")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      challenges = await ctx.db.query("challenges").collect();
    }

    const limit = args.limit || 50;

    const enriched = await Promise.all(
      challenges.slice(0, limit).map(async (c) => {
        const creator = await ctx.db.get(c.creatorId);
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", c._id))
          .collect();

        return {
          ...c,
          creator: creator ? { name: creator.name, username: creator.username } : null,
          participantCount: participations.length,
          totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
        };
      })
    );

    return enriched.sort((a, b) => (b.endDate || 0) - (a.endDate || 0));
  },
});

// Annuler un challenge (et rembourser)
export const cancelChallenge = mutation({
  args: {
    adminId: v.id("users"),
    challengeId: v.id("challenges"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge non trouvé");

    if (challenge.status === "completed" || challenge.status === "cancelled") {
      throw new Error("Ce challenge ne peut pas être annulé");
    }

    // Rembourser tous les participants
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    for (const p of participations) {
      const user = await ctx.db.get(p.usertId);
      if (user) {
        await ctx.db.patch(p.usertId, {
          balance: (user.balance || 0) + p.betAmount,
        });

        await ctx.db.insert("transactions", {
          userId: p.usertId,
          amount: p.betAmount,
          type: "refund",
          status: "completed",
          description: `Remboursement (annulation admin) - ${challenge.title}`,
          relatedChallengeId: args.challengeId,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });

        await ctx.db.insert("notifications", {
          userId: p.usertId,
          type: "challenge_cancelled",
          title: "Pact annulé",
          body: `Le pact "${challenge.title}" a été annulé. Tu as été remboursé de ${p.betAmount}€. Raison: ${args.reason}`,
          data: JSON.stringify({ challengeId: args.challengeId }),
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.challengeId, { status: "cancelled" });

    // Audit log
    await logAdminAction(ctx, {
      adminId: args.adminId,
      action: "cancel_challenge",
      targetType: "challenge",
      targetId: args.challengeId,
      details: {
        reason: args.reason,
        challengeTitle: challenge.title,
        refundedCount: participations.length,
        totalRefunded: participations.reduce((sum, p) => sum + p.betAmount, 0),
      },
      result: "success",
    });

    return { success: true, refundedCount: participations.length };
  },
});

// ============================================
// AUDIT LOGS
// ============================================

// Get audit logs for admin review
export const getAuditLogs = query({
  args: {
    adminId: v.id("users"),
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
    targetType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.adminId);

    let logs;
    if (args.action) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .collect();
    } else {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_timestamp")
        .order("desc")
        .collect();
    }

    // Filter by target type if specified
    if (args.targetType) {
      logs = logs.filter((l) => l.targetType === args.targetType);
    }

    // Limit results
    const limit = args.limit || 100;
    logs = logs.slice(0, limit);

    // Enrich with admin info
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db.get(log.adminId);
        return {
          ...log,
          adminName: admin?.name || "Unknown",
          adminEmail: admin?.email,
          parsedDetails: JSON.parse(log.details || "{}"),
        };
      })
    );

    return enriched;
  },
});
