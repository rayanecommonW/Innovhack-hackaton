/**
 * Stripe Webhooks Handlers
 * Internal mutations appelées par les webhooks HTTP
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Gérer un paiement échoué
 */
export const handlePaymentFailed = internalMutation({
  args: {
    paymentIntentId: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Trouver la transaction
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .collect();

    const transaction = transactions[0];
    if (!transaction) {
      console.log("Transaction non trouvée pour:", args.paymentIntentId);
      return;
    }

    // Marquer comme échouée
    await ctx.db.patch(transaction._id, {
      status: "failed",
      description: `${transaction.description} - Échec: ${args.errorMessage}`,
    });

    // Notifier l'utilisateur
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      type: "payment_failed",
      title: "Paiement échoué",
      body: `Ton dépôt de ${transaction.amount}€ a échoué: ${args.errorMessage}`,
      data: JSON.stringify({ transactionId: transaction._id }),
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Gérer un transfert (retrait) échoué
 */
export const handleTransferFailed = internalMutation({
  args: {
    transferId: v.string(),
  },
  handler: async (ctx, args) => {
    // Trouver la transaction
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("stripeTransferId"), args.transferId))
      .collect();

    const transaction = transactions[0];
    if (!transaction) {
      console.log("Transaction non trouvée pour transfer:", args.transferId);
      return;
    }

    // Rembourser le solde
    const user = await ctx.db.get(transaction.userId);
    if (user) {
      await ctx.db.patch(transaction.userId, {
        balance: (user.balance || 0) + Math.abs(transaction.amount),
      });
    }

    // Marquer comme échouée
    await ctx.db.patch(transaction._id, {
      status: "failed",
      description: `${transaction.description} - Échec du transfert`,
    });

    // Notifier l'utilisateur
    await ctx.db.insert("notifications", {
      userId: transaction.userId,
      type: "withdrawal_failed",
      title: "Retrait échoué",
      body: `Ton retrait de ${Math.abs(transaction.amount)}€ a échoué. Le montant a été recrédité.`,
      data: JSON.stringify({ transactionId: transaction._id }),
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Gérer la mise à jour d'un compte Stripe Connect
 */
export const handleAccountUpdated = internalMutation({
  args: {
    accountId: v.string(),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
    detailsSubmitted: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Trouver l'utilisateur avec ce compte
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeConnectedAccountId"), args.accountId))
      .collect();

    const user = users[0];
    if (!user) {
      console.log("Utilisateur non trouvé pour compte:", args.accountId);
      return;
    }

    // Déterminer le nouveau statut
    let status = "pending";
    if (args.chargesEnabled && args.payoutsEnabled) {
      status = "verified";
    } else if (args.detailsSubmitted) {
      status = "pending";
    } else {
      status = "incomplete";
    }

    // Mettre à jour si changé
    if (user.stripeAccountStatus !== status) {
      await ctx.db.patch(user._id, {
        stripeAccountStatus: status,
      });

      // Notifier si vérifié
      if (status === "verified" && user.stripeAccountStatus !== "verified") {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "stripe_verified",
          title: "Compte bancaire vérifié",
          body: "Tu peux maintenant recevoir des paiements et effectuer des retraits",
          data: "{}",
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Gérer la vérification d'identité réussie
 */
export const handleIdentityVerified = internalMutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Trouver l'utilisateur avec cette session
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("kycSessionId"), args.sessionId))
      .collect();

    const user = users[0];
    if (!user) {
      console.log("Utilisateur non trouvé pour session KYC:", args.sessionId);
      return;
    }

    // Marquer comme vérifié
    await ctx.db.patch(user._id, {
      kycVerified: true,
      kycStatus: "verified",
      kycVerifiedAt: Date.now(),
    });

    // Notifier
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "kyc_verified",
      title: "Identité vérifiée ✓",
      body: "Ton identité a été vérifiée. Tu peux maintenant effectuer des retraits.",
      data: "{}",
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Gérer une vérification d'identité qui nécessite plus d'infos
 */
export const handleIdentityRequiresInput = internalMutation({
  args: {
    sessionId: v.string(),
    lastError: v.string(),
  },
  handler: async (ctx, args) => {
    // Trouver l'utilisateur
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("kycSessionId"), args.sessionId))
      .collect();

    const user = users[0];
    if (!user) {
      console.log("Utilisateur non trouvé pour session KYC:", args.sessionId);
      return;
    }

    // Mettre à jour le statut
    await ctx.db.patch(user._id, {
      kycStatus: "requires_input",
    });

    // Notifier
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "kyc_requires_input",
      title: "Vérification incomplète",
      body: `Ta vérification d'identité nécessite des informations supplémentaires: ${args.lastError}`,
      data: "{}",
      read: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Gérer un chargeback (contestation de paiement)
 * Se produit quand un utilisateur conteste un paiement auprès de sa banque
 */
export const handleChargeback = internalMutation({
  args: {
    paymentIntentId: v.string(),
    chargeId: v.string(),
    amount: v.number(), // Amount in cents
    reason: v.string(),
    status: v.string(), // "needs_response", "under_review", "won", "lost"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const amountEuros = args.amount / 100;

    // Trouver la transaction d'origine
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .collect();

    const originalTransaction = transactions[0];
    if (!originalTransaction) {
      console.error("CHARGEBACK: Transaction non trouvée pour:", args.paymentIntentId);
      return { success: false, error: "Transaction not found" };
    }

    const user = await ctx.db.get(originalTransaction.userId);
    if (!user) {
      console.error("CHARGEBACK: Utilisateur non trouvé:", originalTransaction.userId);
      return { success: false, error: "User not found" };
    }

    // Log the chargeback
    console.warn("CHARGEBACK RECEIVED:", {
      userId: user._id,
      userEmail: user.email,
      amount: amountEuros,
      reason: args.reason,
      status: args.status,
      chargeId: args.chargeId,
    });

    // Create a chargeback transaction record
    const chargebackTransactionId = await ctx.db.insert("transactions", {
      userId: originalTransaction.userId,
      amount: -amountEuros, // Negative because we're deducting
      type: "chargeback",
      status: args.status === "lost" ? "completed" : "pending",
      stripePaymentIntentId: args.paymentIntentId,
      description: `Chargeback: ${args.reason}`,
      reference: args.chargeId,
      createdAt: now,
      completedAt: args.status === "lost" ? now : undefined,
    });

    // If the chargeback is confirmed (lost), deduct from balance and potentially block user
    if (args.status === "lost") {
      // Deduct the amount from user's balance (can go negative)
      const newBalance = (user.balance || 0) - amountEuros;

      // Count existing chargebacks for this user
      const previousChargebacks = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("type"), "chargeback"))
        .collect();

      const chargebackCount = previousChargebacks.length;

      // Block user if they have 2+ chargebacks (including this one)
      const shouldBlock = chargebackCount >= 1; // This makes it 2+ total

      await ctx.db.patch(user._id, {
        balance: newBalance,
        isBlocked: shouldBlock || user.isBlocked,
        chargebackCount: (user.chargebackCount || 0) + 1,
      });

      // Send serious notification
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "chargeback_confirmed",
        title: "⚠️ Chargeback confirmé",
        body: shouldBlock
          ? `Un chargeback de ${amountEuros}€ a été confirmé. Ton compte a été suspendu suite à plusieurs chargebacks. Contacte le support.`
          : `Un chargeback de ${amountEuros}€ a été confirmé et déduit de ton solde. Attention: un prochain chargeback entraînera la suspension de ton compte.`,
        data: JSON.stringify({ chargebackId: chargebackTransactionId, amount: amountEuros }),
        read: false,
        createdAt: now,
      });

      // Log for admin attention
      console.error("CHARGEBACK CONFIRMED - ACTION REQUIRED:", {
        userId: user._id,
        email: user.email,
        amount: amountEuros,
        newBalance,
        totalChargebacks: chargebackCount + 1,
        accountBlocked: shouldBlock,
      });

    } else if (args.status === "needs_response" || args.status === "under_review") {
      // Chargeback pending - warn user but don't deduct yet
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "chargeback_pending",
        title: "⚠️ Chargeback en cours",
        body: `Une contestation de paiement de ${amountEuros}€ est en cours d'examen. Si elle est confirmée, le montant sera déduit de ton solde.`,
        data: JSON.stringify({ chargebackId: chargebackTransactionId, amount: amountEuros }),
        read: false,
        createdAt: now,
      });

    } else if (args.status === "won") {
      // Chargeback won by merchant - good news
      await ctx.db.patch(chargebackTransactionId, {
        status: "cancelled",
        description: `Chargeback: ${args.reason} (contestation rejetée)`,
      });

      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "chargeback_resolved",
        title: "Contestation résolue",
        body: `La contestation de paiement de ${amountEuros}€ a été rejetée en notre faveur. Aucun montant n'a été déduit.`,
        data: JSON.stringify({ chargebackId: chargebackTransactionId }),
        read: false,
        createdAt: now,
      });
    }

    return { success: true, chargebackTransactionId };
  },
});
