import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// Récupérer l'historique des transactions
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let transactions;
    if (args.type) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("type"), args.type))
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);
    }

    // Enrichir avec les détails du challenge si applicable
    const enriched = await Promise.all(
      transactions.map(async (t) => {
        let challenge = null;
        if (t.relatedChallengeId) {
          challenge = await ctx.db.get(t.relatedChallengeId);
        }
        return { ...t, challenge };
      })
    );

    return enriched;
  },
});

// Récupérer le résumé des transactions
export const getTransactionSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const deposits = transactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const withdrawals = transactions
      .filter((t) => t.type === "withdrawal")
      .reduce((sum, t) => sum + t.amount, 0);

    const bets = transactions
      .filter((t) => t.type === "bet")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const wins = transactions
      .filter((t) => t.type === "win")
      .reduce((sum, t) => sum + t.amount, 0);

    const refunds = transactions
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + t.amount, 0);

    const referralBonuses = transactions
      .filter((t) => t.type === "referral_bonus")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      totalBets: bets,
      totalWins: wins,
      totalRefunds: refunds,
      totalReferralBonuses: referralBonuses,
      netProfit: wins + refunds - bets,
      totalIn: deposits + wins + refunds + referralBonuses,
      totalOut: withdrawals + bets,
    };
  },
});

// Créer un dépôt (simulé pour le moment)
export const createDeposit = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    method: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Montant invalide");
    if (args.amount > 1000) throw new Error("Montant maximum: 1000€");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Créer la transaction en pending
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      method: args.method,
      status: "pending",
      description: `Dépôt par ${args.method}`,
      createdAt: Date.now(),
    });

    // Simuler le paiement réussi immédiatement (en prod, ça viendrait de Stripe)
    await ctx.db.patch(transactionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Créditer le compte
    await ctx.db.patch(args.userId, {
      balance: user.balance + args.amount,
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "deposit_success",
      title: "Dépôt réussi",
      body: `${args.amount}€ ont été ajoutés à ton compte`,
      read: false,
      createdAt: Date.now(),
    });

    return { transactionId, newBalance: user.balance + args.amount };
  },
});

// Créer un retrait
export const createWithdrawal = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    method: v.string(),
    iban: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Montant invalide");
    if (args.amount < 10) throw new Error("Retrait minimum: 10€");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");
    if (user.balance < args.amount) throw new Error("Solde insuffisant");

    // Débiter immédiatement
    await ctx.db.patch(args.userId, {
      balance: user.balance - args.amount,
    });

    // Créer la transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "withdrawal",
      method: args.method,
      status: "pending",
      description: `Retrait vers ${args.method}${args.iban ? ` (${args.iban.slice(-4)})` : ""}`,
      createdAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "withdrawal_pending",
      title: "Retrait en cours",
      body: `Ton retrait de ${args.amount}€ est en cours de traitement (2-3 jours ouvrés)`,
      read: false,
      createdAt: Date.now(),
    });

    return { transactionId, newBalance: user.balance - args.amount };
  },
});

// Confirmer un retrait (admin)
export const confirmWithdrawal = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction non trouvée");
    if (transaction.type !== "withdrawal") throw new Error("Ce n'est pas un retrait");
    if (transaction.status !== "pending") throw new Error("Transaction déjà traitée");

    await ctx.db.patch(args.transactionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      type: "withdrawal_success",
      title: "Retrait effectué",
      body: `Ton retrait de ${Math.abs(transaction.amount)}€ a été envoyé`,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Annuler un retrait (rembourser)
export const cancelWithdrawal = mutation({
  args: {
    transactionId: v.id("transactions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction non trouvée");
    if (transaction.type !== "withdrawal") throw new Error("Ce n'est pas un retrait");
    if (transaction.status !== "pending") throw new Error("Transaction déjà traitée");

    // Rembourser
    const user = await ctx.db.get(transaction.userId);
    if (user) {
      await ctx.db.patch(transaction.userId, {
        balance: user.balance + Math.abs(transaction.amount),
      });
    }

    await ctx.db.patch(args.transactionId, {
      status: "cancelled",
      description: transaction.description + (args.reason ? ` - Annulé: ${args.reason}` : " - Annulé"),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      type: "withdrawal_cancelled",
      title: "Retrait annulé",
      body: `Ton retrait a été annulé. ${Math.abs(transaction.amount)}€ ont été recrédités.`,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Récupérer les retraits en attente (admin)
export const getPendingWithdrawals = query({
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.eq(q.field("type"), "withdrawal"))
      .collect();

    const enriched = await Promise.all(
      transactions.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return { ...t, user };
      })
    );

    return enriched;
  },
});

// Enregistrer une transaction de mise
export const recordBetTransaction = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    challengeId: v.id("challenges"),
    challengeTitle: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "bet",
      status: "completed",
      description: `Mise sur "${args.challengeTitle}"`,
      relatedChallengeId: args.challengeId,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });
  },
});

// Types de transactions pour filtrage
export const getTransactionTypes = query({
  handler: async () => {
    return [
      { value: "deposit", label: "Dépôts" },
      { value: "withdrawal", label: "Retraits" },
      { value: "bet", label: "Mises" },
      { value: "win", label: "Gains" },
      { value: "refund", label: "Remboursements" },
      { value: "referral_bonus", label: "Bonus parrainage" },
    ];
  },
});
