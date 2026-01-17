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
        });
        userIds.push(id);
      } else {
        userIds.push(existing._id);
      }
    }
    return userIds;
  },
});
