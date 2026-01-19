import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Récupérer les notifications d'un utilisateur
export const getNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);
    }

    return notifications;
  },
});

// Nombre de notifications non lues
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    return unread.length;
  },
});

// Marquer une notification comme lue
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Marquer toutes les notifications comme lues
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { markedAsRead: unread.length };
  },
});

// Supprimer une notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Créer une notification (interne)
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      read: false,
      createdAt: Date.now(),
    });
  },
});

// Créer des rappels pour les pacts qui se terminent bientôt
export const createDeadlineReminders = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const in24Hours = now + 24 * 60 * 60 * 1000;
    const in1Hour = now + 60 * 60 * 1000;

    // Récupérer les challenges actifs qui se terminent dans les 24h
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const endingSoon = challenges.filter(
      (c) => c.endDate > now && c.endDate <= in24Hours
    );

    for (const challenge of endingSoon) {
      // Récupérer les participants qui n'ont pas encore soumis de preuve
      const participations = await ctx.db
        .query("participations")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
        .collect();

      const pendingParticipants = participations.filter(
        (p) => p.status === "active" || p.status === "pending_proof"
      );

      for (const participation of pendingParticipants) {
        const hoursLeft = Math.round((challenge.endDate - now) / (60 * 60 * 1000));

        // Éviter les doublons - vérifier si une notification similaire existe déjà
        const existingNotification = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", participation.usertId))
          .filter((q) =>
            q.and(
              q.eq(q.field("type"), "deadline_reminder"),
              q.gte(q.field("createdAt"), now - 12 * 60 * 60 * 1000) // Pas de doublon dans les 12h
            )
          )
          .first();

        if (!existingNotification) {
          await ctx.db.insert("notifications", {
            userId: participation.usertId,
            type: "deadline_reminder",
            title: hoursLeft <= 1 ? "⚠️ Dernière heure !" : `⏰ Plus que ${hoursLeft}h`,
            body: `N'oublie pas de soumettre ta preuve pour "${challenge.title}"`,
            data: JSON.stringify({ challengeId: challenge._id }),
            read: false,
            createdAt: now,
            scheduledFor: challenge.endDate,
          });
        }
      }
    }
  },
});

// Enregistrer le token push d'un utilisateur
export const registerPushToken = mutation({
  args: {
    userId: v.id("users"),
    pushToken: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pushToken: args.pushToken,
      notificationsEnabled: true,
    });
  },
});

// Désactiver les notifications
export const disableNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      notificationsEnabled: false,
    });
  },
});

// Récupérer les préférences de notification
export const getNotificationPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return {
      enabled: user?.notificationsEnabled ?? true,
      hasPushToken: !!user?.pushToken,
    };
  },
});
