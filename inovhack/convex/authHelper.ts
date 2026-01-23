/**
 * Authentication Helper
 * Validates that the authenticated user matches the userId being operated on
 *
 * CRITICAL SECURITY: This prevents users from performing actions as other users
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get the authenticated user's Convex userId from their Clerk session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // The subject is the Clerk user ID
  const clerkId = identity.subject;

  // Find the user in our database by their Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

  return user?._id || null;
}

/**
 * Verify that the authenticated user matches the provided userId
 * Throws an error if not authenticated or if the user doesn't match
 */
export async function verifyAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<void> {
  const authenticatedUserId = await getAuthenticatedUser(ctx);

  if (!authenticatedUserId) {
    throw new Error("Non connecté. Connecte-toi pour continuer.");
  }

  if (authenticatedUserId !== userId) {
    throw new Error("Action non autorisée.");
  }
}

/**
 * Verify that the authenticated user is an admin
 * Throws an error if not authenticated or not an admin
 */
export async function verifyAuthenticatedAdmin(
  ctx: QueryCtx | MutationCtx,
  adminId: Id<"users">
): Promise<void> {
  const authenticatedUserId = await getAuthenticatedUser(ctx);

  if (!authenticatedUserId) {
    throw new Error("Non connecté. Connecte-toi pour continuer.");
  }

  if (authenticatedUserId !== adminId) {
    throw new Error("Action non autorisée.");
  }

  // Verify the user is actually an admin
  const user = await ctx.db.get(adminId);
  if (!user?.isAdmin) {
    throw new Error("Droits administrateur requis.");
  }
}

/**
 * Get the authenticated user or throw an error
 * Use this when you need to ensure a user is logged in but don't need to match a specific userId
 */
export async function requireAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getAuthenticatedUser(ctx);

  if (!userId) {
    throw new Error("Non connecté. Connecte-toi pour continuer.");
  }

  return userId;
}
