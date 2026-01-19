import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Envoyer un message dans un pact
export const sendMessage = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Vérifier que le challenge existe
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Vérifier que l'utilisateur est participant ou créateur
    const isCreator = challenge.creatorId === args.userId;
    const participation = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("usertId", args.userId)
      )
      .first();

    if (!isCreator && !participation) {
      throw new Error("Vous devez participer à ce pact pour envoyer des messages");
    }

    // Créer le message
    return await ctx.db.insert("messages", {
      challengeId: args.challengeId,
      userId: args.userId,
      content: args.content,
      type: "text",
      createdAt: Date.now(),
    });
  },
});

// Récupérer les messages d'un pact
export const getMessages = query({
  args: {
    challengeId: v.id("challenges"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .order("desc")
      .take(limit);

    // Enrichir avec les infos utilisateur
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                profileImageUrl: user.profileImageUrl,
              }
            : null,
        };
      })
    );

    // Retourner dans l'ordre chronologique
    return enrichedMessages.reverse();
  },
});

// Envoyer un message système (ex: "X a rejoint le pact")
export const sendSystemMessage = mutation({
  args: {
    challengeId: v.id("challenges"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Créer un message système (pas de userId car c'est automatique)
    // On utilise le créateur du challenge comme "système"
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return;

    return await ctx.db.insert("messages", {
      challengeId: args.challengeId,
      userId: challenge.creatorId, // Utiliser le créateur comme fallback
      content: args.content,
      type: "system",
      createdAt: Date.now(),
    });
  },
});

// Compter les messages non lus (simplifié - basé sur timestamp)
export const getUnreadCount = query({
  args: {
    challengeId: v.id("challenges"),
    lastReadAt: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .filter((q) => q.gt(q.field("createdAt"), args.lastReadAt))
      .collect();

    return messages.length;
  },
});
