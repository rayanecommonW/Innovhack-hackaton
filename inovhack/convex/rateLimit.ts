/**
 * Rate Limiting - Protection contre les abus
 *
 * Limite le nombre de requêtes par utilisateur par minute
 * Utilise une table Convex pour tracker les requêtes
 */

import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Configuration des limites par action
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  // Auth
  "auth.login": { maxRequests: 5, windowMs: 60000 }, // 5 tentatives/min
  "auth.register": { maxRequests: 3, windowMs: 60000 }, // 3 inscriptions/min

  // Challenges
  "challenge.create": { maxRequests: 5, windowMs: 60000 }, // 5 créations/min
  "challenge.join": { maxRequests: 10, windowMs: 60000 }, // 10 joins/min

  // Preuves
  "proof.submit": { maxRequests: 10, windowMs: 60000 }, // 10 soumissions/min

  // Paiements
  "payment.deposit": { maxRequests: 3, windowMs: 60000 }, // 3 dépôts/min
  "payment.withdraw": { maxRequests: 2, windowMs: 60000 }, // 2 retraits/min

  // Social
  "friend.add": { maxRequests: 20, windowMs: 60000 }, // 20 ajouts/min
  "dispute.create": { maxRequests: 3, windowMs: 300000 }, // 3 disputes/5min

  // Default
  "default": { maxRequests: 60, windowMs: 60000 }, // 60 req/min par défaut
};

/**
 * Vérifier si une action est rate-limitée
 * Retourne true si la requête est autorisée, false si limitée
 */
export const checkRateLimit = internalMutation({
  args: {
    identifier: v.string(), // userId ou IP
    action: v.string(), // Nom de l'action
  },
  handler: async (ctx, args): Promise<{ allowed: boolean; retryAfter?: number }> => {
    const now = Date.now();
    const limits = RATE_LIMITS[args.action] || RATE_LIMITS["default"];

    // Nettoyer les anciennes entrées (> 5 min)
    const oldEntries = await ctx.db
      .query("rateLimits")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), now - 300000))
      .collect();

    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }

    // Récupérer les requêtes récentes pour cet utilisateur/action
    const recentRequests = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_action", (q) =>
        q.eq("identifier", args.identifier).eq("action", args.action)
      )
      .filter((q) => q.gte(q.field("timestamp"), now - limits.windowMs))
      .collect();

    // Vérifier si la limite est atteinte
    if (recentRequests.length >= limits.maxRequests) {
      const oldestRequest = recentRequests[0];
      const retryAfter = oldestRequest.timestamp + limits.windowMs - now;
      return { allowed: false, retryAfter: Math.ceil(retryAfter / 1000) };
    }

    // Enregistrer cette requête
    await ctx.db.insert("rateLimits", {
      identifier: args.identifier,
      action: args.action,
      timestamp: now,
    });

    return { allowed: true };
  },
});

/**
 * Helper pour vérifier le rate limit dans les mutations
 * Note: Cette fonction doit être utilisée INLINE dans les mutations car
 * Convex ne supporte pas les appels de mutation depuis des fonctions helper.
 *
 * Usage dans une mutation:
 * const limits = getRateLimits("payment.deposit");
 * const allowed = await checkAndRecordRequest(ctx, userId, "payment.deposit", limits);
 * if (!allowed.allowed) throw new Error(`Trop de requêtes. Réessaye dans ${allowed.retryAfter}s`);
 */
export function getRateLimits(action: string): { maxRequests: number; windowMs: number } {
  return RATE_LIMITS[action] || RATE_LIMITS["default"];
}

/**
 * Check and record a request - to be used directly in mutations
 * Returns the same result as checkRateLimit but can be called directly
 */
export async function checkAndRecordRequest(
  ctx: any,
  identifier: string,
  action: string,
  limits?: { maxRequests: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const effectiveLimits = limits || RATE_LIMITS[action] || RATE_LIMITS["default"];

  // Nettoyer les anciennes entrées (> 5 min)
  const oldEntries = await ctx.db
    .query("rateLimits")
    .withIndex("by_timestamp")
    .filter((q: any) => q.lt(q.field("timestamp"), now - 300000))
    .take(100); // Limit cleanup to avoid timeouts

  for (const entry of oldEntries) {
    await ctx.db.delete(entry._id);
  }

  // Récupérer les requêtes récentes pour cet utilisateur/action
  const recentRequests = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q: any) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .filter((q: any) => q.gte(q.field("timestamp"), now - effectiveLimits.windowMs))
    .collect();

  // Vérifier si la limite est atteinte
  if (recentRequests.length >= effectiveLimits.maxRequests) {
    const oldestRequest = recentRequests[0];
    const retryAfter = oldestRequest.timestamp + effectiveLimits.windowMs - now;
    return { allowed: false, retryAfter: Math.ceil(retryAfter / 1000) };
  }

  // Enregistrer cette requête
  await ctx.db.insert("rateLimits", {
    identifier,
    action,
    timestamp: now,
  });

  return { allowed: true };
}

/**
 * Exported rate limits for reference
 */
export const EXPORTED_RATE_LIMITS = RATE_LIMITS;
