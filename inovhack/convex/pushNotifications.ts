/**
 * Push Notifications - Server-side sending
 * Uses Expo Push API to send notifications to users
 */

import { action, internalAction, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Send push notification via Expo
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    channelId: v.optional(v.string()),
    badge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const message = {
      to: args.pushToken,
      sound: "default" as const,
      title: args.title,
      body: args.body,
      data: args.data || {},
      channelId: args.channelId || "default",
      badge: args.badge,
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === "error") {
        console.error("Push notification error:", result.data.message);
        return { success: false, error: result.data.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send push notification:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Send notification to a specific user (internal)
export const notifyUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    type: v.string(), // "challenge_reminder", "proof_validated", "friend_request", etc.
  },
  handler: async (ctx, args) => {
    // Get user's push token
    const user = await ctx.runQuery(internal.pushNotifications.getUserPushToken, {
      userId: args.userId,
    });

    if (!user?.pushToken || !user.notificationsEnabled) {
      console.log("User has no push token or notifications disabled");
      return { success: false, reason: "no_token_or_disabled" };
    }

    // Send the notification
    return await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken: user.pushToken,
      title: args.title,
      body: args.body,
      data: {
        ...args.data,
        type: args.type,
      },
    });
  },
});

// Internal query to get user push token
export const getUserPushToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      pushToken: user.pushToken,
      notificationsEnabled: user.notificationsEnabled ?? true,
    };
  },
});

// Send notification to multiple users
export const notifyUsers = internalAction({
  args: {
    userIds: v.array(v.id("users")),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.userIds.map((userId) =>
        ctx.runAction(internal.pushNotifications.notifyUser, {
          userId,
          title: args.title,
          body: args.body,
          data: args.data,
          type: args.type,
        })
      )
    );

    return {
      sent: results.filter((r: any) => r.success).length,
      failed: results.filter((r: any) => !r.success).length,
    };
  },
});

// Schedule daily challenge reminders
export const sendChallengeReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active participations that need proof today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // In a real app, we'd query participations that:
    // 1. Are active
    // 2. Haven't submitted proof today
    // 3. Have users with push tokens

    // For now, this is a placeholder for the cron job
    console.log("Running challenge reminders cron...");
    return { processed: 0 };
  },
});

// Notification types helper functions

// Challenge reminder
export const sendChallengeReminder = internalAction({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    challengeTitle: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "N'oublie pas ton defi !",
      body: `Soumets ta preuve pour "${args.challengeTitle}"`,
      data: { challengeId: args.challengeId },
      type: "challenge_reminder",
    });
  },
});

// Proof validated notification
export const sendProofValidatedNotification = internalAction({
  args: {
    userId: v.id("users"),
    proofId: v.id("proofs"),
    challengeTitle: v.string(),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const title = args.approved ? "Preuve validee !" : "Preuve refusee";
    const body = args.approved
      ? `Ta preuve pour "${args.challengeTitle}" a ete validee`
      : `Ta preuve pour "${args.challengeTitle}" n'a pas ete validee`;

    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title,
      body,
      data: { proofId: args.proofId },
      type: "proof_validated",
    });
  },
});

// Friend request notification
export const sendFriendRequestNotification = internalAction({
  args: {
    userId: v.id("users"),
    fromUserId: v.id("users"),
    fromUserName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "Nouvelle demande d'ami",
      body: `${args.fromUserName} veut devenir ton ami`,
      data: { fromUserId: args.fromUserId },
      type: "friend_request",
    });
  },
});

// Challenge won notification
export const sendChallengeWonNotification = internalAction({
  args: {
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    challengeTitle: v.string(),
    amountWon: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "Felicitations !",
      body: `Tu as gagne ${args.amountWon}€ sur "${args.challengeTitle}"`,
      data: { challengeId: args.challengeId },
      type: "challenge_won",
    });
  },
});

// New badge notification
export const sendBadgeUnlockedNotification = internalAction({
  args: {
    userId: v.id("users"),
    badgeName: v.string(),
    badgeDescription: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "Nouveau badge debloque !",
      body: `${args.badgeName}: ${args.badgeDescription}`,
      data: {},
      type: "badge_unlocked",
    });
  },
});

// Comment notification
export const sendCommentNotification = internalAction({
  args: {
    userId: v.id("users"),
    proofId: v.id("proofs"),
    commenterName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "Nouveau commentaire",
      body: `${args.commenterName} a commente ta preuve`,
      data: { proofId: args.proofId },
      type: "comment",
    });
  },
});

// Reaction notification
export const sendReactionNotification = internalAction({
  args: {
    userId: v.id("users"),
    proofId: v.id("proofs"),
    reactorName: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.pushNotifications.notifyUser, {
      userId: args.userId,
      title: "Nouvelle reaction",
      body: `${args.reactorName} a reagi ${args.emoji} a ta preuve`,
      data: { proofId: args.proofId },
      type: "reaction",
    });
  },
});
