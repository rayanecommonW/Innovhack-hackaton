import { internalMutation } from "./_generated/server";

// Nettoyer les anciennes notifications (plus de 30 jours)
export const cleanupOldNotifications = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    let deleted = 0;
    for (const notification of oldNotifications) {
      // Ne supprimer que les notifications lues
      if (notification.read) {
        await ctx.db.delete(notification._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

// Nettoyer les anciennes entrées du feed d'activité (plus de 60 jours)
export const cleanupOldActivityFeed = internalMutation({
  handler: async (ctx) => {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

    const oldActivities = await ctx.db
      .query("activityFeed")
      .filter((q) => q.lt(q.field("createdAt"), sixtyDaysAgo))
      .collect();

    let deleted = 0;
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
      deleted++;
    }

    return { deleted };
  },
});

// Archiver les challenges terminés depuis plus de 90 jours
export const archiveOldChallenges = internalMutation({
  handler: async (ctx) => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const oldChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.lt(q.field("endDate"), ninetyDaysAgo))
      .collect();

    let archived = 0;
    for (const challenge of oldChallenges) {
      if (challenge.status !== "archived") {
        await ctx.db.patch(challenge._id, { status: "archived" });
        archived++;
      }
    }

    return { archived };
  },
});
