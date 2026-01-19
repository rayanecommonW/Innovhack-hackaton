/**
 * User Management & Profile
 * User CRUD, profile updates, image upload, blocking, reporting
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Créer un utilisateur (pour la démo)
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Vérifier si l'utilisateur existe déjà
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    // Créer l'utilisateur avec un solde initial de 100€ (démo)
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      balance: 100, // Solde initial pour la démo
      totalWins: 0,
      totalLosses: 0,
      createdAt: Date.now(),
    });
  },
});

// Récupérer un utilisateur par email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Récupérer un utilisateur par ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get current user profile with image URL
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get profile image URL if exists
    let profileImageUrl = user.profileImageUrl;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId) || undefined;
    }

    return {
      ...user,
      profileImageUrl,
    };
  },
});

// Get public profile (for viewing other users)
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get profile image URL
    let profileImageUrl = user.profileImageUrl;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId) || undefined;
    }

    // Get user badges
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const badges = await Promise.all(
      userBadges.map(async (ub) => {
        const badge = await ctx.db.get(ub.badgeId);
        return badge ? { ...badge, unlockedAt: ub.unlockedAt } : null;
      })
    );

    // Get participations stats
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .collect();

    const activePacts = participations.filter((p) => p.status === "active").length;

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImageUrl,
      balance: user.balance,
      totalWins: user.totalWins,
      totalLosses: user.totalLosses,
      currentStreak: user.currentStreak || 0,
      bestStreak: user.bestStreak || 0,
      totalEarnings: user.totalEarnings || 0,
      totalPacts: user.totalPacts || 0,
      successRate: user.successRate || 0,
      createdAt: user.createdAt,
      badges: badges.filter(Boolean),
      activePacts,
    };
  },
});

// Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return null;

    // Get profile image URL
    let profileImageUrl = user.profileImageUrl;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId) || undefined;
    }

    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImageUrl,
    };
  },
});

// Mettre à jour le solde d'un utilisateur
export const updateBalance = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(), // positif = ajouter, négatif = retirer
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const newBalance = user.balance + args.amount;
    if (newBalance < 0) throw new Error("Solde insuffisant");

    await ctx.db.patch(args.userId, { balance: newBalance });
    return newBalance;
  },
});

// Update profile (name, username, bio)
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Validate username uniqueness if changing
    if (updates.username) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", updates.username))
        .first();

      if (existing && existing._id !== userId) {
        throw new Error("Ce nom d'utilisateur est déjà pris");
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(updates.username)) {
        throw new Error("Le nom d'utilisateur doit contenir 3-20 caractères alphanumériques");
      }
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, string> = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.username !== undefined) cleanUpdates.username = updates.username;
    if (updates.bio !== undefined) cleanUpdates.bio = updates.bio;

    await ctx.db.patch(userId, cleanUpdates);

    return { success: true };
  },
});

// Generate upload URL for profile image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save profile image after upload
export const saveProfileImage = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    // Delete old image if exists
    if (user.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }

    // Get the URL
    const url = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(args.userId, {
      profileImageId: args.storageId,
      profileImageUrl: url || undefined,
    });

    return { success: true, url };
  },
});

// Remove profile image
export const removeProfileImage = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    if (user.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }

    await ctx.db.patch(args.userId, {
      profileImageId: undefined,
      profileImageUrl: undefined,
    });

    return { success: true };
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    enabled: v.boolean(),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      notificationsEnabled: args.enabled,
      pushToken: args.pushToken,
    });

    return { success: true };
  },
});

// Block a user
export const blockUser = mutation({
  args: {
    userId: v.id("users"),
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const blockedUsers = user.blockedUsers || [];

    if (!blockedUsers.includes(args.blockedUserId)) {
      blockedUsers.push(args.blockedUserId);
      await ctx.db.patch(args.userId, { blockedUsers });
    }

    // Remove friendship if exists
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.userId).eq("friendId", args.blockedUserId)
      )
      .first();

    if (friendship) {
      await ctx.db.delete(friendship._id);
    }

    // Check reverse friendship
    const reverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.blockedUserId).eq("friendId", args.userId)
      )
      .first();

    if (reverseFriendship) {
      await ctx.db.delete(reverseFriendship._id);
    }

    return { success: true };
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    userId: v.id("users"),
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const blockedUsers = (user.blockedUsers || []).filter(
      (id) => id !== args.blockedUserId
    );

    await ctx.db.patch(args.userId, { blockedUsers });

    return { success: true };
  },
});

// Get blocked users
export const getBlockedUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const blockedIds = user.blockedUsers || [];

    const blockedUsers = await Promise.all(
      blockedIds.map(async (id) => {
        const blocked = await ctx.db.get(id);
        if (!blocked) return null;

        let profileImageUrl = blocked.profileImageUrl;
        if (blocked.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(blocked.profileImageId) || undefined;
        }

        return {
          _id: blocked._id,
          name: blocked.name,
          username: blocked.username,
          profileImageUrl,
        };
      })
    );

    return blockedUsers.filter(Boolean);
  },
});

// Report a user
export const reportUser = mutation({
  args: {
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In a real app, this would store in a reports table
    // For now, we'll just log it
    console.log("User reported:", {
      reporter: args.reporterId,
      reported: args.reportedUserId,
      reason: args.reason,
      details: args.details,
    });

    return { success: true };
  },
});

// Search users
export const searchUsers = query({
  args: {
    query: v.string(),
    currentUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const searchQuery = args.query.toLowerCase();

    // Get all users (in production, use proper search index)
    const users = await ctx.db.query("users").collect();

    // Filter and map
    const results = users
      .filter((user) => {
        if (args.currentUserId && user._id === args.currentUserId) return false;
        if (user.isBlocked) return false;

        const nameMatch = user.name.toLowerCase().includes(searchQuery);
        const usernameMatch = user.username?.toLowerCase().includes(searchQuery);

        return nameMatch || usernameMatch;
      })
      .slice(0, limit);

    // Get profile images
    const usersWithImages = await Promise.all(
      results.map(async (user) => {
        let profileImageUrl = user.profileImageUrl;
        if (user.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(user.profileImageId) || undefined;
        }

        return {
          _id: user._id,
          name: user.name,
          username: user.username,
          profileImageUrl,
          totalWins: user.totalWins,
          successRate: user.successRate,
        };
      })
    );

    return usersWithImages;
  },
});

// Complete onboarding
export const completeOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      onboardingCompleted: true,
    });

    return { success: true };
  },
});

// Check if username is available
export const checkUsernameAvailable = query({
  args: {
    username: v.string(),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(args.username)) {
      return { available: false, reason: "Format invalide (3-20 caractères alphanumériques)" };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing && (!args.currentUserId || existing._id !== args.currentUserId)) {
      return { available: false, reason: "Déjà utilisé" };
    }

    return { available: true };
  },
});

// Ajouter des fonds (dépôt)
export const addFunds = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    method: v.string(), // "card", "crypto", "apple_pay", "google_pay"
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur non trouvé");
    if (args.amount <= 0) throw new Error("Montant invalide");

    // Créer la transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: "deposit",
      method: args.method,
      status: "completed",
      reference: args.reference,
      createdAt: Date.now(),
    });

    // Mettre à jour le solde
    const newBalance = user.balance + args.amount;
    await ctx.db.patch(args.userId, { balance: newBalance });

    return { newBalance, transactionId: args.reference };
  },
});

// Historique des transactions
export const getTransactions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});

// Lister tous les utilisateurs (pour la démo)
export const listUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Créer des utilisateurs de démo
export const seedDemoUsers = mutation({
  handler: async (ctx) => {
    const demoUsers = [
      { name: "Alice", email: "alice@demo.com" },
      { name: "Bob", email: "bob@demo.com" },
      { name: "Charlie", email: "charlie@demo.com" },
      { name: "Diana", email: "diana@demo.com" },
    ];

    const userIds = [];
    for (const user of demoUsers) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("users", {
          ...user,
          balance: 100,
          totalWins: 0,
          totalLosses: 0,
          createdAt: Date.now(),
        });
        userIds.push(id);
      } else {
        userIds.push(existing._id);
      }
    }
    return userIds;
  },
});
