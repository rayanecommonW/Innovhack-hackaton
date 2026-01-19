import { query } from "./_generated/server";
import { v } from "convex/values";

// Récupérer le feed d'activité des amis
export const getFriendsFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    // Récupérer les amis
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = friendships.map((f) => f.friendId);

    // Ajouter l'utilisateur lui-même pour voir aussi ses propres activités
    friendIds.push(args.userId);

    // Récupérer les activités récentes
    const allActivities = await ctx.db
      .query("activityFeed")
      .withIndex("by_created")
      .order("desc")
      .take(200); // Prendre plus pour avoir assez après filtrage

    // Filtrer pour ne garder que les activités des amis
    const friendActivities = allActivities
      .filter((a) => friendIds.includes(a.userId))
      .slice(0, limit);

    // Enrichir avec les données utilisateur et les métadonnées
    const enriched = await Promise.all(
      friendActivities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        let metadata = {};
        try {
          metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
        } catch {}

        // Enrichir selon le type d'activité
        let target = null;
        if (activity.targetType === "challenge" && activity.targetId) {
          target = await ctx.db.get(activity.targetId as any);
        } else if (activity.targetType === "proof" && activity.targetId) {
          target = await ctx.db.get(activity.targetId as any);
        } else if (activity.targetType === "badge" && activity.targetId) {
          target = await ctx.db.get(activity.targetId as any);
        }

        return {
          ...activity,
          user: user ? { name: user.name, username: user.username } : null,
          metadata,
          target,
        };
      })
    );

    return enriched;
  },
});

// Récupérer le feed global (activités publiques)
export const getGlobalFeed = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    // Récupérer les activités récentes globales
    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_created")
      .order("desc")
      .take(limit + (args.offset || 0));

    const sliced = activities.slice(args.offset || 0, (args.offset || 0) + limit);

    // Enrichir
    const enriched = await Promise.all(
      sliced.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        let metadata = {};
        try {
          metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
        } catch {}

        return {
          ...activity,
          user: user ? { name: user.name, username: user.username } : null,
          metadata,
        };
      })
    );

    return enriched;
  },
});

// Récupérer l'activité d'un utilisateur spécifique
export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      activities.map(async (activity) => {
        let metadata = {};
        try {
          metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
        } catch {}

        let target = null;
        if (activity.targetType === "challenge" && activity.targetId) {
          target = await ctx.db.get(activity.targetId as any);
        }

        return {
          ...activity,
          metadata,
          target,
        };
      })
    );

    return enriched;
  },
});

// Récupérer les activités d'un challenge
export const getChallengeActivity = query({
  args: {
    challengeId: v.id("challenges"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    // Récupérer les activités liées à ce challenge
    const allActivities = await ctx.db
      .query("activityFeed")
      .withIndex("by_created")
      .order("desc")
      .take(500);

    const challengeActivities = allActivities
      .filter((a) => {
        if (a.targetType === "challenge" && a.targetId === args.challengeId) return true;
        try {
          const metadata = a.metadata ? JSON.parse(a.metadata) : {};
          return metadata.challengeId === args.challengeId;
        } catch {
          return false;
        }
      })
      .slice(0, limit);

    const enriched = await Promise.all(
      challengeActivities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        let metadata = {};
        try {
          metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
        } catch {}

        return {
          ...activity,
          user: user ? { name: user.name, username: user.username } : null,
          metadata,
        };
      })
    );

    return enriched;
  },
});

// Formater un message d'activité pour l'affichage
export const getActivityMessage = (type: string, metadata: any): string => {
  switch (type) {
    case "joined_pact":
      return `a rejoint le pact "${metadata.challengeTitle || "un pact"}"`;
    case "submitted_proof":
      return `a soumis une preuve pour "${metadata.challengeTitle || "un pact"}"`;
    case "won_pact":
      const amount = metadata.amount ? ` et gagné ${metadata.amount.toFixed(2)}€` : "";
      return `a réussi le pact "${metadata.challengeTitle || "un pact"}"${amount}`;
    case "lost_pact":
      return `n'a pas réussi le pact "${metadata.challengeTitle || "un pact"}"`;
    case "badge_unlocked":
      return `a débloqué le badge ${metadata.badgeIcon || ""} ${metadata.badgeTitle || ""}`;
    case "streak":
      return `est sur une série de ${metadata.streakCount} victoires !`;
    default:
      return "a fait quelque chose";
  }
};
