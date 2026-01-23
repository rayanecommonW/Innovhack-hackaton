import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Distribuer les gains à la fin d'un défi
export const distributeRewards = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Défi non trouvé");
    if (challenge.status === "completed") throw new Error("Défi déjà terminé");

    // Marquer comme en cours de distribution
    await ctx.db.patch(args.challengeId, { status: "distributing" });

    // Récupérer toutes les participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Séparer gagnants et perdants (ceux sans preuve validée sont perdants)
    const winners = participations.filter((p) => p.status === "won");
    const losers = participations.filter((p) => p.status !== "won");

    // Calculer le pot total et le pot des perdants
    const totalPot = participations.reduce((sum, p) => sum + p.betAmount, 0);
    const losersPot = losers.reduce((sum, p) => sum + p.betAmount, 0);

    // Si personne n'a gagné, rembourser tout le monde
    if (winners.length === 0) {
      for (const p of participations) {
        const user = await ctx.db.get(p.usertId);
        if (user) {
          await ctx.db.patch(p.usertId, {
            balance: user.balance + p.betAmount,
          });

          // Créer transaction de remboursement
          await ctx.db.insert("transactions", {
            userId: p.usertId,
            amount: p.betAmount,
            type: "refund",
            status: "completed",
            description: `Remboursement - ${challenge.title}`,
            relatedChallengeId: args.challengeId,
            createdAt: Date.now(),
            completedAt: Date.now(),
          });

          // Notification
          await ctx.db.insert("notifications", {
            userId: p.usertId,
            type: "refund",
            title: "Remboursement",
            body: `Tu as été remboursé de ${p.betAmount}€ pour "${challenge.title}"`,
            data: JSON.stringify({ challengeId: args.challengeId }),
            read: false,
            createdAt: Date.now(),
          });
        }
      }

      await ctx.db.patch(args.challengeId, {
        status: "completed",
        winnersCount: 0,
        losersCount: 0,
        totalPot,
      });

      return { type: "refund", message: "Aucun gagnant, tout le monde est remboursé" };
    }

    // Distribuer le pot entre les gagnants (proportionnellement à leur mise)
    const winnersTotal = winners.reduce((sum, p) => sum + p.betAmount, 0);

    for (const winner of winners) {
      const user = await ctx.db.get(winner.usertId);
      if (!user) continue;

      // Part proportionnelle du pot des perdants
      const winShare = winnersTotal > 0 ? (winner.betAmount / winnersTotal) * losersPot : 0;
      const totalReward = winner.betAmount + winShare;

      // Mettre à jour le solde et les stats
      await ctx.db.patch(winner.usertId, {
        balance: user.balance + totalReward,
        totalEarnings: (user.totalEarnings || 0) + winShare,
        totalWins: (user.totalWins || 0) + 1,
      });

      // Mettre à jour la participation avec les gains
      await ctx.db.patch(winner._id, { earnings: totalReward });

      // Créer transaction de gain
      await ctx.db.insert("transactions", {
        userId: winner.usertId,
        amount: totalReward,
        type: "win",
        status: "completed",
        description: `Gain - ${challenge.title}`,
        relatedChallengeId: args.challengeId,
        createdAt: Date.now(),
        completedAt: Date.now(),
      });

      // Créer le reward
      await ctx.db.insert("rewards", {
        challengeId: args.challengeId,
        participationId: winner._id,
        userId: winner.usertId,
        amount: totalReward,
        type: challenge.sponsorName ? "sponsor" : "win",
        promoCode: challenge.sponsorPromoCode,
        promoSponsor: challenge.sponsorName,
        createdAt: Date.now(),
      });

      // Notification de victoire
      await ctx.db.insert("notifications", {
        userId: winner.usertId,
        type: "you_won",
        title: "Tu as gagné ! 🎉",
        body: challenge.sponsorRewardText
          ? `Tu as gagné "${challenge.sponsorRewardText}" + ${totalReward.toFixed(2)}€ !`
          : `Tu as gagné ${totalReward.toFixed(2)}€ pour "${challenge.title}" !`,
        data: JSON.stringify({ challengeId: args.challengeId, amount: totalReward }),
        read: false,
        createdAt: Date.now(),
      });

      // Push notification de victoire
      await ctx.scheduler.runAfter(0, internal.pushNotifications.sendChallengeWonNotification, {
        userId: winner.usertId,
        challengeId: args.challengeId,
        challengeTitle: challenge.title,
        amountWon: totalReward,
      });

      // Vérifier et débloquer les badges
      await ctx.scheduler.runAfter(0, internal.badges.checkAndUnlockBadges, {
        userId: winner.usertId,
      });

      // Activité feed
      await ctx.db.insert("activityFeed", {
        userId: winner.usertId,
        type: "won_pact",
        targetId: args.challengeId,
        targetType: "challenge",
        metadata: JSON.stringify({
          challengeTitle: challenge.title,
          amount: totalReward,
          sponsorReward: challenge.sponsorRewardText,
        }),
        createdAt: Date.now(),
      });
    }

    // Marquer les perdants et les notifier
    for (const loser of losers) {
      const user = await ctx.db.get(loser.usertId);

      await ctx.db.patch(loser._id, { status: "lost" });

      if (user) {
        // Notification de perte
        await ctx.db.insert("notifications", {
          userId: loser.usertId,
          type: "you_lost",
          title: "Pact perdu",
          body: `Tu as perdu ${loser.betAmount}€ sur "${challenge.title}"`,
          data: JSON.stringify({ challengeId: args.challengeId }),
          read: false,
          createdAt: Date.now(),
        });

        // Push notification de perte
        await ctx.scheduler.runAfter(0, internal.pushNotifications.notifyUser, {
          userId: loser.usertId,
          title: "Pact perdu",
          body: `Tu as perdu ${loser.betAmount}€ sur "${challenge.title}"`,
          data: { challengeId: args.challengeId },
          type: "challenge_lost",
        });

        // Activité feed
        await ctx.db.insert("activityFeed", {
          userId: loser.usertId,
          type: "lost_pact",
          targetId: args.challengeId,
          targetType: "challenge",
          metadata: JSON.stringify({
            challengeTitle: challenge.title,
            amount: loser.betAmount,
          }),
          createdAt: Date.now(),
        });
      }
    }

    // Marquer le défi comme terminé
    await ctx.db.patch(args.challengeId, {
      status: "completed",
      winnersCount: winners.length,
      losersCount: losers.length,
      totalPot,
    });

    return {
      type: "distribution",
      winnersCount: winners.length,
      losersCount: losers.length,
      potDistributed: losersPot,
      totalPot,
    };
  },
});

/**
 * Vérifier et gérer les défis terminés (appelé par cron toutes les heures)
 *
 * FLOW:
 * 1. Pact endDate passée → passe en "validating", définit validationDeadline (+24h)
 * 2. Organisateur a 24h pour valider les preuves en attente
 * 3. Après validationDeadline → auto-finalise (preuves non validées = rejetées)
 */
export const checkAndDistributeEndedChallenges = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 heures

    // ==== ÉTAPE 1: Passer les pacts expirés en mode "validating" ====
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const expiredChallenges = activeChallenges.filter((c) => c.endDate <= now);

    for (const challenge of expiredChallenges) {
      // Passer en mode validation avec deadline +24h
      await ctx.db.patch(challenge._id, {
        status: "validating",
        validationDeadline: now + GRACE_PERIOD,
      });

      // Notifier l'organisateur
      await ctx.db.insert("notifications", {
        userId: challenge.creatorId,
        type: "validation_required",
        title: "Validation requise",
        body: `Le pact "${challenge.title}" est terminé. Tu as 24h pour valider les preuves.`,
        data: JSON.stringify({ challengeId: challenge._id }),
        read: false,
        createdAt: now,
      });

      // Notifier les participants que le pact est en phase de validation
      const participations = await ctx.db
        .query("participations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      for (const p of participations) {
        if (p.status === "pending_validation") {
          await ctx.db.insert("notifications", {
            userId: p.usertId,
            type: "validation_pending",
            title: "En attente de validation",
            body: `Ta preuve pour "${challenge.title}" est en cours de validation. Résultats dans 24h max.`,
            data: JSON.stringify({ challengeId: challenge._id }),
            read: false,
            createdAt: now,
          });
        } else if (p.status === "active" || p.status === "pending_proof") {
          // Pas de preuve soumise → perdant
          await ctx.db.patch(p._id, { status: "lost" });
          await ctx.db.insert("notifications", {
            userId: p.usertId,
            type: "time_expired",
            title: "Temps écoulé",
            body: `Le délai pour "${challenge.title}" est terminé. Tu n'as pas soumis de preuve.`,
            data: JSON.stringify({ challengeId: challenge._id }),
            read: false,
            createdAt: now,
          });
        }
      }
    }

    // ==== ÉTAPE 2: Finaliser les pacts dont la période de validation est terminée ====
    const validatingChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "validating"))
      .collect();

    const toFinalize = validatingChallenges.filter(
      (c) => c.validationDeadline && c.validationDeadline <= now
    );

    const results = [];
    for (const challenge of toFinalize) {
      try {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        // Preuves non validées après 24h → auto-approuver
        for (const p of participations) {
          if (p.status === "pending_validation") {
            // Re-fetch to avoid race condition with manual validation
            const currentP = await ctx.db.get(p._id);
            if (!currentP || currentP.status !== "pending_validation") {
              // Already validated manually, skip
              continue;
            }

            // L'organisateur n'a pas validé dans les 24h
            // On auto-approuve car l'organisateur a eu sa chance
            await ctx.db.patch(p._id, { status: "won" });

            // Mettre à jour la preuve
            const proof = await ctx.db
              .query("proofs")
              .withIndex("by_participation", (q) => q.eq("participationId", p._id))
              .first();

            if (proof) {
              await ctx.db.patch(proof._id, {
                organizerValidation: "approved",
                organizerComment: "Auto-approuvé (délai de validation expiré)",
                validatedAt: now,
              });
            }

            await ctx.db.insert("notifications", {
              userId: p.usertId,
              type: "auto_approved",
              title: "Preuve auto-validée",
              body: `Ta preuve pour "${challenge.title}" a été automatiquement validée.`,
              data: JSON.stringify({ challengeId: challenge._id }),
              read: false,
              createdAt: now,
            });
          }
        }

        // Recalculer après auto-validation
        const updatedParticipations = await ctx.db
          .query("participations")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        // Distribuer les gains
        const winners = updatedParticipations.filter((p) => p.status === "won");
        const losers = updatedParticipations.filter((p) => p.status === "lost");
        const totalPot = updatedParticipations.reduce((sum, p) => sum + p.betAmount, 0);
        const losersPot = losers.reduce((sum, p) => sum + p.betAmount, 0);
        const winnersTotal = winners.reduce((sum, p) => sum + p.betAmount, 0);

        if (winners.length === 0) {
          // Aucun gagnant → rembourser tout le monde
          for (const p of updatedParticipations) {
            const user = await ctx.db.get(p.usertId);
            if (user) {
              await ctx.db.patch(p.usertId, { balance: user.balance + p.betAmount });
              await ctx.db.insert("transactions", {
                userId: p.usertId,
                amount: p.betAmount,
                type: "refund",
                status: "completed",
                description: `Remboursement - ${challenge.title}`,
                relatedChallengeId: challenge._id,
                createdAt: now,
                completedAt: now,
              });
              await ctx.db.insert("notifications", {
                userId: p.usertId,
                type: "refund",
                title: "Remboursement",
                body: `Tu as été remboursé de ${p.betAmount}€ pour "${challenge.title}" (aucun gagnant)`,
                data: JSON.stringify({ challengeId: challenge._id }),
                read: false,
                createdAt: now,
              });
            }
          }
        } else {
          // Distribuer aux gagnants
          for (const winner of winners) {
            const user = await ctx.db.get(winner.usertId);
            if (user) {
              const winShare = winnersTotal > 0 ? (winner.betAmount / winnersTotal) * losersPot : 0;
              const totalReward = winner.betAmount + winShare;

              await ctx.db.patch(winner.usertId, {
                balance: user.balance + totalReward,
                totalEarnings: (user.totalEarnings || 0) + winShare,
                totalWins: (user.totalWins || 0) + 1,
              });
              await ctx.db.patch(winner._id, { earnings: totalReward });

              await ctx.db.insert("transactions", {
                userId: winner.usertId,
                amount: totalReward,
                type: "win",
                status: "completed",
                description: `Gain - ${challenge.title}`,
                relatedChallengeId: challenge._id,
                createdAt: now,
                completedAt: now,
              });

              await ctx.db.insert("notifications", {
                userId: winner.usertId,
                type: "you_won",
                title: "Tu as gagné ! 🎉",
                body: `Tu as gagné ${totalReward.toFixed(2)}€ pour "${challenge.title}" !`,
                data: JSON.stringify({ challengeId: challenge._id, amount: totalReward }),
                read: false,
                createdAt: now,
              });

              // Vérifier et débloquer les badges
              await ctx.scheduler.runAfter(0, internal.badges.checkAndUnlockBadges, {
                userId: winner.usertId,
              });
            }
          }

          // Notifier les perdants
          for (const loser of losers) {
            await ctx.db.patch(loser.usertId, {
              totalLosses: ((await ctx.db.get(loser.usertId))?.totalLosses || 0) + 1,
            });

            await ctx.db.insert("notifications", {
              userId: loser.usertId,
              type: "you_lost",
              title: "Pact perdu",
              body: `Tu as perdu ${loser.betAmount}€ sur "${challenge.title}"`,
              data: JSON.stringify({ challengeId: challenge._id }),
              read: false,
              createdAt: now,
            });
          }
        }

        // Marquer le défi comme terminé
        await ctx.db.patch(challenge._id, {
          status: "completed",
          winnersCount: winners.length,
          losersCount: losers.length,
          totalPot,
        });

        results.push({ challengeId: challenge._id, success: true, winners: winners.length, losers: losers.length });
      } catch (error) {
        console.error("Error finalizing challenge:", challenge._id, error);
        results.push({ challengeId: challenge._id, success: false, error: String(error) });
      }
    }

    return {
      movedToValidating: expiredChallenges.length,
      finalized: results.length,
      results,
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

    const enriched = await Promise.all(
      rewards.map(async (r) => {
        const challenge = await ctx.db.get(r.challengeId);
        return { ...r, challenge };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
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
      .collect();

    const withPromo = rewards.filter((r) => r.promoCode);

    return withPromo.map((r) => ({
      sponsor: r.promoSponsor,
      code: r.promoCode,
      earnedAt: r.createdAt,
    }));
  },
});

// Statistiques de gains d'un utilisateur
export const getUserRewardStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rewards = await ctx.db
      .query("rewards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalEarnings = rewards.reduce((sum, r) => sum + r.amount, 0);
    const winCount = rewards.filter((r) => r.type === "win" || r.type === "sponsor").length;
    const sponsorRewards = rewards.filter((r) => r.type === "sponsor");

    return {
      totalEarnings,
      winCount,
      sponsorRewardsCount: sponsorRewards.length,
      averageWin: winCount > 0 ? totalEarnings / winCount : 0,
    };
  },
});
