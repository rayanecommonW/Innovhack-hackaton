import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Taux de commission PACT
const COMMISSION_RATES = {
  public: 0.05, // 5% pour pacts publics/communautaires
  friends: 0.03, // 3% pour pacts entre amis
};

/**
 * Calcule et distribue les gains d'un challenge terminé
 *
 * Logique de redistribution proportionnelle:
 * 1. Séparer gagnants et perdants
 * 2. Calculer le pot des perdants
 * 3. Appliquer la commission PACT (5% public, 3% amis)
 * 4. Distribuer le reste proportionnellement aux gagnants selon leur mise
 */
export const distributeRewards = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Récupérer le challenge
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge non trouvé");

    // Vérifier que le challenge peut être finalisé
    if (challenge.status === "distributing") {
      throw new Error("Distribution déjà en cours");
    }

    // Marquer comme en cours de distribution
    await ctx.db.patch(args.challengeId, { status: "distributing" });

    // Récupérer toutes les participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    if (participations.length === 0) {
      await ctx.db.patch(args.challengeId, { status: "completed" });
      return { success: true, message: "Aucun participant" };
    }

    // Séparer gagnants et perdants
    const winners = participations.filter((p) => p.status === "won");
    const losers = participations.filter((p) => p.status === "lost");

    // Calculer les totaux
    const losersPot = losers.reduce((sum, p) => sum + p.betAmount, 0);
    const winnersTotalBet = winners.reduce((sum, p) => sum + p.betAmount, 0);

    // Déterminer le taux de commission selon le type de pact
    const commissionRate = challenge.type === "friends"
      ? COMMISSION_RATES.friends
      : COMMISSION_RATES.public;

    // Calculer la commission PACT
    const commission = Math.round(losersPot * commissionRate * 100) / 100;
    const distributablePot = losersPot - commission;

    // Résultats de la distribution
    const results = {
      challengeId: args.challengeId,
      challengeType: challenge.type,
      totalParticipants: participations.length,
      winnersCount: winners.length,
      losersCount: losers.length,
      losersPot,
      commissionRate: commissionRate * 100, // En pourcentage
      commission,
      distributablePot,
      distributions: [] as Array<{
        oderId: string;
        odername: string;
        betAmount: number;
        earnings: number;
        total: number;
      }>,
    };

    // Si aucun gagnant, tout le monde récupère sa mise (cas rare)
    if (winners.length === 0) {
      // Rembourser tout le monde
      for (const participation of participations) {
        const user = await ctx.db.get(participation.usertId);
        if (user) {
          await ctx.db.patch(participation.usertId, {
            balance: user.balance + participation.betAmount,
          });

          // Enregistrer la transaction de remboursement
          await ctx.db.insert("transactions", {
            userId: participation.usertId,
            amount: participation.betAmount,
            type: "refund",
            status: "completed",
            description: `Remboursement - ${challenge.title} (aucun gagnant)`,
            relatedChallengeId: args.challengeId,
            createdAt: Date.now(),
            completedAt: Date.now(),
          });
        }
      }

      await ctx.db.patch(args.challengeId, {
        status: "completed",
        winnersCount: 0,
        losersCount: losers.length,
      });

      return {
        success: true,
        message: "Aucun gagnant - remboursement effectué",
        results,
      };
    }

    // Distribuer aux gagnants proportionnellement
    for (const winner of winners) {
      const user = await ctx.db.get(winner.usertId);
      if (!user) continue;

      // Calcul proportionnel: (mise du gagnant / total mises gagnants) * pot distribuable
      const proportion = winner.betAmount / winnersTotalBet;
      const earnings = Math.round(distributablePot * proportion * 100) / 100;
      const totalReturn = winner.betAmount + earnings; // Mise récupérée + gains

      // Mettre à jour le solde
      await ctx.db.patch(winner.usertId, {
        balance: user.balance + totalReturn,
        totalWins: (user.totalWins || 0) + 1,
        totalEarnings: (user.totalEarnings || 0) + earnings,
      });

      // Mettre à jour la participation avec les gains
      await ctx.db.patch(winner._id, {
        earnings: earnings,
      });

      // Enregistrer la transaction de gain
      await ctx.db.insert("transactions", {
        userId: winner.usertId,
        amount: totalReturn,
        type: "win",
        status: "completed",
        description: `Gain - ${challenge.title} (engagement: ${winner.betAmount}€ + bonus: ${earnings.toFixed(2)}€)`,
        relatedChallengeId: args.challengeId,
        createdAt: Date.now(),
        completedAt: Date.now(),
      });

      // Enregistrer dans rewards
      await ctx.db.insert("rewards", {
        challengeId: args.challengeId,
        participationId: winner._id,
        userId: winner.usertId,
        amount: earnings,
        type: "win",
        createdAt: Date.now(),
      });

      results.distributions.push({
        oderId: winner.usertId,
        odername: user.name,
        betAmount: winner.betAmount,
        earnings,
        total: totalReturn,
      });
    }

    // Mettre à jour les stats des perdants
    for (const loser of losers) {
      const user = await ctx.db.get(loser.usertId);
      if (user) {
        await ctx.db.patch(loser.usertId, {
          totalLosses: (user.totalLosses || 0) + 1,
        });

        // Enregistrer la transaction de perte
        await ctx.db.insert("transactions", {
          userId: loser.usertId,
          amount: -loser.betAmount,
          type: "bet",
          status: "completed",
          description: `Perte - ${challenge.title}`,
          relatedChallengeId: args.challengeId,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      }
    }

    // Enregistrer la commission PACT (pour les stats)
    if (commission > 0) {
      await ctx.db.insert("transactions", {
        userId: challenge.creatorId, // Associé au créateur pour tracking
        amount: commission,
        type: "commission" as any,
        status: "completed",
        description: `Commission PACT ${commissionRate * 100}% - ${challenge.title}`,
        relatedChallengeId: args.challengeId,
        createdAt: Date.now(),
        completedAt: Date.now(),
      });
    }

    // Marquer le challenge comme terminé
    await ctx.db.patch(args.challengeId, {
      status: "completed",
      totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
      winnersCount: winners.length,
      losersCount: losers.length,
    });

    return {
      success: true,
      message: `Distribution effectuée: ${winners.length} gagnants, ${losers.length} perdants`,
      results,
    };
  },
});

/**
 * Prévisualiser la distribution sans l'exécuter
 */
export const previewDistribution = query({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return null;

    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const winners = participations.filter((p) => p.status === "won");
    const losers = participations.filter((p) => p.status === "lost");
    const active = participations.filter((p) => p.status === "active");

    const losersPot = losers.reduce((sum, p) => sum + p.betAmount, 0);
    const winnersTotalBet = winners.reduce((sum, p) => sum + p.betAmount, 0);

    const commissionRate = challenge.type === "friends"
      ? COMMISSION_RATES.friends
      : COMMISSION_RATES.public;

    const commission = Math.round(losersPot * commissionRate * 100) / 100;
    const distributablePot = losersPot - commission;

    // Calculer les gains prévisionnels pour chaque gagnant
    const winnersPreviews = await Promise.all(
      winners.map(async (w) => {
        const user = await ctx.db.get(w.usertId);
        const proportion = winnersTotalBet > 0 ? w.betAmount / winnersTotalBet : 0;
        const earnings = Math.round(distributablePot * proportion * 100) / 100;
        return {
          oderId: w.usertId,
          name: user?.name || "Anonyme",
          betAmount: w.betAmount,
          proportion: Math.round(proportion * 100),
          estimatedEarnings: earnings,
          estimatedTotal: w.betAmount + earnings,
        };
      })
    );

    return {
      challengeTitle: challenge.title,
      challengeType: challenge.type,
      commissionRate: commissionRate * 100,
      status: {
        winners: winners.length,
        losers: losers.length,
        active: active.length,
        total: participations.length,
      },
      financials: {
        totalPot: participations.reduce((sum, p) => sum + p.betAmount, 0),
        losersPot,
        commission,
        distributablePot,
      },
      winnersPreviews,
      canDistribute: active.length === 0 && (winners.length > 0 || losers.length > 0),
    };
  },
});

/**
 * Marquer un participant comme gagnant
 */
export const markAsWinner = mutation({
  args: {
    participationId: v.id("participations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participationId, { status: "won" });
    return { success: true };
  },
});

/**
 * Marquer un participant comme perdant
 */
export const markAsLoser = mutation({
  args: {
    participationId: v.id("participations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participationId, { status: "lost" });
    return { success: true };
  },
});

/**
 * Finaliser un challenge: marquer tous les "active" comme perdants et distribuer
 */
export const finalizeChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Récupérer toutes les participations actives
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Marquer tous les "active" comme perdants (n'ont pas soumis de preuve validée)
    for (const p of participations) {
      if (p.status === "active") {
        await ctx.db.patch(p._id, { status: "lost" });
      }
    }

    return { success: true, message: "Participations finalisées" };
  },
});
