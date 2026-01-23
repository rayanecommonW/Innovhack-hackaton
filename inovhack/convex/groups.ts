import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuthenticatedUser } from "./authHelper";

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new group
export const createGroup = mutation({
  args: {
    name: v.string(),
    creatorId: v.id("users"),
    memberIds: v.optional(v.array(v.id("users"))), // Optional friends to add
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le créateur
    await verifyAuthenticatedUser(ctx, args.creatorId);

    const inviteCode = generateInviteCode();

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      creatorId: args.creatorId,
      inviteCode,
      createdAt: Date.now(),
    });

    // Add creator as admin member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: args.creatorId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Add friends as members
    if (args.memberIds && args.memberIds.length > 0) {
      for (const memberId of args.memberIds) {
        // Don't add creator twice
        if (memberId !== args.creatorId) {
          await ctx.db.insert("groupMembers", {
            groupId,
            userId: memberId,
            role: "member",
            joinedAt: Date.now(),
          });
        }
      }
    }

    return { groupId, inviteCode };
  },
});

// Join a group by invite code
export const joinGroup = mutation({
  args: {
    inviteCode: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui rejoint
    await verifyAuthenticatedUser(ctx, args.userId);

    const group = await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();

    if (!group) {
      throw new Error("Groupe non trouvé");
    }

    // Check if already a member
    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", group._id).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      throw new Error("Tu es déjà membre de ce groupe");
    }

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    return group._id;
  },
});

// Get user's groups
export const getMyGroups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const group = await ctx.db.get(m.groupId);
        if (!group) return null;

        // Get member count
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", m.groupId))
          .collect();

        // Get active tasks
        const tasks = await ctx.db
          .query("groupTasks")
          .withIndex("by_group", (q) => q.eq("groupId", m.groupId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          ...group,
          role: m.role,
          memberCount: members.length,
          taskCount: tasks.length,
        };
      })
    );

    return groups.filter(Boolean);
  },
});

// Get group details with members
export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          ...m,
          name: user?.name || "Inconnu",
        };
      })
    );

    return { ...group, members };
  },
});

// Create a group task
export const createTask = mutation({
  args: {
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.string(), // "daily", "weekly", "monthly", "yearly"
    betAmount: v.number(),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le créateur
    await verifyAuthenticatedUser(ctx, args.creatorId);

    return await ctx.db.insert("groupTasks", {
      ...args,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

// Get group tasks
export const getGroupTasks = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("groupTasks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get progress for each task
    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        const members = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
          .collect();

        const progress = await Promise.all(
          members.map(async (member) => {
            const user = await ctx.db.get(member.userId);
            const taskProgress = await ctx.db
              .query("taskProgress")
              .withIndex("by_task_user", (q) =>
                q.eq("taskId", task._id).eq("userId", member.userId)
              )
              .order("desc")
              .first();

            return {
              userId: member.userId,
              userName: user?.name || "Inconnu",
              completed: taskProgress?.completed || false,
              proofUrl: taskProgress?.proofUrl || null,
              completedAt: taskProgress?.completedAt || null,
            };
          })
        );

        // Calculate potential gains/losses
        const completedCount = progress.filter((p) => p.completed).length;
        const failedCount = progress.filter((p) => !p.completed).length;
        const potentialGain = failedCount * task.betAmount;
        const potentialLoss = task.betAmount;

        return {
          ...task,
          progress,
          completedCount,
          failedCount,
          potentialGain,
          potentialLoss,
        };
      })
    );

    return tasksWithProgress;
  },
});

// Mark task as complete for a user
export const completeTask = mutation({
  args: {
    taskId: v.id("groupTasks"),
    userId: v.id("users"),
    proofUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui complète
    await verifyAuthenticatedUser(ctx, args.userId);

    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const periodStart = today.getTime();

    // Check if already completed for this period
    const existing = await ctx.db
      .query("taskProgress")
      .withIndex("by_task_user", (q) =>
        q.eq("taskId", args.taskId).eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("periodStart"), periodStart))
      .first();

    if (existing) {
      throw new Error("Tâche déjà complétée pour cette période");
    }

    return await ctx.db.insert("taskProgress", {
      taskId: args.taskId,
      userId: args.userId,
      periodStart,
      completed: true,
      proofUrl: args.proofUrl,
      completedAt: now,
    });
  },
});

// Get group by invite code
export const getGroupByCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .first();
  },
});

// Leave a group
export const leaveGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est celui qui quitte
    await verifyAuthenticatedUser(ctx, args.userId);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("Pas membre de ce groupe");
    }

    // Check for active pacts in this group
    const activePacts = await ctx.db
      .query("challenges")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    // Check if user has active participations in group pacts
    for (const pact of activePacts) {
      const participation = await ctx.db
        .query("participations")
        .withIndex("by_challenge_user", (q) =>
          q.eq("challengeId", pact._id).eq("usertId", args.userId)
        )
        .first();

      if (participation && participation.status === "active") {
        throw new Error("Tu as des pacts actifs dans ce groupe. Termine-les d'abord.");
      }
    }

    if (membership.role === "admin") {
      // Check if there are other admins
      const admins = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (admins.length === 1) {
        throw new Error("Tu dois promouvoir un autre admin avant de partir");
      }
    }

    await ctx.db.delete(membership._id);
  },
});

// Remove a member from group (admin only)
export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    adminId: v.id("users"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est l'admin
    await verifyAuthenticatedUser(ctx, args.adminId);

    // Check admin is actually admin
    const adminMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.adminId)
      )
      .first();

    if (!adminMembership || adminMembership.role !== "admin") {
      throw new Error("Seuls les admins peuvent exclure des membres");
    }

    // Can't remove yourself this way
    if (args.adminId === args.memberId) {
      throw new Error("Utilise 'Quitter le groupe' pour te retirer");
    }

    // Check member exists
    const memberMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.memberId)
      )
      .first();

    if (!memberMembership) {
      throw new Error("Ce membre n'est pas dans le groupe");
    }

    // Check for active pacts in this group
    const activePacts = await ctx.db
      .query("challenges")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    // Check if member has active participations
    for (const pact of activePacts) {
      const participation = await ctx.db
        .query("participations")
        .withIndex("by_challenge_user", (q) =>
          q.eq("challengeId", pact._id).eq("usertId", args.memberId)
        )
        .first();

      if (participation && participation.status === "active") {
        throw new Error("Ce membre a des pacts actifs. Attends qu'ils soient terminés.");
      }
    }

    await ctx.db.delete(memberMembership._id);
    return { success: true };
  },
});
