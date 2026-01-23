/**
 * Stripe Actions - Appels réels à l'API Stripe
 *
 * Architecture:
 * - Actions pour les appels HTTP vers Stripe
 * - Internal mutations pour les updates DB
 * - Webhooks pour les événements asynchrones
 */

import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Configuration Stripe
const STRIPE_API_BASE = "https://api.stripe.com/v1";

// Helper pour les appels Stripe API
async function stripeRequest(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "POST",
  body?: Record<string, any>
): Promise<any> {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.includes("XXXX")) {
    throw new Error("Stripe n'est pas configuré. Ajoute STRIPE_SECRET_KEY dans les variables d'environnement Convex.");
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method === "POST") {
    // Stripe utilise form-urlencoded, pas JSON
    const formBody = new URLSearchParams();

    const flatten = (obj: any, prefix = ""): void => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          flatten(value, fullKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object") {
              flatten(item, `${fullKey}[${index}]`);
            } else {
              formBody.append(`${fullKey}[${index}]`, String(item));
            }
          });
        } else if (value !== undefined && value !== null) {
          formBody.append(fullKey, String(value));
        }
      }
    };

    flatten(body);
    options.body = formBody.toString();
  }

  const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    console.error("Stripe API Error:", data);
    throw new Error(data.error?.message || "Erreur Stripe API");
  }

  return data;
}

// ============================================
// CONNECTED ACCOUNTS (Stripe Connect)
// ============================================

/**
 * Créer un compte Stripe Connect Express pour un utilisateur
 */
export const createConnectedAccount = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; accountId: string; onboardingUrl?: string }> => {
    // Vérifier si l'utilisateur a déjà un compte
    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (user?.stripeConnectedAccountId) {
      return {
        success: true,
        accountId: user.stripeConnectedAccountId,
      };
    }

    // Créer le compte Stripe Connect Express
    const account = await stripeRequest("/accounts", "POST", {
      type: "express",
      country: args.country || "FR",
      email: args.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      settings: {
        payouts: {
          schedule: {
            interval: "manual", // On contrôle les payouts
          },
        },
      },
    });

    // Sauvegarder l'ID du compte
    await ctx.runMutation(internal.stripeActions.updateUserStripeAccount, {
      userId: args.userId,
      stripeConnectedAccountId: account.id,
      stripeAccountStatus: "pending",
    });

    // Créer le lien d'onboarding
    const accountLink = await stripeRequest("/account_links", "POST", {
      account: account.id,
      refresh_url: "pact://stripe-refresh",
      return_url: "pact://stripe-return",
      type: "account_onboarding",
    });

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  },
});

/**
 * Obtenir le lien d'onboarding Stripe (pour continuer l'onboarding)
 */
export const getOnboardingLink = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; url: string }> => {
    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (!user?.stripeConnectedAccountId) {
      throw new Error("Pas de compte Stripe Connect. Crée d'abord un compte.");
    }

    const accountLink = await stripeRequest("/account_links", "POST", {
      account: user.stripeConnectedAccountId,
      refresh_url: "pact://stripe-refresh",
      return_url: "pact://stripe-return",
      type: "account_onboarding",
    });

    return {
      success: true,
      url: accountLink.url,
    };
  },
});

/**
 * Vérifier le statut du compte Stripe Connect
 */
export const checkAccountStatus = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    hasAccount: boolean;
    status: string;
    canAcceptPayments: boolean;
    canReceivePayouts: boolean;
    requiresVerification: boolean;
  }> => {
    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (!user?.stripeConnectedAccountId) {
      return {
        hasAccount: false,
        status: "none",
        canAcceptPayments: false,
        canReceivePayouts: false,
        requiresVerification: true,
      };
    }

    // Récupérer les infos du compte depuis Stripe
    const account = await stripeRequest(`/accounts/${user.stripeConnectedAccountId}`, "GET");

    const status = account.charges_enabled && account.payouts_enabled
      ? "verified"
      : account.details_submitted
        ? "pending"
        : "incomplete";

    // Mettre à jour le statut en DB
    if (user.stripeAccountStatus !== status) {
      await ctx.runMutation(internal.stripeActions.updateUserStripeAccount, {
        userId: args.userId,
        stripeAccountStatus: status,
      });
    }

    return {
      hasAccount: true,
      status,
      canAcceptPayments: account.charges_enabled,
      canReceivePayouts: account.payouts_enabled,
      requiresVerification: !account.details_submitted,
    };
  },
});

// ============================================
// PAIEMENTS (Dépôts)
// ============================================

/**
 * Créer un PaymentIntent pour un dépôt
 */
export const createDepositPaymentIntent = action({
  args: {
    userId: v.id("users"),
    amount: v.number(), // En euros
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    clientSecret: string;
    paymentIntentId: string;
    transactionId: string;
  }> => {
    // Rate limiting: 3 dépôts par minute
    const rateLimitResult = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      identifier: args.userId,
      action: "payment.deposit",
    });
    if (!rateLimitResult.allowed) {
      throw new Error(`Trop de tentatives de dépôt. Réessaie dans ${rateLimitResult.retryAfter} secondes.`);
    }

    if (args.amount < 5) {
      throw new Error("Montant minimum: 5€");
    }
    if (args.amount > 1000) {
      throw new Error("Montant maximum: 1000€");
    }

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripeRequest("/payment_intents", "POST", {
      amount: Math.round(args.amount * 100), // Centimes
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: args.userId,
        type: "deposit",
      },
    });

    // Créer la transaction en attente
    const transactionId = await ctx.runMutation(internal.stripeActions.createPendingTransaction, {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      stripePaymentIntentId: paymentIntent.id,
      description: `Dépôt de ${args.amount}€`,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transactionId,
    };
  },
});

// ============================================
// RETRAITS (Payouts)
// ============================================

/**
 * Créer un retrait vers le compte bancaire de l'utilisateur
 * Avec mécanisme de rollback si la mise à jour DB échoue
 */
export const createWithdrawal = action({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    idempotencyKey: v.optional(v.string()), // Clé d'idempotence pour éviter les doublons
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    transferId: string;
    transactionId: string;
    newBalance: number;
  }> => {
    // Rate limiting: 2 retraits par minute
    const rateLimitResult = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      identifier: args.userId,
      action: "payment.withdraw",
    });
    if (!rateLimitResult.allowed) {
      throw new Error(`Trop de tentatives de retrait. Réessaie dans ${rateLimitResult.retryAfter} secondes.`);
    }

    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    if (!user.stripeConnectedAccountId) {
      throw new Error("Configure ton compte bancaire d'abord");
    }

    if (!user.kycVerified) {
      throw new Error("Vérification d'identité requise pour les retraits");
    }

    if (args.amount < 10) {
      throw new Error("Montant minimum de retrait: 10€");
    }

    if (args.amount > (user.balance || 0)) {
      throw new Error("Solde insuffisant");
    }

    // Générer une clé d'idempotence si non fournie
    const idempotencyKey = args.idempotencyKey || `withdrawal_${args.userId}_${Date.now()}`;

    // Vérifier si cette transaction existe déjà (idempotence)
    const existingTransaction = await ctx.runQuery(internal.stripeActions.findTransactionByIdempotencyKey, {
      idempotencyKey,
    });

    if (existingTransaction) {
      return {
        success: true,
        transferId: existingTransaction.stripeTransferId || "",
        transactionId: existingTransaction._id,
        newBalance: user.balance - args.amount,
      };
    }

    // Créer d'abord la transaction en attente (avant le transfert Stripe)
    const pendingTransactionId = await ctx.runMutation(internal.stripeActions.createPendingWithdrawal, {
      userId: args.userId,
      amount: args.amount,
      idempotencyKey,
    });

    let transfer;
    try {
      // Créer le transfert vers le compte Connect
      transfer = await stripeRequest("/transfers", "POST", {
        amount: Math.round(args.amount * 100),
        currency: "eur",
        destination: user.stripeConnectedAccountId,
        metadata: {
          userId: args.userId,
          type: "withdrawal",
          transactionId: pendingTransactionId,
          idempotencyKey,
        },
      });
    } catch (stripeError: any) {
      // Si le transfert Stripe échoue, annuler la transaction en attente
      await ctx.runMutation(internal.stripeActions.cancelPendingWithdrawal, {
        transactionId: pendingTransactionId,
        reason: stripeError.message || "Erreur Stripe",
      });
      throw new Error(`Échec du retrait: ${stripeError.message || "Erreur Stripe"}`);
    }

    try {
      // Mettre à jour le solde et confirmer la transaction
      const result = await ctx.runMutation(internal.stripeActions.confirmWithdrawal, {
        transactionId: pendingTransactionId,
        userId: args.userId,
        amount: args.amount,
        stripeTransferId: transfer.id,
      });

      return {
        success: true,
        transferId: transfer.id,
        transactionId: pendingTransactionId,
        newBalance: result.newBalance,
      };
    } catch (dbError: any) {
      // CRITIQUE: Le transfert Stripe a réussi mais la DB a échoué
      // On tente un rollback du transfert
      console.error("CRITICAL: DB update failed after Stripe transfer. Attempting rollback...", {
        transferId: transfer.id,
        userId: args.userId,
        amount: args.amount,
        error: dbError.message,
      });

      try {
        // Créer un transfert inversé (reversal)
        await stripeRequest(`/transfers/${transfer.id}/reversals`, "POST", {
          amount: Math.round(args.amount * 100),
          metadata: {
            reason: "db_failure_rollback",
            originalTransactionId: pendingTransactionId,
          },
        });
        console.log("Rollback successful for transfer:", transfer.id);
      } catch (rollbackError: any) {
        // Le rollback a également échoué - situation critique
        console.error("CRITICAL: Rollback failed! Manual intervention required.", {
          transferId: transfer.id,
          rollbackError: rollbackError.message,
        });
        // Marquer la transaction pour investigation manuelle
        await ctx.runMutation(internal.stripeActions.markTransactionForReview, {
          transactionId: pendingTransactionId,
          stripeTransferId: transfer.id,
          error: "DB update and rollback both failed",
        });
      }

      throw new Error("Erreur lors du traitement du retrait. Aucun montant n'a été débité. Réessaie plus tard.");
    }
  },
});

/**
 * Inverser un transfert Stripe (action admin)
 */
export const reverseTransfer = action({
  args: {
    transferId: v.string(),
    reason: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; reversalId: string }> => {
    // Vérifier que l'utilisateur est admin
    const admin = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.adminId
    });

    // TODO: Add proper admin check
    // For now, just attempt the reversal

    const reversal = await stripeRequest(`/transfers/${args.transferId}/reversals`, "POST", {
      metadata: {
        reason: args.reason,
        adminId: args.adminId,
      },
    });

    return {
      success: true,
      reversalId: reversal.id,
    };
  },
});

// ============================================
// KYC (Stripe Identity)
// ============================================

/**
 * Créer une session de vérification d'identité
 */
export const createIdentityVerification = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    verificationSessionId: string;
    url: string;
  }> => {
    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    if (user.kycVerified) {
      throw new Error("Déjà vérifié");
    }

    // Créer la session de vérification
    const session = await stripeRequest("/identity/verification_sessions", "POST", {
      type: "document",
      metadata: {
        userId: args.userId,
      },
      options: {
        document: {
          allowed_types: ["passport", "id_card", "driving_license"],
          require_matching_selfie: true,
        },
      },
      return_url: "pact://kyc-complete",
    });

    // Sauvegarder l'ID de session
    await ctx.runMutation(internal.stripeActions.updateUserKycSession, {
      userId: args.userId,
      kycSessionId: session.id,
      kycStatus: "pending",
    });

    return {
      success: true,
      verificationSessionId: session.id,
      url: session.url,
    };
  },
});

/**
 * Vérifier le statut KYC
 */
export const checkKycStatus = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{
    status: string;
    verified: boolean;
  }> => {
    const user = await ctx.runQuery(internal.stripeActions.getUserStripeInfo, {
      userId: args.userId
    });

    if (!user?.kycSessionId) {
      return { status: "not_started", verified: false };
    }

    if (user.kycVerified) {
      return { status: "verified", verified: true };
    }

    // Vérifier le statut auprès de Stripe
    const session = await stripeRequest(`/identity/verification_sessions/${user.kycSessionId}`, "GET");

    const verified = session.status === "verified";

    if (verified && !user.kycVerified) {
      await ctx.runMutation(internal.stripeActions.updateUserKycVerified, {
        userId: args.userId,
        verified: true,
      });
    }

    return {
      status: session.status,
      verified,
    };
  },
});

// ============================================
// INTERNAL MUTATIONS (pour les actions)
// ============================================

export const getUserStripeInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      stripeConnectedAccountId: user.stripeConnectedAccountId,
      stripeAccountStatus: user.stripeAccountStatus,
      kycVerified: user.kycVerified,
      kycSessionId: user.kycSessionId,
      balance: user.balance,
    };
  },
});

export const updateUserStripeAccount = internalMutation({
  args: {
    userId: v.id("users"),
    stripeConnectedAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.stripeConnectedAccountId !== undefined) {
      updates.stripeConnectedAccountId = args.stripeConnectedAccountId;
    }
    if (args.stripeAccountStatus !== undefined) {
      updates.stripeAccountStatus = args.stripeAccountStatus;
    }
    await ctx.db.patch(args.userId, updates);
  },
});

export const createPendingTransaction = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    stripePaymentIntentId: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: args.type as any,
      status: "pending",
      stripePaymentIntentId: args.stripePaymentIntentId,
      description: args.description,
      createdAt: Date.now(),
    });
    return transactionId;
  },
});

export const confirmDepositInternal = internalMutation({
  args: {
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Trouver la transaction
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId))
      .collect();

    const transaction = transactions[0];
    if (!transaction) {
      console.error("Transaction non trouvée pour PaymentIntent:", args.paymentIntentId);
      return { success: false };
    }

    if (transaction.status === "completed") {
      return { success: true, alreadyProcessed: true };
    }

    // Mettre à jour la transaction
    await ctx.db.patch(transaction._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Créditer le solde
    const user = await ctx.db.get(transaction.userId);
    if (user) {
      await ctx.db.patch(transaction.userId, {
        balance: (user.balance || 0) + transaction.amount,
      });

      // Notification
      await ctx.db.insert("notifications", {
        userId: transaction.userId,
        type: "deposit_confirmed",
        title: "Dépôt confirmé",
        body: `${transaction.amount}€ ont été ajoutés à ton solde`,
        data: JSON.stringify({ transactionId: transaction._id }),
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true, amount: transaction.amount };
  },
});

export const processWithdrawal = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    stripeTransferId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const newBalance = (user.balance || 0) - args.amount;

    // Déduire du solde
    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    // Créer la transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "withdrawal",
      status: "completed",
      stripeTransferId: args.stripeTransferId,
      description: `Retrait de ${args.amount}€`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "withdrawal_completed",
      title: "Retrait effectué",
      body: `${args.amount}€ ont été envoyés sur ton compte bancaire`,
      data: JSON.stringify({ transactionId }),
      read: false,
      createdAt: Date.now(),
    });

    return { transactionId, newBalance };
  },
});

export const updateUserKycSession = internalMutation({
  args: {
    userId: v.id("users"),
    kycSessionId: v.string(),
    kycStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      kycSessionId: args.kycSessionId,
      kycStatus: args.kycStatus,
    });
  },
});

export const updateUserKycVerified = internalMutation({
  args: {
    userId: v.id("users"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      kycVerified: args.verified,
      kycStatus: args.verified ? "verified" : "rejected",
      kycVerifiedAt: args.verified ? Date.now() : undefined,
    });

    if (args.verified) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "kyc_verified",
        title: "Identité vérifiée",
        body: "Tu peux maintenant effectuer des retraits",
        data: "{}",
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

// ============================================
// WITHDRAWAL ROLLBACK MECHANISM
// ============================================

/**
 * Find transaction by idempotency key (prevent duplicates)
 */
export const findTransactionByIdempotencyKey = internalQuery({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("reference"), args.idempotencyKey))
      .collect();
    return transactions[0] || null;
  },
});

/**
 * Create a pending withdrawal transaction (before Stripe transfer)
 */
export const createPendingWithdrawal = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "withdrawal",
      status: "pending",
      reference: args.idempotencyKey, // Use reference for idempotency key
      description: `Retrait de ${args.amount}€`,
      createdAt: Date.now(),
    });
    return transactionId;
  },
});

/**
 * Cancel a pending withdrawal (if Stripe transfer fails)
 */
export const cancelPendingWithdrawal = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      status: "failed",
      description: `Retrait annulé: ${args.reason}`,
    });
  },
});

/**
 * Confirm a withdrawal after successful Stripe transfer
 */
export const confirmWithdrawal = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    userId: v.id("users"),
    amount: v.number(),
    stripeTransferId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Verify balance is still sufficient (race condition protection)
    if ((user.balance || 0) < args.amount) {
      throw new Error("Solde insuffisant - balance changed during transaction");
    }

    const newBalance = (user.balance || 0) - args.amount;

    // Update balance
    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    // Update transaction
    await ctx.db.patch(args.transactionId, {
      status: "completed",
      stripeTransferId: args.stripeTransferId,
      completedAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "withdrawal_completed",
      title: "Retrait effectué",
      body: `${args.amount}€ ont été envoyés sur ton compte bancaire`,
      data: JSON.stringify({ transactionId: args.transactionId }),
      read: false,
      createdAt: Date.now(),
    });

    return { newBalance };
  },
});

/**
 * Mark a transaction for manual review (critical error scenario)
 */
export const markTransactionForReview = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    stripeTransferId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      status: "pending", // Keep as pending for manual review
      stripeTransferId: args.stripeTransferId,
      description: `NEEDS REVIEW: ${args.error}. Transfer ID: ${args.stripeTransferId}`,
    });

    // Log critical error for admin notification
    console.error("CRITICAL TRANSACTION NEEDS REVIEW:", {
      transactionId: args.transactionId,
      stripeTransferId: args.stripeTransferId,
      error: args.error,
      timestamp: new Date().toISOString(),
    });
  },
});

// ============================================
// IDEMPOTENCY FOR DEPOSITS
// ============================================

/**
 * Create deposit with idempotency key
 */
export const createPendingDeposit = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    stripePaymentIntentId: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if transaction already exists
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_stripe_payment", (q) => q.eq("stripePaymentIntentId", args.stripePaymentIntentId))
      .first();

    if (existing) {
      return existing._id;
    }

    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      status: "pending",
      stripePaymentIntentId: args.stripePaymentIntentId,
      reference: args.idempotencyKey,
      description: `Dépôt de ${args.amount}€`,
      createdAt: Date.now(),
    });
    return transactionId;
  },
});
