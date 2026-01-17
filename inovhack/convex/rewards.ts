import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Distribuer les gains à la fin d'un défi
export const distributeRewards = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Défi non trouvé");

    // Récupérer toutes les participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Séparer gagnants et perdants
    const winners = participations.filter((p) => p.status === "won");
    const losers = participations.filter((p) => p.status === "lost" || p.status === "active");

    // Calculer le pot des perdants
    const losersPot = losers.reduce((sum, p) => sum + p.betAmount, 0);

    // Si personne n'a gagné, rembourser tout le monde
    if (winners.length === 0) {
      for (const p of participations) {
        const user = await ctx.db.get(p.usertId);
        if (user) {
          await ctx.db.patch(p.usertId, {
            balance: user.balance + p.betAmount,
          });
        }
      }
      await ctx.db.patch(args.challengeId, { status: "completed" });
      return { type: "refund", message: "Aucun gagnant, tout le monde est remboursé" };
    }

    // Distribuer le pot entre les gagnants (proportionnellement à leur mise)
    const winnersTotal = winners.reduce((sum, p) => sum + p.betAmount, 0);

    for (const winner of winners) {
      const user = await ctx.db.get(winner.usertId);
      if (!user) continue;

      // Part proportionnelle du pot des perdants
      const winShare = (winner.betAmount / winnersTotal) * losersPot;
      // Récupérer sa mise + gains
      const totalReward = winner.betAmount + winShare;

      // Mettre à jour le solde
      await ctx.db.patch(winner.usertId, {
        balance: user.balance + totalReward,
        totalWins: user.totalWins + 1,
      });

      // Créer le reward avec le code promo
      await ctx.db.insert("rewards", {
        challengeId: args.challengeId,
        userId: winner.usertId,
        amount: totalReward,
        promoCode: challenge.sponsorPromoCode,
        promoSponsor: challenge.sponsorName,
        createdAt: Date.now(),
      });
    }

    // Mettre à jour les stats des perdants
    for (const loser of losers) {
      const user = await ctx.db.get(loser.usertId);
      if (user) {
        await ctx.db.patch(loser.usertId, {
          totalLosses: user.totalLosses + 1,
        });
      }
      // Marquer comme perdu
      await ctx.db.patch(loser._id, { status: "lost" });
    }

    // Marquer le défi comme terminé
    await ctx.db.patch(args.challengeId, { status: "completed" });

    return {
      type: "distribution",
      winnersCount: winners.length,
      losersCount: losers.length,
      potDistributed: losersPot,
    };
  },
});

// Récupérer les récompenses d'un utilisateur
export const getMyRewards = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrichir avec les données du défi
    const enriched = await Promise.all(
      rewards.map(async (r) => {
        const challenge = await ctx.db.get(r.challengeId);
        return { ...r, challenge };
      })
    );

    return enriched;
  },
});

// Récupérer les récompenses d'un défi
export const getChallengeRewards = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Enrichir avec les données utilisateur
    const enriched = await Promise.all(
      rewards.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, user };
      })
    );

    return enriched;
  },
});

// Récupérer les codes promo disponibles pour un utilisateur
export const getMyPromoCodes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("promoCode"), undefined))
      .collect();

    return rewards.map((r) => ({
      sponsor: r.promoSponsor,
      code: r.promoCode,
      earnedAt: r.createdAt,
    }));
  },
});
