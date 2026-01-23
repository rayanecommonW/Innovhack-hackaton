import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all conversations for a user
export const getConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all messages where user is sender or receiver
    const sentMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();

    const receivedMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();

    // Combine and find unique conversation partners
    const allMessages = [...sentMessages, ...receivedMessages];
    const partnerMap = new Map<string, typeof allMessages[0]>();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === args.userId ? msg.receiverId : msg.senderId;
      const partnerIdStr = partnerId.toString();

      if (!partnerMap.has(partnerIdStr) || partnerMap.get(partnerIdStr)!.createdAt < msg.createdAt) {
        partnerMap.set(partnerIdStr, msg);
      }
    }

    // Get user details for each conversation
    const conversations = await Promise.all(
      Array.from(partnerMap.entries()).map(async ([partnerIdStr, lastMessage]) => {
        const partnerId = lastMessage.senderId === args.userId ? lastMessage.receiverId : lastMessage.senderId;
        const partner = await ctx.db.get(partnerId);

        // Get profile image
        let partnerWithImage = partner;
        if (partner?.profileImageId) {
          const imageUrl = await ctx.storage.getUrl(partner.profileImageId);
          partnerWithImage = { ...partner, profileImageUrl: imageUrl || partner.profileImageUrl };
        }

        // Count unread messages
        const unreadCount = receivedMessages.filter(
          (m) => m.senderId === partnerId && !m.read
        ).length;

        return {
          partnerId,
          partner: partnerWithImage,
          lastMessage: lastMessage.content,
          lastMessageAt: lastMessage.createdAt,
          unreadCount,
          isFromMe: lastMessage.senderId === args.userId,
        };
      })
    );

    // Sort by last message time
    return conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});

// Get messages with a specific user
export const getMessages = query({
  args: {
    userId: v.id("users"),
    partnerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get messages between the two users
    const sentMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.userId).eq("receiverId", args.partnerId)
      )
      .collect();

    const receivedMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.partnerId).eq("receiverId", args.userId)
      )
      .collect();

    // Combine and sort by time
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-limit);

    // Get user details
    const user = await ctx.db.get(args.userId);
    const partner = await ctx.db.get(args.partnerId);

    // Get profile images
    let userWithImage = user;
    if (user?.profileImageId) {
      const imageUrl = await ctx.storage.getUrl(user.profileImageId);
      userWithImage = { ...user, profileImageUrl: imageUrl || user.profileImageUrl };
    }

    let partnerWithImage = partner;
    if (partner?.profileImageId) {
      const imageUrl = await ctx.storage.getUrl(partner.profileImageId);
      partnerWithImage = { ...partner, profileImageUrl: imageUrl || partner.profileImageUrl };
    }

    return {
      messages: allMessages.map((m) => ({
        ...m,
        isFromMe: m.senderId === args.userId,
        sender: m.senderId === args.userId ? userWithImage : partnerWithImage,
      })),
      partner: partnerWithImage,
    };
  },
});

// Send a direct message
export const sendMessage = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    type: v.optional(v.string()),
    relatedProofId: v.optional(v.id("proofs")),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("directMessages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      type: args.type || "text",
      relatedProofId: args.relatedProofId,
      read: false,
      createdAt: Date.now(),
    });

    // Create notification for receiver
    const sender = await ctx.db.get(args.senderId);
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "direct_message",
      title: "Nouveau message",
      body: `${sender?.name || "Quelqu'un"} t'a envoyé un message`,
      data: JSON.stringify({ senderId: args.senderId, messageId }),
      read: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_sender_receiver", (q) =>
        q.eq("senderId", args.partnerId).eq("receiverId", args.userId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const msg of unreadMessages) {
      await ctx.db.patch(msg._id, { read: true });
    }

    return { markedAsRead: unreadMessages.length };
  },
});

// Get unread messages count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unreadMessages.length;
  },
});

// Get all proof-related conversations for organizers
export const getProofConversations = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all challenges by this organizer
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.organizerId))
      .collect();

    const challengeIds = challenges.map((c) => c._id);

    // Get all proofs for these challenges that are pending
    const allProofs = await ctx.db
      .query("proofs")
      .withIndex("by_organizer_validation", (q) => q.eq("organizerValidation", "pending"))
      .collect();

    const relevantProofs = allProofs.filter((p) => challengeIds.includes(p.challengeId));

    // For each proof, get the user and any messages
    const proofConversations = await Promise.all(
      relevantProofs.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        const challenge = await ctx.db.get(proof.challengeId);

        // Get profile image
        let userWithImage = user;
        if (user?.profileImageId) {
          const imageUrl = await ctx.storage.getUrl(user.profileImageId);
          userWithImage = { ...user, profileImageUrl: imageUrl || user.profileImageUrl };
        }

        // Get messages related to this proof
        const messages = await ctx.db
          .query("proofMessages")
          .withIndex("by_proof", (q) => q.eq("proofId", proof._id))
          .collect();

        const lastMessage = messages.sort((a, b) => b.createdAt - a.createdAt)[0];

        return {
          proofId: proof._id,
          proof,
          user: userWithImage,
          challenge,
          messageCount: messages.length,
          lastMessageAt: lastMessage?.createdAt || proof.submittedAt,
          lastMessage: lastMessage?.message || "Preuve soumise",
        };
      })
    );

    return proofConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});
