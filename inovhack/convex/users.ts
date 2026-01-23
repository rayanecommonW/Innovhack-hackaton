/**
 * User Management & Profile
 * User CRUD, profile updates, image upload, blocking, reporting
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { verifyAuthenticatedUser, requireAuthenticatedUser } from "./authHelper";

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

    // Note: balance intentionally excluded from public profile for privacy
    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImageUrl,
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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui bloque
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui débloque
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui signale
    await verifyAuthenticatedUser(ctx, args.reporterId);

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

// Complete onboarding with legal acceptance tracking
export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
    termsAccepted: v.optional(v.boolean()),
    privacyAccepted: v.optional(v.boolean()),
    ageVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui complète
    await verifyAuthenticatedUser(ctx, args.userId);

    const now = Date.now();
    const updates: Record<string, any> = {
      onboardingCompleted: true,
    };

    // Track legal acceptance timestamps
    if (args.termsAccepted) {
      updates.termsAcceptedAt = now;
    }
    if (args.privacyAccepted) {
      updates.privacyAcceptedAt = now;
    }
    if (args.ageVerified) {
      updates.ageVerified = true;
      updates.ageVerifiedAt = now;
    }

    await ctx.db.patch(args.userId, updates);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui ajoute des fonds
    await verifyAuthenticatedUser(ctx, args.userId);

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

/**
 * Get or create user from Clerk authentication
 * Called when user signs in via Clerk (Google, Apple, Email)
 */
export const getOrCreateUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profileImageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    ageVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // First, try to find by Clerk ID
    const existingByClerk = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingByClerk) {
      // Update profile image if changed
      if (args.profileImageUrl && args.profileImageUrl !== existingByClerk.profileImageUrl) {
        await ctx.db.patch(existingByClerk._id, {
          profileImageUrl: args.profileImageUrl,
        });
      }
      return existingByClerk._id;
    }

    // Then, try to find by email (for existing users migrating to Clerk)
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      // Link existing account to Clerk
      await ctx.db.patch(existingByEmail._id, {
        clerkId: args.clerkId,
        profileImageUrl: args.profileImageUrl || existingByEmail.profileImageUrl,
      });
      return existingByEmail._id;
    }

    // Validate username if provided
    let validUsername: string | undefined;
    if (args.username) {
      const normalizedUsername = args.username.toLowerCase().trim();
      if (/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
        // Check if username is available
        const existingUsername = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
          .first();
        if (!existingUsername) {
          validUsername = normalizedUsername;
        }
      }
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      username: validUsername,
      profileImageUrl: args.profileImageUrl,
      balance: 0, // No free money for real accounts
      totalWins: 0,
      totalLosses: 0,
      createdAt: Date.now(),
      onboardingCompleted: false,
      // Age verification
      birthDate: args.birthDate,
      ageVerified: args.ageVerified || false,
      ageVerifiedAt: args.ageVerified ? Date.now() : undefined,
    });

    return userId;
  },
});

/**
 * Delete user account data from Convex (internal mutation)
 */
export const deleteAccountData = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui supprime son compte
    await verifyAuthenticatedUser(ctx, args.userId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Note: Balance check removed - no real money in the app yet
    // When real payments are implemented, uncomment this:
    // if (user.balance > 0) {
    //   throw new Error(`Vous avez encore ${user.balance.toFixed(2)}€ sur votre compte. Retirez votre argent avant de supprimer votre compte.`);
    // }

    // Check for active participations
    const activeParticipations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeParticipations.length > 0) {
      throw new Error(`Vous avez ${activeParticipations.length} pact(s) actif(s). Terminez-les avant de supprimer votre compte.`);
    }

    // Store clerkId before deleting
    const clerkId = user.clerkId;

    // Delete user's data

    // 1. Delete friendships
    const friendships1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const f of friendships1) {
      await ctx.db.delete(f._id);
    }

    const friendships2 = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .collect();
    for (const f of friendships2) {
      await ctx.db.delete(f._id);
    }

    // 2. Delete notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    // 3. Delete activity feed entries
    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const a of activities) {
      await ctx.db.delete(a._id);
    }

    // 4. Delete proofs
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const p of proofs) {
      await ctx.db.delete(p._id);
    }

    // 5. Delete old participations (not active)
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .collect();
    for (const p of participations) {
      await ctx.db.delete(p._id);
    }

    // 6. Delete transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const t of transactions) {
      await ctx.db.delete(t._id);
    }

    // 7. Delete user badges
    const badges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const b of badges) {
      await ctx.db.delete(b._id);
    }

    // 8. Finally delete the user
    await ctx.db.delete(args.userId);

    return { success: true, clerkId };
  },
});

/**
 * Delete user account completely (action that also deletes from Clerk)
 */
export const deleteAccount = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // First delete from Convex and get clerkId
    const result = await ctx.runMutation(api.users.deleteAccountData, {
      userId: args.userId,
    });

    // Then delete from Clerk if clerkId exists
    if (result.clerkId) {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (clerkSecretKey) {
        try {
          const response = await fetch(
            `https://api.clerk.com/v1/users/${result.clerkId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${clerkSecretKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error("Failed to delete Clerk user:", await response.text());
          }
        } catch (error) {
          console.error("Error deleting Clerk user:", error);
        }
      }
    }

    return { success: true };
  },
});

/**
 * Get user by Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

/**
 * Update user fields (flexible)
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui modifie
    await verifyAuthenticatedUser(ctx, args.userId);

    const { userId, ...updates } = args;

    // Validate username if provided
    if (updates.username) {
      const normalizedUsername = updates.username.toLowerCase().trim();

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
        throw new Error("Pseudo invalide (3-20 caractères, lettres/chiffres/underscore)");
      }

      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
        .first();

      if (existing && existing._id !== userId) {
        throw new Error("Ce pseudo est déjà pris");
      }

      updates.username = normalizedUsername;
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(userId, cleanUpdates);
    }

    return { success: true };
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
