import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Récupérer les stats d'un utilisateur
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Récupérer les participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .collect();

    const totalPacts = participations.length;
    const wonPacts = participations.filter((p) => p.status === "won").length;
    const lostPacts = participations.filter((p) => p.status === "lost").length;
    const activePacts = participations.filter((p) => p.status === "active" || p.status === "pending_validation").length;

    const totalBet = participations.reduce((sum, p) => sum + p.betAmount, 0);
    const totalEarnings = participations
      .filter((p) => p.status === "won" && p.earnings)
      .reduce((sum, p) => sum + (p.earnings || 0), 0);

    const successRate = totalPacts > 0 ? Math.round((wonPacts / (wonPacts + lostPacts)) * 100) || 0 : 0;

    return {
      totalPacts,
      wonPacts,
      lostPacts,
      activePacts,
      totalBet,
      totalEarnings,
      netProfit: totalEarnings - totalBet,
      successRate,
      currentStreak: user.currentStreak || 0,
      bestStreak: user.bestStreak || 0,
      balance: user.balance,
      referralCount: user.referralCount || 0,
      referralEarnings: user.referralEarnings || 0,
    };
  },
});

// Leaderboard global
export const getLeaderboard = query({
  args: {
    period: v.optional(v.string()), // "all_time", "monthly", "weekly"
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Récupérer tous les utilisateurs
    const users = await ctx.db.query("users").collect();

    // Calculer le score pour chaque utilisateur
    const userScores = await Promise.all(
      users.map(async (user) => {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_user", (q) => q.eq("usertId", user._id))
          .collect();

        // Filtrer par période si spécifié
        let filteredParticipations = participations;
        if (args.period === "weekly") {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          filteredParticipations = participations.filter((p) => p.joinedAt >= weekAgo);
        } else if (args.period === "monthly") {
          const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          filteredParticipations = participations.filter((p) => p.joinedAt >= monthAgo);
        }

        // Filtrer par catégorie si spécifié
        if (args.category) {
          const challengeIds = filteredParticipations.map((p) => p.challengeId);
          const challenges = await Promise.all(challengeIds.map((id) => ctx.db.get(id)));
          const validChallengeIds = challenges
            .filter((c) => c?.category === args.category)
            .map((c) => c!._id);
          filteredParticipations = filteredParticipations.filter((p) =>
            validChallengeIds.includes(p.challengeId)
          );
        }

        const wins = filteredParticipations.filter((p) => p.status === "won").length;
        const totalEarnings = filteredParticipations
          .filter((p) => p.earnings)
          .reduce((sum, p) => sum + (p.earnings || 0), 0);

        // Score = wins * 100 + earnings
        const score = wins * 100 + totalEarnings;

        return {
          userId: user._id,
          name: user.name,
          username: user.username,
          wins,
          earnings: totalEarnings,
          score,
          streak: user.currentStreak || 0,
        };
      })
    );

    // Trier par score et limiter
    const sorted = userScores
      .filter((u) => u.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((u, index) => ({ ...u, rank: index + 1 }));

    return sorted;
  },
});

// Position d'un utilisateur dans le leaderboard
export const getUserRank = query({
  args: {
    userId: v.id("users"),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    const userScores = await Promise.all(
      users.map(async (user) => {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_user", (q) => q.eq("usertId", user._id))
          .collect();

        let filteredParticipations = participations;
        if (args.period === "weekly") {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          filteredParticipations = participations.filter((p) => p.joinedAt >= weekAgo);
        } else if (args.period === "monthly") {
          const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          filteredParticipations = participations.filter((p) => p.joinedAt >= monthAgo);
        }

        const wins = filteredParticipations.filter((p) => p.status === "won").length;
        const totalEarnings = filteredParticipations
          .filter((p) => p.earnings)
          .reduce((sum, p) => sum + (p.earnings || 0), 0);

        return {
          userId: user._id,
          score: wins * 100 + totalEarnings,
        };
      })
    );

    const sorted = userScores.sort((a, b) => b.score - a.score);
    const userIndex = sorted.findIndex((u) => u.userId === args.userId);

    if (userIndex === -1) return { rank: null, totalUsers: sorted.length };

    return {
      rank: userIndex + 1,
      totalUsers: sorted.length,
      score: sorted[userIndex].score,
      percentile: Math.round((1 - userIndex / sorted.length) * 100),
    };
  },
});

// Mettre à jour les stats utilisateur après un pact
export const updateUserStats = internalMutation({
  args: {
    userId: v.id("users"),
    won: v.boolean(),
    earnings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    if (args.won) {
      const newStreak = (user.currentStreak || 0) + 1;
      await ctx.db.patch(args.userId, {
        totalWins: (user.totalWins || 0) + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(user.bestStreak || 0, newStreak),
        totalEarnings: (user.totalEarnings || 0) + (args.earnings || 0),
        totalPacts: (user.totalPacts || 0) + 1,
      });
    } else {
      await ctx.db.patch(args.userId, {
        totalLosses: (user.totalLosses || 0) + 1,
        currentStreak: 0,
        totalPacts: (user.totalPacts || 0) + 1,
      });
    }

    // Recalculer le taux de réussite
    const updatedUser = await ctx.db.get(args.userId);
    if (updatedUser) {
      const total = (updatedUser.totalWins || 0) + (updatedUser.totalLosses || 0);
      const successRate = total > 0 ? Math.round(((updatedUser.totalWins || 0) / total) * 100) : 0;
      await ctx.db.patch(args.userId, { successRate });
    }
  },
});

// Stats globales de la plateforme
export const getPlatformStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const challenges = await ctx.db.query("challenges").collect();
    const participations = await ctx.db.query("participations").collect();

    const totalUsers = users.length;
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter((c) => c.status === "active").length;
    const completedChallenges = challenges.filter((c) => c.status === "completed").length;
    const totalParticipations = participations.length;
    const totalPot = participations.reduce((sum, p) => sum + p.betAmount, 0);

    return {
      totalUsers,
      totalChallenges,
      activeChallenges,
      completedChallenges,
      totalParticipations,
      totalPot,
      averageBet: totalParticipations > 0 ? totalPot / totalParticipations : 0,
    };
  },
});

// Mettre à jour le leaderboard (appelé par cron)
export const updateLeaderboard = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Calculer les scores pour chaque utilisateur
    const userScores = await Promise.all(
      users.map(async (user) => {
        const participations = await ctx.db
          .query("participations")
          .withIndex("by_user", (q) => q.eq("usertId", user._id))
          .collect();

        const wins = participations.filter((p) => p.status === "won").length;
        const totalEarnings = participations
          .filter((p) => p.earnings)
          .reduce((sum, p) => sum + (p.earnings || 0), 0);

        return {
          userId: user._id,
          score: wins * 100 + totalEarnings,
          wins,
          earnings: totalEarnings,
        };
      })
    );

    // Trier par score
    const sorted = userScores.sort((a, b) => b.score - a.score);

    // Mettre à jour le rang de chaque utilisateur
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      if (entry.score > 0) {
        // Vérifier si une entrée existe déjà
        const existing = await ctx.db
          .query("leaderboard")
          .withIndex("by_user", (q) => q.eq("userId", entry.userId))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            rank: i + 1,
            score: entry.score,
            wins: entry.wins,
            earnings: entry.earnings,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("leaderboard", {
            userId: entry.userId,
            rank: i + 1,
            score: entry.score,
            wins: entry.wins,
            earnings: entry.earnings,
            period: "all_time",
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { updated: sorted.filter((s) => s.score > 0).length };
  },
});
