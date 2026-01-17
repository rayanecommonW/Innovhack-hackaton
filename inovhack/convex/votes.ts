import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Vote on a proof (approve or veto)
export const voteOnProof = mutation({
  args: {
    proofId: v.id("proofs"),
    voterId: v.id("users"),
    voteType: v.string(), // "approve" or "veto"
  },
  handler: async (ctx, args) => {
    // Get the proof to find the challengeId
    const proof = await ctx.db.get(args.proofId);
    if (!proof) {
      throw new Error("Proof not found");
    }

    // Check if user already voted on this proof
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_proof_voter", (q) =>
        q.eq("proofId", args.proofId).eq("voterId", args.voterId)
      )
      .first();

    if (existingVote) {
      throw new Error("You have already voted on this proof");
    }

    // Check that voter is not the proof submitter
    if (proof.userId === args.voterId) {
      throw new Error("You cannot vote on your own proof");
    }

    // Create the vote
    await ctx.db.insert("votes", {
      proofId: args.proofId,
      voterId: args.voterId,
      challengeId: proof.challengeId,
      voteType: args.voteType,
      createdAt: Date.now(),
    });

    // Update proof vote counts
    const currentApproves = proof.approveCount || 0;
    const currentVetos = proof.vetoCount || 0;

    if (args.voteType === "approve") {
      await ctx.db.patch(args.proofId, {
        approveCount: currentApproves + 1,
      });
    } else if (args.voteType === "veto") {
      await ctx.db.patch(args.proofId, {
        vetoCount: currentVetos + 1,
      });
    }

    // Check if proof should be validated or rejected
    // Rule: 1 veto = rejection, majority approves = validated
    const newVetoCount = args.voteType === "veto" ? currentVetos + 1 : currentVetos;
    const newApproveCount = args.voteType === "approve" ? currentApproves + 1 : currentApproves;

    // Get total participants in this challenge (excluding proof submitter)
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_challenge", (q) => q.eq("challengeId", proof.challengeId))
      .collect();

    const otherParticipants = participations.filter(
      (p) => p.usertId !== proof.userId
    ).length;

    // Veto rule: 1 veto = rejection
    if (newVetoCount >= 1) {
      await ctx.db.patch(args.proofId, {
        communityValidation: "rejected",
        validatedAt: Date.now(),
      });
      return { status: "rejected", reason: "veto" };
    }

    // Majority rule: if more than half approved
    const majorityThreshold = Math.ceil(otherParticipants / 2);
    if (newApproveCount >= majorityThreshold && otherParticipants > 0) {
      await ctx.db.patch(args.proofId, {
        communityValidation: "approved",
        validatedAt: Date.now(),
      });

      // Mark participation as won
      const participation = await ctx.db.get(proof.participationId);
      if (participation) {
        await ctx.db.patch(proof.participationId, { status: "won" });

        // Add winnings to user balance
        const user = await ctx.db.get(proof.userId);
        if (user) {
          // Get challenge for potential sponsor reward
          const challenge = await ctx.db.get(proof.challengeId);
          const sponsorBonus = challenge?.sponsorReward || 0;
          const winAmount = participation.betAmount * 2 + sponsorBonus;

          await ctx.db.patch(proof.userId, {
            balance: user.balance + winAmount,
            totalWins: user.totalWins + 1,
          });

          // Create reward record
          await ctx.db.insert("rewards", {
            challengeId: proof.challengeId,
            userId: proof.userId,
            amount: winAmount,
            promoCode: challenge?.sponsorPromoCode,
            promoSponsor: challenge?.sponsorName,
            createdAt: Date.now(),
          });
        }
      }

      return { status: "approved", reason: "majority" };
    }

    return { status: "pending", votesNeeded: majorityThreshold - newApproveCount };
  },
});

// Get all votes for a proof
export const getVotesForProof = query({
  args: { proofId: v.id("proofs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .collect();
  },
});

// Check if user has voted on a proof
export const hasUserVoted = query({
  args: {
    proofId: v.id("proofs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_proof_voter", (q) =>
        q.eq("proofId", args.proofId).eq("voterId", args.userId)
      )
      .first();
    return vote !== null;
  },
});

// Get proofs pending community validation for a challenge
export const getPendingProofsForChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    // Filter to only pending community validation
    const pendingProofs = proofs.filter(
      (p) => p.communityValidation === "pending" || !p.communityValidation
    );

    // Enrich with user info
    const enrichedProofs = await Promise.all(
      pendingProofs.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        return {
          ...proof,
          userName: user?.name || "Anonymous",
        };
      })
    );

    return enrichedProofs;
  },
});

// Get all proofs that a user can vote on (from their participations)
export const getProofsToVote = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's active participations
    const participations = await ctx.db
      .query("participations")
      .withIndex("by_user", (q) => q.eq("usertId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const challengeIds = participations.map((p) => p.challengeId);

    // Get all proofs from these challenges that need voting
    const allProofs: any[] = [];

    for (const challengeId of challengeIds) {
      const proofs = await ctx.db
        .query("proofs")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
        .collect();

      // Filter: pending validation, not from this user
      const votableProofs = proofs.filter(
        (p) =>
          p.userId !== args.userId &&
          (p.communityValidation === "pending" || !p.communityValidation)
      );

      // Check if user already voted
      for (const proof of votableProofs) {
        const hasVoted = await ctx.db
          .query("votes")
          .withIndex("by_proof_voter", (q) =>
            q.eq("proofId", proof._id).eq("voterId", args.userId)
          )
          .first();

        if (!hasVoted) {
          // Enrich with user and challenge info
          const user = await ctx.db.get(proof.userId);
          const challenge = await ctx.db.get(proof.challengeId);

          allProofs.push({
            ...proof,
            userName: user?.name || "Anonymous",
            challengeTitle: challenge?.title || "Unknown",
            proofDescription: challenge?.proofDescription || "",
          });
        }
      }
    }

    return allProofs;
  },
});
