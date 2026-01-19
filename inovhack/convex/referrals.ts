import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Configuration du parrainage
const REFERRAL_CONFIG = {
  referrerBonus: 5, // 5€ pour le parrain quand le filleul fait son premier pact
  referredBonus: 2, // 2€ pour le filleul à l'inscription
  referrerBonusOnWin: 1, // 1€ bonus pour le parrain quand le filleul gagne un pact
  maxReferralBonusPerMonth: 100, // Max 100€/mois en bonus de parrainage
};

// Générer un code de parrainage unique
const generateReferralCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Créer/récupérer le code de parrainage d'un utilisateur
export const getOrCreateReferralCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (user.referralCode) {
      return user.referralCode;
    }

    // Générer un code unique
    let code = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
        .first();
      if (!existing) break;
      code = generateReferralCode();
      attempts++;
    }

    await ctx.db.patch(args.userId, { referralCode: code });
    return code;
  },
});

// Appliquer un code de parrainage lors de l'inscription
export const applyReferralCode = mutation({
  args: {
    userId: v.id("users"),
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Vérifier que l'utilisateur n'a pas déjà été parrainé
    if (user.referredBy) {
      throw new Error("Tu as déjà utilisé un code de parrainage");
    }

    // Trouver le parrain
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode.toUpperCase()))
      .first();

    if (!referrer) throw new Error("Code de parrainage invalide");
    if (referrer._id === args.userId) throw new Error("Tu ne peux pas utiliser ton propre code");

    // Créer l'entrée de parrainage
    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referredId: args.userId,
      status: "pending",
      bonusAmount: REFERRAL_CONFIG.referredBonus,
      referrerBonus: REFERRAL_CONFIG.referrerBonus,
      referredBonus: REFERRAL_CONFIG.referredBonus,
      createdAt: Date.now(),
    });

    // Donner le bonus au filleul
    await ctx.db.patch(args.userId, {
      referredBy: referrer._id,
      balance: user.balance + REFERRAL_CONFIG.referredBonus,
    });

    // Créer la transaction pour le filleul
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: REFERRAL_CONFIG.referredBonus,
      type: "referral_bonus",
      status: "completed",
      description: `Bonus de bienvenue - Parrainé par ${referrer.name}`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Notification au filleul
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "referral_bonus",
      title: "Bonus de bienvenue !",
      body: `Tu as reçu ${REFERRAL_CONFIG.referredBonus}€ grâce au parrainage de ${referrer.name}`,
      read: false,
      createdAt: Date.now(),
    });

    // Notification au parrain
    await ctx.db.insert("notifications", {
      userId: referrer._id,
      type: "new_referral",
      title: "Nouveau filleul !",
      body: `${user.name} s'est inscrit avec ton code. Tu recevras ${REFERRAL_CONFIG.referrerBonus}€ quand il fera son premier pact.`,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true, bonus: REFERRAL_CONFIG.referredBonus };
  },
});

// Récompenser le parrain quand le filleul fait son premier pact
export const rewardReferrerOnFirstPact = internalMutation({
  args: { referredId: v.id("users") },
  handler: async (ctx, args) => {
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q) => q.eq("referredId", args.referredId))
      .first();

    if (!referral || referral.status === "rewarded") return null;

    const referrer = await ctx.db.get(referral.referrerId);
    if (!referrer) return null;

    // Mettre à jour le parrainage
    await ctx.db.patch(referral._id, {
      status: "rewarded",
      firstPactCompleted: true,
      rewardedAt: Date.now(),
    });

    // Donner le bonus au parrain
    await ctx.db.patch(referral.referrerId, {
      balance: referrer.balance + REFERRAL_CONFIG.referrerBonus,
      referralCount: (referrer.referralCount || 0) + 1,
      referralEarnings: (referrer.referralEarnings || 0) + REFERRAL_CONFIG.referrerBonus,
    });

    // Transaction
    await ctx.db.insert("transactions", {
      userId: referral.referrerId,
      amount: REFERRAL_CONFIG.referrerBonus,
      type: "referral_bonus",
      status: "completed",
      description: `Bonus parrainage - Filleul a fait son premier pact`,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // Notification
    await ctx.db.insert("notifications", {
      userId: referral.referrerId,
      type: "referral_bonus",
      title: `+${REFERRAL_CONFIG.referrerBonus}€ Bonus parrainage !`,
      body: "Ton filleul a fait son premier pact. Merci de faire grandir PACT !",
      read: false,
      createdAt: Date.now(),
    });

    return { referrerId: referral.referrerId, bonus: REFERRAL_CONFIG.referrerBonus };
  },
});

// Récupérer les stats de parrainage d'un utilisateur
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Récupérer les parrainages
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();

    const pendingCount = referrals.filter((r) => r.status === "pending").length;
    const completedCount = referrals.filter((r) => r.status === "rewarded").length;
    const totalEarnings = referrals
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + (r.referrerBonus || 0), 0);

    return {
      referralCode: user.referralCode,
      totalReferrals: referrals.length,
      pendingReferrals: pendingCount,
      completedReferrals: completedCount,
      totalEarnings,
      referralCount: user.referralCount || 0,
    };
  },
});

// Récupérer la liste des filleuls
export const getReferrals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();

    const enriched = await Promise.all(
      referrals.map(async (r) => {
        const referred = await ctx.db.get(r.referredId);
        return {
          ...r,
          referredName: referred?.name || "Utilisateur",
          referredUsername: referred?.username,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Vérifier si un code est valide
export const validateReferralCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", args.code.toUpperCase()))
      .first();

    if (!referrer) return { valid: false };

    return {
      valid: true,
      referrerName: referrer.name,
      bonus: REFERRAL_CONFIG.referredBonus,
    };
  },
});
