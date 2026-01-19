import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Soumettre une preuve
export const submitProof = mutation({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    proofContent: v.string(),
    proofType: v.optional(v.string()),
    proofValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier la participation
    const participation = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("usertId", args.userId)
      )
      .first();

    if (!participation) throw new Error("Tu ne participes pas à ce pact");
    if (participation.status === "won" || participation.status === "lost") {
      throw new Error("Ce pact est déjà terminé pour toi");
    }

    // Vérifier si une preuve existe déjà
    const existingProof = await ctx.db
      .query("proofs")
      .withIndex("by_participation", (q) => q.eq("participationId", participation._id))
      .first();

    if (existingProof) throw new Error("Tu as déjà soumis une preuve");

    // Récupérer le challenge
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Déterminer le nombre de votes requis pour validation communautaire
    const participantCount = challenge.currentParticipants || 1;
    const requiredVotes = Math.max(2, Math.floor(participantCount / 2));

    // Créer la preuve
    const proofId = await ctx.db.insert("proofs", {
      participationId: participation._id,
      challengeId: args.challengeId,
      userId: args.userId,
      proofContent: args.proofContent,
      proofType: args.proofType,
      proofValue: args.proofValue,
      organizerValidation: "pending",
      communityValidation: challenge.type === "friends" || challenge.type === "group" ? "pending" : undefined,
      approveCount: 0,
      rejectCount: 0,
      requiredVotes,
      submittedAt: Date.now(),
    });

    // Mettre à jour la participation
    await ctx.db.patch(participation._id, {
      status: "pending_validation",
      proofSubmittedAt: Date.now(),
    });

    // Créer une activité dans le feed
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      type: "submitted_proof",
      targetId: proofId,
      targetType: "proof",
      metadata: JSON.stringify({ challengeId: args.challengeId, challengeTitle: challenge.title }),
      createdAt: Date.now(),
    });

    // Notifier l'organisateur
    await ctx.db.insert("notifications", {
      userId: challenge.creatorId,
      type: "proof_submitted",
      title: "Nouvelle preuve à valider",
      body: `Un participant a soumis une preuve pour "${challenge.title}"`,
      data: JSON.stringify({ challengeId: args.challengeId, proofId }),
      read: false,
      createdAt: Date.now(),
    });

    return proofId;
  },
});

// Valider une preuve (par l'organisateur)
export const validateProof = mutation({
  args: {
    proofId: v.id("proofs"),
    validatorId: v.id("users"),
    decision: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    const challenge = await ctx.db.get(proof.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Vérifier que c'est l'organisateur
    if (challenge.creatorId !== args.validatorId) {
      throw new Error("Seul l'organisateur peut valider les preuves");
    }

    // Mettre à jour la preuve
    await ctx.db.patch(args.proofId, {
      organizerValidation: args.decision,
      validatedBy: args.validatorId,
      organizerComment: args.comment,
      validatedAt: Date.now(),
    });

    // Mettre à jour la participation
    const participation = await ctx.db.get(proof.participationId);
    if (participation) {
      await ctx.db.patch(participation._id, {
        status: args.decision === "approved" ? "won" : "lost",
        validatedAt: Date.now(),
      });

      // Mettre à jour les stats du user
      const user = await ctx.db.get(proof.userId);
      if (user && args.decision === "approved") {
        await ctx.db.patch(proof.userId, {
          totalWins: (user.totalWins || 0) + 1,
          currentStreak: (user.currentStreak || 0) + 1,
          bestStreak: Math.max(user.bestStreak || 0, (user.currentStreak || 0) + 1),
        });
      } else if (user && args.decision === "rejected") {
        await ctx.db.patch(proof.userId, {
          totalLosses: (user.totalLosses || 0) + 1,
          currentStreak: 0,
        });
      }
    }

    // Créer activité
    await ctx.db.insert("activityFeed", {
      userId: proof.userId,
      type: args.decision === "approved" ? "won_pact" : "lost_pact",
      targetId: proof.challengeId,
      targetType: "challenge",
      metadata: JSON.stringify({ challengeTitle: challenge.title }),
      createdAt: Date.now(),
    });

    // Notifier le participant
    await ctx.db.insert("notifications", {
      userId: proof.userId,
      type: args.decision === "approved" ? "proof_approved" : "proof_rejected",
      title: args.decision === "approved" ? "Preuve validée !" : "Preuve refusée",
      body: args.decision === "approved"
        ? `Ta preuve pour "${challenge.title}" a été validée !`
        : `Ta preuve pour "${challenge.title}" a été refusée. ${args.comment || ""}`,
      data: JSON.stringify({ challengeId: proof.challengeId, proofId: args.proofId }),
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Vote communautaire sur une preuve
export const voteOnProof = mutation({
  args: {
    proofId: v.id("proofs"),
    voterId: v.id("users"),
    voteType: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    if (proof.userId === args.voterId) {
      throw new Error("Tu ne peux pas voter pour ta propre preuve");
    }

    // Vérifier si déjà voté
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_proof_voter", (q) =>
        q.eq("proofId", args.proofId).eq("voterId", args.voterId)
      )
      .first();

    if (existingVote) throw new Error("Tu as déjà voté");

    // Vérifier que le voteur participe au challenge
    const voterParticipation = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", proof.challengeId).eq("usertId", args.voterId)
      )
      .first();

    if (!voterParticipation) {
      throw new Error("Tu dois participer au pact pour voter");
    }

    // Créer le vote
    await ctx.db.insert("votes", {
      proofId: args.proofId,
      voterId: args.voterId,
      challengeId: proof.challengeId,
      voteType: args.voteType,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Mettre à jour les compteurs
    const newApproveCount = (proof.approveCount || 0) + (args.voteType === "approve" ? 1 : 0);
    const newRejectCount = (proof.rejectCount || 0) + (args.voteType === "reject" ? 1 : 0);

    await ctx.db.patch(args.proofId, {
      approveCount: newApproveCount,
      rejectCount: newRejectCount,
    });

    // Vérifier si le seuil de votes est atteint
    const requiredVotes = proof.requiredVotes || 3;
    const challenge = await ctx.db.get(proof.challengeId);

    if (newApproveCount >= requiredVotes) {
      await ctx.db.patch(args.proofId, {
        communityValidation: "approved",
        validatedAt: Date.now(),
      });

      const participation = await ctx.db.get(proof.participationId);
      if (participation) {
        await ctx.db.patch(participation._id, {
          status: "won",
          validatedAt: Date.now(),
        });

        // Mettre à jour les stats
        const user = await ctx.db.get(proof.userId);
        if (user) {
          await ctx.db.patch(proof.userId, {
            totalWins: (user.totalWins || 0) + 1,
            currentStreak: (user.currentStreak || 0) + 1,
            bestStreak: Math.max(user.bestStreak || 0, (user.currentStreak || 0) + 1),
          });
        }
      }

      // Notifier
      await ctx.db.insert("notifications", {
        userId: proof.userId,
        type: "proof_approved",
        title: "Preuve validée par la communauté !",
        body: `Ta preuve pour "${challenge?.title}" a été approuvée !`,
        data: JSON.stringify({ challengeId: proof.challengeId }),
        read: false,
        createdAt: Date.now(),
      });
    } else if (newRejectCount >= requiredVotes) {
      await ctx.db.patch(args.proofId, {
        communityValidation: "rejected",
        validatedAt: Date.now(),
      });

      const participation = await ctx.db.get(proof.participationId);
      if (participation) {
        await ctx.db.patch(participation._id, {
          status: "lost",
          validatedAt: Date.now(),
        });

        const user = await ctx.db.get(proof.userId);
        if (user) {
          await ctx.db.patch(proof.userId, {
            totalLosses: (user.totalLosses || 0) + 1,
            currentStreak: 0,
          });
        }
      }

      await ctx.db.insert("notifications", {
        userId: proof.userId,
        type: "proof_rejected",
        title: "Preuve refusée par la communauté",
        body: `Ta preuve pour "${challenge?.title}" a été rejetée.`,
        data: JSON.stringify({ challengeId: proof.challengeId }),
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Ajouter un commentaire
export const addComment = mutation({
  args: {
    proofId: v.id("proofs"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    const commentId = await ctx.db.insert("proofComments", {
      proofId: args.proofId,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    // Notifier le propriétaire de la preuve (sauf si c'est lui qui commente)
    if (proof.userId !== args.userId) {
      const commenter = await ctx.db.get(args.userId);
      await ctx.db.insert("notifications", {
        userId: proof.userId,
        type: "new_comment",
        title: "Nouveau commentaire",
        body: `${commenter?.name || "Quelqu'un"} a commenté ta preuve`,
        data: JSON.stringify({ proofId: args.proofId }),
        read: false,
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});

// Ajouter une réaction
export const addReaction = mutation({
  args: {
    proofId: v.id("proofs"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("proofReactions")
      .withIndex("by_proof_user", (q) =>
        q.eq("proofId", args.proofId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      if (existing.emoji === args.emoji) {
        // Supprimer si même emoji
        await ctx.db.delete(existing._id);
        return null;
      }
      // Changer l'emoji
      await ctx.db.patch(existing._id, { emoji: args.emoji });
      return existing._id;
    }

    return await ctx.db.insert("proofReactions", {
      proofId: args.proofId,
      userId: args.userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
  },
});

// Récupérer les preuves d'un challenge
export const getChallengeProofs = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const enriched = await Promise.all(
      proofs.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        const comments = await ctx.db
          .query("proofComments")
          .withIndex("by_proof", (q) => q.eq("proofId", proof._id))
          .collect();
        const reactions = await ctx.db
          .query("proofReactions")
          .withIndex("by_proof", (q) => q.eq("proofId", proof._id))
          .collect();
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_proof", (q) => q.eq("proofId", proof._id))
          .collect();

        const enrichedComments = await Promise.all(
          comments.map(async (c) => {
            const commentUser = await ctx.db.get(c.userId);
            return { ...c, user: commentUser };
          })
        );

        return {
          ...proof,
          user,
          comments: enrichedComments,
          reactions,
          votes,
          reactionCounts: reactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
      })
    );

    return enriched;
  },
});

// Preuves en attente pour un organisateur
export const getPendingProofsForOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.organizerId))
      .collect();

    const challengeIds = challenges.map((c) => c._id);

    const allProofs = await ctx.db
      .query("proofs")
      .withIndex("by_organizer_validation", (q) => q.eq("organizerValidation", "pending"))
      .collect();

    const pendingProofs = allProofs.filter((p) => challengeIds.includes(p.challengeId));

    const enriched = await Promise.all(
      pendingProofs.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        const challenge = await ctx.db.get(proof.challengeId);
        return { ...proof, user, challenge };
      })
    );

    return enriched;
  },
});

// Get proofs to validate as organizer (alias for organizer-validation page)
export const getProofsToValidateAsOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.organizerId))
      .collect();

    const activeChallengIds = challenges
      .filter((c) => c.status === "active" || c.status === "pending")
      .map((c) => c._id);

    const allProofs = await ctx.db
      .query("proofs")
      .withIndex("by_organizer_validation", (q) => q.eq("organizerValidation", "pending"))
      .collect();

    const pendingProofs = allProofs.filter((p) => activeChallengIds.includes(p.challengeId));

    const enriched = await Promise.all(
      pendingProofs.map(async (proof) => {
        const user = await ctx.db.get(proof.userId);
        const challenge = await ctx.db.get(proof.challengeId);
        const participation = await ctx.db.get(proof.participationId);

        // Get profile image URL
        let userWithImage = user;
        if (user?.profileImageId) {
          const imageUrl = await ctx.storage.getUrl(user.profileImageId);
          userWithImage = { ...user, profileImageUrl: imageUrl || user.profileImageUrl };
        }

        return { ...proof, user: userWithImage, challenge, participation };
      })
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Validate proof as organizer (with more feedback)
export const validateProofAsOrganizer = mutation({
  args: {
    proofId: v.id("proofs"),
    organizerId: v.id("users"),
    decision: v.string(), // "approved" | "rejected"
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    const challenge = await ctx.db.get(proof.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    // Vérifier que c'est l'organisateur
    if (challenge.creatorId !== args.organizerId) {
      throw new Error("Seul l'organisateur peut valider les preuves");
    }

    // Mettre à jour la preuve
    await ctx.db.patch(args.proofId, {
      organizerValidation: args.decision,
      validatedBy: args.organizerId,
      organizerComment: args.comment,
      validatedAt: Date.now(),
    });

    // Mettre à jour la participation
    const participation = await ctx.db.get(proof.participationId);
    if (participation) {
      await ctx.db.patch(participation._id, {
        status: args.decision === "approved" ? "won" : "lost",
        validatedAt: Date.now(),
      });

      // Mettre à jour les stats du user
      const user = await ctx.db.get(proof.userId);
      if (user && args.decision === "approved") {
        const newStreak = (user.currentStreak || 0) + 1;
        await ctx.db.patch(proof.userId, {
          totalWins: (user.totalWins || 0) + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(user.bestStreak || 0, newStreak),
          totalPacts: (user.totalPacts || 0) + 1,
        });
      } else if (user && args.decision === "rejected") {
        await ctx.db.patch(proof.userId, {
          totalLosses: (user.totalLosses || 0) + 1,
          currentStreak: 0,
          totalPacts: (user.totalPacts || 0) + 1,
        });
      }
    }

    // Créer activité
    await ctx.db.insert("activityFeed", {
      userId: proof.userId,
      type: args.decision === "approved" ? "won_pact" : "lost_pact",
      targetId: proof.challengeId,
      targetType: "challenge",
      metadata: JSON.stringify({ challengeTitle: challenge.title }),
      createdAt: Date.now(),
    });

    // Notifier le participant
    await ctx.db.insert("notifications", {
      userId: proof.userId,
      type: args.decision === "approved" ? "proof_approved" : "proof_rejected",
      title: args.decision === "approved" ? "Preuve validée !" : "Preuve refusée",
      body: args.decision === "approved"
        ? `Ta preuve pour "${challenge.title}" a été validée !`
        : `Ta preuve pour "${challenge.title}" a été refusée.${args.comment ? ` Raison: ${args.comment}` : ""}`,
      data: JSON.stringify({ challengeId: proof.challengeId, proofId: args.proofId }),
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Preuve d'un utilisateur pour un challenge
export const getUserProof = query({
  args: {
    challengeId: v.id("challenges"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participation = await ctx.db
      .query("participations")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", args.challengeId).eq("usertId", args.userId)
      )
      .first();

    if (!participation) return null;

    return await ctx.db
      .query("proofs")
      .withIndex("by_participation", (q) => q.eq("participationId", participation._id))
      .first();
  },
});

// Récupérer les preuves d'un utilisateur
export const getMyProofs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      proofs.map(async (p) => {
        const challenge = await ctx.db.get(p.challengeId);
        return { ...p, challenge };
      })
    );

    return enriched;
  },
});

// Helper pour récupérer une participation
export const getParticipationForProof = query({
  args: { participationId: v.id("participations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.participationId);
  },
});

// Get proof detail with all data
export const getProofDetail = query({
  args: { proofId: v.id("proofs") },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) return null;

    const user = await ctx.db.get(proof.userId);
    const challenge = await ctx.db.get(proof.challengeId);
    const participation = await ctx.db.get(proof.participationId);

    // Get profile image URL
    let userWithImage = user;
    if (user?.profileImageId) {
      const imageUrl = await ctx.storage.getUrl(user.profileImageId);
      userWithImage = { ...user, profileImageUrl: imageUrl || user.profileImageUrl };
    }

    // Get comments with user info
    const comments = await ctx.db
      .query("proofComments")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .collect();

    const enrichedComments = await Promise.all(
      comments.map(async (c) => {
        const commentUser = await ctx.db.get(c.userId);
        let commentUserWithImage = commentUser;
        if (commentUser?.profileImageId) {
          const imageUrl = await ctx.storage.getUrl(commentUser.profileImageId);
          commentUserWithImage = { ...commentUser, profileImageUrl: imageUrl || commentUser.profileImageUrl };
        }
        return { ...c, user: commentUserWithImage };
      })
    );

    // Get reactions
    const reactions = await ctx.db
      .query("proofReactions")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .collect();

    // Get votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .collect();

    const enrichedVotes = await Promise.all(
      votes.map(async (v) => {
        const voter = await ctx.db.get(v.voterId);
        return { ...v, voter };
      })
    );

    // Calculate reaction counts
    const reactionCounts = reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...proof,
      user: userWithImage,
      challenge,
      participation,
      comments: enrichedComments.sort((a, b) => a.createdAt - b.createdAt),
      reactions,
      reactionCounts,
      votes: enrichedVotes,
    };
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

    return vote ? vote.voteType : null;
  },
});

// Get user's reaction on a proof
export const getUserReaction = query({
  args: {
    proofId: v.id("proofs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reaction = await ctx.db
      .query("proofReactions")
      .withIndex("by_proof_user", (q) =>
        q.eq("proofId", args.proofId).eq("userId", args.userId)
      )
      .first();

    return reaction?.emoji || null;
  },
});
