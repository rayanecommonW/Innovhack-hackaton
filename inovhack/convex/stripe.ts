/**
 * Stripe Connect Integration
 * Gère les comptes connectés, les paiements et les transferts
 *
 * Architecture:
 * - PACT utilise Stripe Connect Custom pour les comptes connectés
 * - Les utilisateurs ont un compte Stripe Connect lié
 * - Les fonds transitent directement via Stripe (jamais conservés par PACT)
 * - Les transferts sont effectués au moment de la distribution
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// Note: En production, utiliser les vraies API Stripe
// Pour le hackathon, nous simulons les appels Stripe

/**
 * Créer un compte Stripe Connect pour un utilisateur
 * En production: utilise Stripe.accounts.create()
 */
export const createConnectedAccount = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Vérifier si l'utilisateur a déjà un compte connecté
    if (user.stripeConnectedAccountId) {
      return {
        success: true,
        accountId: user.stripeConnectedAccountId,
        message: "Compte Stripe existant"
      };
    }

    // En production: appeler Stripe API
    // const account = await stripe.accounts.create({
    //   type: 'custom',
    //   country: args.country || 'FR',
    //   email: args.email,
    //   capabilities: {
    //     card_payments: { requested: true },
    //     transfers: { requested: true },
    //   },
    //   business_type: 'individual',
    //   tos_acceptance: {
    //     service_agreement: 'full',
    //   },
    // });

    // Simuler la création d'un compte Stripe
    const simulatedAccountId = `acct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mettre à jour l'utilisateur avec l'ID du compte Stripe
    await ctx.db.patch(args.userId, {
      stripeConnectedAccountId: simulatedAccountId,
      stripeAccountStatus: "pending", // pending, verified, restricted
    });

    return {
      success: true,
      accountId: simulatedAccountId,
      onboardingRequired: true,
      message: "Compte Stripe Connect créé - vérification requise",
    };
  },
});

/**
 * Obtenir le lien d'onboarding Stripe
 * En production: utilise Stripe.accountLinks.create()
 */
export const getOnboardingLink = mutation({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
    refreshUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (!user.stripeConnectedAccountId) {
      throw new Error("Pas de compte Stripe Connect. Créez d'abord un compte.");
    }

    // En production: appeler Stripe API
    // const accountLink = await stripe.accountLinks.create({
    //   account: user.stripeConnectedAccountId,
    //   refresh_url: args.refreshUrl,
    //   return_url: args.returnUrl,
    //   type: 'account_onboarding',
    // });

    // Simuler le lien d'onboarding
    const simulatedLink = `https://connect.stripe.com/setup/s/${user.stripeConnectedAccountId}?return=${encodeURIComponent(args.returnUrl)}`;

    return {
      success: true,
      url: simulatedLink,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 heures
    };
  },
});

/**
 * Vérifier le statut du compte Stripe Connect
 * En production: utilise Stripe.accounts.retrieve()
 */
export const checkAccountStatus = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (!user.stripeConnectedAccountId) {
      return {
        hasAccount: false,
        status: "none",
        canAcceptPayments: false,
        canReceivePayouts: false,
      };
    }

    // En production: appeler Stripe API
    // const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);
    // const status = account.charges_enabled && account.payouts_enabled ? 'verified' : 'pending';

    // Simuler le statut (pour le hackathon, on considère tous les comptes comme vérifiés)
    const status = user.stripeAccountStatus || "verified";

    // Mettre à jour le statut si nécessaire
    if (user.stripeAccountStatus !== status) {
      await ctx.db.patch(args.userId, {
        stripeAccountStatus: status,
      });
    }

    return {
      hasAccount: true,
      accountId: user.stripeConnectedAccountId,
      status,
      canAcceptPayments: status === "verified",
      canReceivePayouts: status === "verified",
      requiresVerification: status === "pending",
    };
  },
});

/**
 * Créer un PaymentIntent pour un dépôt
 * En production: utilise Stripe.paymentIntents.create()
 */
export const createDepositIntent = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(), // En euros
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (args.amount < 5) {
      throw new Error("Montant minimum: 5€");
    }

    if (args.amount > 1000) {
      throw new Error("Montant maximum: 1000€");
    }

    // En production: appeler Stripe API
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(args.amount * 100), // Stripe utilise les centimes
    //   currency: 'eur',
    //   automatic_payment_methods: { enabled: true },
    //   metadata: {
    //     userId: args.userId,
    //     type: 'deposit',
    //   },
    // });

    // Simuler le PaymentIntent
    const simulatedIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const simulatedClientSecret = `${simulatedIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

    // Créer une transaction en attente
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      status: "pending",
      description: `Dépôt de ${args.amount}€`,
      stripePaymentIntentId: simulatedIntentId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      paymentIntentId: simulatedIntentId,
      clientSecret: simulatedClientSecret,
      transactionId,
      amount: args.amount,
    };
  },
});

/**
 * Confirmer un dépôt après paiement réussi
 * Appelé via webhook Stripe en production
 */
export const confirmDeposit = mutation({
  args: {
    paymentIntentId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Trouver la transaction correspondante
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.eq(q.field("stripePaymentIntentId"), args.paymentIntentId),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .collect();

    const transaction = transactions[0];
    if (!transaction) {
      throw new Error("Transaction non trouvée");
    }

    if (transaction.status === "completed") {
      return { success: true, message: "Dépôt déjà confirmé" };
    }

    // Mettre à jour la transaction
    await ctx.db.patch(transaction._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Mettre à jour le solde de l'utilisateur
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        balance: (user.balance || 0) + transaction.amount,
      });
    }

    return {
      success: true,
      amount: transaction.amount,
      newBalance: (user?.balance || 0) + transaction.amount,
    };
  },
});

/**
 * Créer un transfert vers le compte connecté d'un utilisateur (payout)
 * En production: utilise Stripe.transfers.create()
 */
export const createPayout = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (!user.stripeConnectedAccountId) {
      throw new Error("Compte Stripe Connect requis pour recevoir des fonds");
    }

    if (args.amount <= 0) {
      throw new Error("Montant invalide");
    }

    if (args.amount > (user.balance || 0)) {
      throw new Error("Solde insuffisant");
    }

    // Vérification KYC requise pour les retraits
    if (!user.kycVerified) {
      throw new Error("Vérification d'identité requise pour les retraits");
    }

    // En production: appeler Stripe API
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(args.amount * 100),
    //   currency: 'eur',
    //   destination: user.stripeConnectedAccountId,
    //   metadata: {
    //     userId: args.userId,
    //     type: 'payout',
    //   },
    // });

    // Simuler le transfert
    const simulatedTransferId = `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Déduire du solde
    await ctx.db.patch(args.userId, {
      balance: (user.balance || 0) - args.amount,
    });

    // Créer la transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "withdrawal",
      status: "completed",
      description: args.description || `Retrait de ${args.amount}€`,
      stripeTransferId: simulatedTransferId,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    return {
      success: true,
      transferId: simulatedTransferId,
      transactionId,
      amount: args.amount,
      newBalance: (user.balance || 0) - args.amount,
    };
  },
});

/**
 * Transférer les gains d'un challenge aux gagnants
 * Utilisé lors de la distribution des gains
 */
export const transferWinnings = mutation({
  args: {
    challengeId: v.id("challenges"),
    winnerId: v.id("users"),
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.winnerId);
    if (!user) throw new Error("Gagnant non trouvé");

    // En production: transférer directement via Stripe
    // Si l'utilisateur n'a pas de compte Stripe Connect, on crédite son solde in-app

    // Simuler le transfert
    const simulatedTransferId = `tr_win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créditer le solde
    await ctx.db.patch(args.winnerId, {
      balance: (user.balance || 0) + args.amount,
      totalWins: (user.totalWins || 0) + 1,
      totalEarnings: (user.totalEarnings || 0) + args.amount,
    });

    // Créer la transaction
    await ctx.db.insert("transactions", {
      userId: args.winnerId,
      amount: args.amount,
      type: "win",
      status: "completed",
      description: args.description,
      stripeTransferId: user.stripeConnectedAccountId ? simulatedTransferId : undefined,
      relatedChallengeId: args.challengeId,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    return {
      success: true,
      transferId: simulatedTransferId,
      amount: args.amount,
    };
  },
});

/**
 * Obtenir le statut Stripe d'un utilisateur
 */
export const getStripeStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      hasConnectedAccount: !!user.stripeConnectedAccountId,
      accountId: user.stripeConnectedAccountId,
      accountStatus: user.stripeAccountStatus || "none",
      canAcceptPayments: user.stripeAccountStatus === "verified",
      canReceivePayouts: user.stripeAccountStatus === "verified" && user.kycVerified,
      kycVerified: user.kycVerified || false,
    };
  },
});

/**
 * Simuler la complétion de l'onboarding Stripe (pour le hackathon)
 */
export const simulateOnboardingComplete = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    await ctx.db.patch(args.userId, {
      stripeAccountStatus: "verified",
    });

    return { success: true, message: "Compte Stripe vérifié (simulation)" };
  },
});

/**
 * Retrait simplifié (pour hackathon - simule le retrait bancaire)
 */
export const withdrawFunds = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    iban: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Validations
    if (args.amount < 10) {
      throw new Error("Montant minimum de retrait: 10€");
    }

    if (args.amount > (user.balance || 0)) {
      throw new Error("Solde insuffisant");
    }

    // Validation IBAN basique (format FR)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    const cleanIban = args.iban.replace(/\s/g, "").toUpperCase();
    if (!ibanRegex.test(cleanIban)) {
      throw new Error("Format IBAN invalide");
    }

    // Déduire du solde
    const newBalance = (user.balance || 0) - args.amount;
    await ctx.db.patch(args.userId, {
      balance: newBalance,
    });

    // Créer la transaction
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "withdrawal",
      status: "pending", // En attente de traitement
      description: `Retrait vers ${cleanIban.slice(0, 4)}****${cleanIban.slice(-4)}`,
      createdAt: Date.now(),
    });

    // Simuler le traitement (en vrai ce serait un webhook Stripe)
    // Pour le hackathon, on marque directement comme complété
    await ctx.db.patch(transactionId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return {
      success: true,
      transactionId,
      amount: args.amount,
      newBalance,
      message: `${args.amount}€ envoyés vers votre compte bancaire`,
    };
  },
});
