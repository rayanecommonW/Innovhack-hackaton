import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Search users by username
export const searchUsers = query({
  args: {
    query: v.string(),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.query.toLowerCase();

    // Filter users matching the search query (by name or username)
    const matchedUsers = allUsers.filter((user) => {
      if (user._id === args.currentUserId) return false;
      const nameMatch = user.name.toLowerCase().includes(searchLower);
      const usernameMatch = user.username?.toLowerCase().includes(searchLower);
      return nameMatch || usernameMatch;
    });

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      matchedUsers.slice(0, 10).map(async (user) => {
        const friendship = await ctx.db
          .query("friendships")
          .withIndex("by_user_friend", (q) =>
            q.eq("userId", args.currentUserId).eq("friendId", user._id)
          )
          .first();

        const reverseFriendship = await ctx.db
          .query("friendships")
          .withIndex("by_user_friend", (q) =>
            q.eq("userId", user._id).eq("friendId", args.currentUserId)
          )
          .first();

        let status = "none";
        if (friendship?.status === "accepted" || reverseFriendship?.status === "accepted") {
          status = "friend";
        } else if (friendship?.status === "pending") {
          status = "pending_sent";
        } else if (reverseFriendship?.status === "pending") {
          status = "pending_received";
        }

        return {
          _id: user._id,
          name: user.name,
          username: user.username,
          status,
        };
      })
    );

    return usersWithStatus;
  },
});

// Get friend list
export const getFriends = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get friendships where user is the initiator and status is accepted
    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get friendships where user is the receiver and status is accepted
    const receivedFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get unique friend IDs
    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    // Remove duplicates
    const uniqueFriendIds = [...new Set(friendIds.map((id) => id.toString()))];

    // Get user details for each friend
    const friends = await Promise.all(
      uniqueFriendIds.map(async (friendId) => {
        const user = await ctx.db.get(friendId as any);
        if (!user) return null;
        return {
          _id: user._id,
          name: user.name,
          username: user.username,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

// Get pending friend requests (received)
export const getPendingRequests = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const pendingRequests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        if (!user) return null;
        return {
          _id: request._id,
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
          },
          createdAt: request.createdAt,
        };
      })
    );

    return requestsWithUsers.filter(Boolean);
  },
});

// Send friend request
export const sendFriendRequest = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.userId === args.friendId) {
      throw new Error("Tu ne peux pas t'ajouter toi-même");
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.userId).eq("friendId", args.friendId)
      )
      .first();

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        throw new Error("Vous êtes déjà amis");
      }
      if (existingFriendship.status === "pending") {
        throw new Error("Demande déjà envoyée");
      }
    }

    // Check if reverse friendship exists
    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", args.userId)
      )
      .first();

    if (reverseFriendship?.status === "pending") {
      // Auto-accept if they already sent a request
      await ctx.db.patch(reverseFriendship._id, { status: "accepted" });
      return { status: "accepted" };
    }

    if (reverseFriendship?.status === "accepted") {
      throw new Error("Vous êtes déjà amis");
    }

    // Create new friend request
    await ctx.db.insert("friendships", {
      userId: args.userId,
      friendId: args.friendId,
      status: "pending",
      createdAt: Date.now(),
    });

    return { status: "pending" };
  },
});

// Accept friend request
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendships"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Demande introuvable");
    }

    if (request.friendId !== args.userId) {
      throw new Error("Non autorisé");
    }

    if (request.status !== "pending") {
      throw new Error("Demande déjà traitée");
    }

    await ctx.db.patch(args.requestId, { status: "accepted" });
    return { success: true };
  },
});

// Reject friend request
export const rejectFriendRequest = mutation({
  args: {
    requestId: v.id("friendships"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Demande introuvable");
    }

    if (request.friendId !== args.userId) {
      throw new Error("Non autorisé");
    }

    await ctx.db.delete(args.requestId);
    return { success: true };
  },
});

// Remove friend
export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find and delete the friendship (could be in either direction)
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.userId).eq("friendId", args.friendId)
      )
      .first();

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", args.userId)
      )
      .first();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }

    return { success: true };
  },
});

// Set username
export const setUsername = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanUsername = args.username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      throw new Error("Le pseudo doit faire au moins 3 caractères");
    }

    if (cleanUsername.length > 20) {
      throw new Error("Le pseudo doit faire maximum 20 caractères");
    }

    // Check if username is already taken
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", cleanUsername))
      .first();

    if (existing && existing._id !== args.userId) {
      throw new Error("Ce pseudo est déjà pris");
    }

    await ctx.db.patch(args.userId, { username: cleanUsername });
    return { username: cleanUsername };
  },
});

// Get friends' challenges
export const getFriendsChallenges = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all accepted friendships
    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const receivedFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    if (friendIds.length === 0) {
      return [];
    }

    // Get participations of friends
    const friendParticipations = await Promise.all(
      friendIds.map(async (friendId) => {
        return ctx.db
          .query("participations")
          .withIndex("by_user", (q) => q.eq("usertId", friendId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
      })
    );

    const allParticipations = friendParticipations.flat();
    const challengeIds = [...new Set(allParticipations.map((p) => p.challengeId))];

    // Get challenge details
    const challenges = await Promise.all(
      challengeIds.slice(0, 20).map(async (challengeId) => {
        const challenge = await ctx.db.get(challengeId);
        if (!challenge || challenge.status !== "active") return null;

        // Count friends participating
        const friendsInChallenge = allParticipations.filter(
          (p) => p.challengeId === challengeId
        ).length;

        return {
          ...challenge,
          friendsCount: friendsInChallenge,
        };
      })
    );

    return challenges.filter(Boolean);
  },
});
