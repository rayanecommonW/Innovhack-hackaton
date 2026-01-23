import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { validateProof as aiValidateProof } from "./ai";
import { Id } from "./_generated/dataModel";
import { verifyAuthenticatedUser } from "./authHelper";

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est bien celui qui soumet
    await verifyAuthenticatedUser(ctx, args.userId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le validateur
    await verifyAuthenticatedUser(ctx, args.validatorId);

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
    // SÉCURITÉ: Vérifier que l'utilisateur authentifié est le votant
    await verifyAuthenticatedUser(ctx, args.voterId);

    const proof = await ctx.db.get(args.proofId);
    if (!proof) throw new Error("Preuve non trouvée");

    if (proof.userId === args.voterId) {
      throw new Error("Tu ne peux pas voter pour ta propre preuve");
    }

    // Check if voting deadline has passed for group pacts
    if (proof.groupValidationDeadline && Date.now() > proof.groupValidationDeadline) {
      throw new Error("Le temps de vote est terminé");
    }

    // Vérifier si déjà voté
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_proof_voter", (q) =>
        q.eq("proofId", args.proofId).eq("voterId", args.voterId)
      )
      .first();

    if (existingVote) throw new Error("Tu as déjà voté");

    const challenge = await ctx.db.get(proof.challengeId);

    // For group pacts, check if voter is a group member
    // For other pacts, check if voter is a participant
    if (challenge?.type === "group" && challenge.groupId) {
      const groupMembership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q) =>
          q.eq("groupId", challenge.groupId!).eq("userId", args.voterId)
        )
        .first();

      if (!groupMembership) {
        throw new Error("Tu dois être membre du groupe pour voter");
      }
    } else {
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

    // For group pacts: use percentage-based validation (50%+ approval)
    // For other pacts: use fixed vote count
    const requiredVotes = proof.requiredVotes || 3;
    const totalVotes = newApproveCount + newRejectCount;

    // Determine if validation decision can be made
    let shouldApprove = false;
    let shouldReject = false;

    if (challenge?.type === "group" && proof.totalGroupMembers) {
      // For group pacts: percentage-based (50%+ of group approves = win)
      const threshold = proof.validationPercentage || 50;
      const totalMembers = proof.totalGroupMembers;

      // Calculate percentage based on votes received
      if (totalVotes > 0) {
        const approvalRate = (newApproveCount / totalVotes) * 100;
        const rejectionRate = (newRejectCount / totalVotes) * 100;

        // Need at least half of the group to have voted for a decision
        const minVotesNeeded = Math.ceil(totalMembers / 2);

        if (totalVotes >= minVotesNeeded) {
          if (approvalRate > threshold) {
            shouldApprove = true;
          } else if (rejectionRate > threshold) {
            shouldReject = true;
          }
        }
      }
    } else {
      // For other pacts: fixed vote count
      if (newApproveCount >= requiredVotes) {
        shouldApprove = true;
      } else if (newRejectCount >= requiredVotes) {
        shouldReject = true;
      }
    }

    if (shouldApprove) {
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
        title: challenge?.type === "group" ? "Preuve validée par le groupe !" : "Preuve validée par la communauté !",
        body: `Ta preuve pour "${challenge?.title}" a été approuvée !`,
        data: JSON.stringify({ challengeId: proof.challengeId }),
        read: false,
        createdAt: Date.now(),
      });
    } else if (shouldReject) {
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
        title: challenge?.type === "group" ? "Preuve refusée par le groupe" : "Preuve refusée par la communauté",
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

        // Convert storage ID to URL if needed
        let proofContentUrl = proof.proofContent;
        if (proof.proofContent?.includes("storageId:")) {
          const storageIdMatch = proof.proofContent.match(/storageId:([a-z0-9]+)/);
          if (storageIdMatch) {
            const storageUrl = await ctx.storage.getUrl(storageIdMatch[1] as any);
            proofContentUrl = storageUrl || proof.proofContent;
          }
        }

        return { ...proof, proofContent: proofContentUrl, user: userWithImage, challenge, participation };
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

      // Mettre à jour les stats du user et distribuer les gains
      const user = await ctx.db.get(proof.userId);
      if (user && args.decision === "approved") {
        const newStreak = (user.currentStreak || 0) + 1;

        // Calculer les gains: mise récupérée + bonus sponsor éventuel
        const betAmount = participation.betAmount || 0;
        const sponsorBonus = challenge.sponsorReward || 0;
        const winAmount = betAmount * 2 + sponsorBonus; // Double mise + bonus

        await ctx.db.patch(proof.userId, {
          balance: (user.balance || 0) + winAmount,
          totalWins: (user.totalWins || 0) + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(user.bestStreak || 0, newStreak),
          totalPacts: (user.totalPacts || 0) + 1,
        });

        // Créer un enregistrement de récompense
        await ctx.db.insert("rewards", {
          challengeId: proof.challengeId,
          userId: proof.userId,
          amount: winAmount,
          promoCode: challenge.sponsorPromoCode,
          promoSponsor: challenge.sponsorName,
          createdAt: Date.now(),
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

    // Calculer les gains pour la notification
    const betAmount = participation?.betAmount || 0;
    const sponsorBonus = challenge.sponsorReward || 0;
    const winAmount = betAmount * 2 + sponsorBonus;

    // Notifier le participant
    await ctx.db.insert("notifications", {
      userId: proof.userId,
      type: args.decision === "approved" ? "proof_approved" : "proof_rejected",
      title: args.decision === "approved" ? "Preuve validée ! 🎉" : "Preuve refusée",
      body: args.decision === "approved"
        ? `Ta preuve pour "${challenge.title}" a été validée ! Tu as gagné ${winAmount}€ !`
        : `Ta preuve pour "${challenge.title}" a été refusée.${args.comment ? ` Raison: ${args.comment}` : ""}`,
      data: JSON.stringify({ challengeId: proof.challengeId, proofId: args.proofId, winAmount }),
      read: false,
      createdAt: Date.now(),
    });

    // Schedule push notification
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendProofValidatedNotification, {
      userId: proof.userId,
      proofId: args.proofId,
      challengeTitle: challenge.title,
      approved: args.decision === "approved",
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

// Get user's pending proofs (awaiting organizer validation)
export const getMyPendingProofs = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const proofs = await ctx.db
      .query("proofs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("organizerValidation"), "pending"))
      .collect();

    const enriched = await Promise.all(
      proofs.map(async (p) => {
        const challenge = await ctx.db.get(p.challengeId);
        const organizer = challenge ? await ctx.db.get(challenge.creatorId) : null;

        // Convert storage ID to URL if needed
        let proofContentUrl = p.proofContent;
        if (p.proofContent?.includes("storageId:")) {
          const storageIdMatch = p.proofContent.match(/storageId:([a-z0-9]+)/);
          if (storageIdMatch) {
            const storageUrl = await ctx.storage.getUrl(storageIdMatch[1] as any);
            proofContentUrl = storageUrl || p.proofContent;
          }
        }

        return {
          ...p,
          proofContent: proofContentUrl,
          challenge,
          organizer: organizer ? {
            _id: organizer._id,
            name: organizer.name,
            profileImageUrl: organizer.profileImageUrl,
          } : null,
        };
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

    // Get messages for this proof
    const messages = await ctx.db
      .query("proofMessages")
      .withIndex("by_proof", (q) => q.eq("proofId", args.proofId))
      .collect();

    const enrichedMessages = await Promise.all(
      messages.map(async (m) => {
        const msgUser = await ctx.db.get(m.userId);
        return { ...m, user: msgUser };
      })
    );

    // Get challenge creator info
    let challengeWithCreator = challenge;
    if (challenge) {
      const creator = await ctx.db.get(challenge.creatorId);
      let creatorWithImage = creator;
      if (creator?.profileImageId) {
        const imageUrl = await ctx.storage.getUrl(creator.profileImageId);
        creatorWithImage = { ...creator, profileImageUrl: imageUrl || creator.profileImageUrl };
      }
      challengeWithCreator = { ...challenge, creator: creatorWithImage };
    }

    // Convert storage ID to URL if needed
    let proofContentUrl = proof.proofContent;
    if (proof.proofContent?.includes("storageId:")) {
      const storageIdMatch = proof.proofContent.match(/storageId:([a-z0-9]+)/);
      if (storageIdMatch) {
        const storageUrl = await ctx.storage.getUrl(storageIdMatch[1] as any);
        proofContentUrl = storageUrl || proof.proofContent;
      }
    }

    return {
      ...proof,
      proofContent: proofContentUrl,
      user: userWithImage,
      challenge: challengeWithCreator,
      participation,
      comments: enrichedComments.sort((a, b) => a.createdAt - b.createdAt),
      reactions,
      reactionCounts,
      votes: enrichedVotes,
      messages: enrichedMessages.sort((a, b) => a.createdAt - b.createdAt),
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

// Get proof by participation ID
export const getProofByParticipation = query({
  args: { participationId: v.id("participations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proofs")
      .withIndex("by_participation", (q) => q.eq("participationId", args.participationId))
      .first();
  },
});

// Submit proof - Goes to organizer for manual validation (NO AI)
export const submitAndValidateProof = action({
  args: {
    participationId: v.id("participations"),
    proofContent: v.string(),
    proofValue: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; validation: { approved: boolean; comment: string } }> => {
    // Get participation
    const participation = await ctx.runQuery(api.proofs.getParticipationForProof, {
      participationId: args.participationId,
    });

    if (!participation) {
      throw new Error("Participation non trouvée");
    }

    if (participation.status === "won" || participation.status === "lost") {
      throw new Error("Ce pact est déjà terminé pour toi");
    }

    // Get challenge
    const challenge = await ctx.runQuery(api.challenges.getChallenge, {
      challengeId: participation.challengeId,
    });

    if (!challenge) {
      throw new Error("Pact non trouvé");
    }

    // Vérifier les délais de soumission de preuve
    const now = Date.now();
    const pactDuration = challenge.endDate - challenge.startDate;
    const isLongTermPact = pactDuration > 24 * 60 * 60 * 1000; // Plus de 24h
    const gracePeriodMs = 24 * 60 * 60 * 1000; // 24h de grâce après la fin
    const proofDeadline = challenge.endDate + gracePeriodMs;

    // Pour les pacts long terme: ne peut soumettre qu'après la fin du pact
    if (isLongTermPact && now < challenge.endDate) {
      const hoursRemaining = Math.ceil((challenge.endDate - now) / (1000 * 60 * 60));
      if (hoursRemaining > 24) {
        const daysRemaining = Math.ceil(hoursRemaining / 24);
        throw new Error(`Tu pourras soumettre ta preuve dans ${daysRemaining} jour(s), à la fin du pact.`);
      } else {
        throw new Error(`Tu pourras soumettre ta preuve dans ${hoursRemaining}h, à la fin du pact.`);
      }
    }

    // Vérifier que la deadline de soumission n'est pas dépassée (fin pact + 24h)
    if (now > proofDeadline) {
      throw new Error("Le délai de soumission est dépassé (24h après la fin du pact).");
    }

    // Check if proof already exists
    const existingProof = await ctx.runQuery(api.proofs.getProofByParticipation, {
      participationId: args.participationId,
    });

    if (existingProof) {
      // Return existing validation status
      const approved = existingProof.organizerValidation === "approved";
      return {
        success: true,
        validation: {
          approved,
          comment: approved ? "Preuve déjà validée" : "Preuve déjà soumise, en attente de validation par l'organisateur",
        },
      };
    }

    // Submit the proof - always pending, organizer will validate manually
    await ctx.runMutation(api.proofs.submitProofForValidation, {
      participationId: args.participationId,
      challengeId: participation.challengeId,
      userId: participation.usertId,
      proofContent: args.proofContent,
      proofValue: args.proofValue,
    });

    return {
      success: true,
      validation: {
        approved: false, // Always pending until organizer validates
        comment: "Preuve envoyée ! L'organisateur va la vérifier.",
      },
    };
  },
});

// Mutation to submit proof for manual validation by organizer (NO AI)
export const submitProofForValidation = mutation({
  args: {
    participationId: v.id("participations"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    proofContent: v.string(),
    proofValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Pact non trouvé");

    const user = await ctx.db.get(args.userId);
    const userName = user?.name || "Un participant";

    // Vérifier les délais de soumission de preuve
    const now = Date.now();
    const pactDuration = challenge.endDate - challenge.startDate;
    const isLongTermPact = pactDuration > 24 * 60 * 60 * 1000; // Plus de 24h
    const gracePeridodMs = 24 * 60 * 60 * 1000; // 24h de grâce après la fin
    const proofDeadline = challenge.endDate + gracePeridodMs;

    // Pour les pacts long terme: ne peut soumettre qu'après la fin du pact
    if (isLongTermPact && now < challenge.endDate) {
      const hoursRemaining = Math.ceil((challenge.endDate - now) / (1000 * 60 * 60));
      if (hoursRemaining > 24) {
        const daysRemaining = Math.ceil(hoursRemaining / 24);
        throw new Error(`Tu pourras soumettre ta preuve dans ${daysRemaining} jour(s), à la fin du pact.`);
      } else {
        throw new Error(`Tu pourras soumettre ta preuve dans ${hoursRemaining}h, à la fin du pact.`);
      }
    }

    // Vérifier que la deadline de soumission n'est pas dépassée (fin pact + 24h)
    if (now > proofDeadline) {
      throw new Error("Le délai de soumission est dépassé (24h après la fin du pact).");
    }

    // For group pacts, calculate required votes based on group members
    let requiredVotes = 2;
    let totalGroupMembers = 0;
    let groupValidationDeadline = undefined;
    let validationPercentage = 50;

    if (challenge.type === "group" && challenge.groupId) {
      // Get group members count (excluding the proof submitter)
      const groupMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", challenge.groupId!))
        .collect();

      totalGroupMembers = groupMembers.filter((m) => m.userId !== args.userId).length;
      validationPercentage = challenge.groupValidationThreshold || 50;

      // Calculate required votes: more than 50% of group members (excluding submitter)
      requiredVotes = Math.max(1, Math.ceil((totalGroupMembers * validationPercentage) / 100));

      // Set deadline for group voting
      const deadlineHours = challenge.groupValidationDeadlineHours || 24;
      groupValidationDeadline = Date.now() + deadlineHours * 60 * 60 * 1000;
    } else {
      const participantCount = challenge.currentParticipants || 1;
      requiredVotes = Math.max(2, Math.floor(participantCount / 2));
    }

    // Create proof - always pending until organizer validates (or group for group pacts)
    const proofId = await ctx.db.insert("proofs", {
      participationId: args.participationId,
      challengeId: args.challengeId,
      userId: args.userId,
      proofContent: args.proofContent,
      proofValue: args.proofValue,
      proofType: args.proofContent.includes("storageId:") ? "image" : "text",
      // For group pacts, skip organizer validation - go straight to community
      organizerValidation: challenge.type === "group" ? "approved" : "pending",
      communityValidation: challenge.type === "friends" || challenge.type === "group" ? "pending" : undefined,
      approveCount: 0,
      rejectCount: 0,
      requiredVotes,
      // Group validation specific fields
      groupValidationDeadline,
      totalGroupMembers: challenge.type === "group" ? totalGroupMembers : undefined,
      validationPercentage: challenge.type === "group" ? validationPercentage : undefined,
      submittedAt: Date.now(),
    });

    // Update participation status to pending validation
    await ctx.db.patch(args.participationId, {
      status: "pending_validation",
      proofSubmittedAt: Date.now(),
    });

    // Create activity
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      type: "submitted_proof",
      targetId: proofId,
      targetType: "proof",
      metadata: JSON.stringify({ challengeId: args.challengeId, challengeTitle: challenge.title }),
      createdAt: Date.now(),
    });

    // For group pacts, notify all group members; for others, notify organizer
    if (challenge.type === "group" && challenge.groupId) {
      // Notify all group members (except the proof submitter)
      const groupMembers = await ctx.db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", challenge.groupId!))
        .collect();

      for (const member of groupMembers) {
        if (member.userId !== args.userId) {
          await ctx.db.insert("notifications", {
            userId: member.userId,
            type: "group_proof_to_validate",
            title: "Preuve à valider",
            body: `${userName} a soumis une preuve pour "${challenge.title}" - Vote maintenant!`,
            data: JSON.stringify({ challengeId: args.challengeId, proofId, groupId: challenge.groupId }),
            read: false,
            createdAt: Date.now(),
          });
        }
      }
    } else {
      // Notify organizer - they need to validate manually
      await ctx.db.insert("notifications", {
        userId: challenge.creatorId,
        type: "proof_submitted",
        title: "Nouvelle preuve à valider",
        body: `${userName} a soumis une preuve pour "${challenge.title}"`,
        data: JSON.stringify({ challengeId: args.challengeId, proofId }),
        read: false,
        createdAt: Date.now(),
      });

      // Push notification to organizer
      await ctx.scheduler.runAfter(0, internal.pushNotifications.notifyUser, {
        userId: challenge.creatorId,
        title: "Nouvelle preuve à valider",
        body: `${userName} a soumis une preuve pour "${challenge.title}"`,
        data: { challengeId: args.challengeId, proofId },
        type: "proof_submitted",
      });
    }

    return proofId;
  },
});

// Get group proofs that a user can vote on (as a group member)
export const getGroupProofsToVote = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's group memberships
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const groupIds = memberships.map((m) => m.groupId);
    const allProofs: any[] = [];

    for (const groupId of groupIds) {
      // Get challenges in this group
      const challenges = await ctx.db
        .query("challenges")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .filter((q) => q.eq(q.field("type"), "group"))
        .collect();

      for (const challenge of challenges) {
        // Get proofs for this challenge
        const proofs = await ctx.db
          .query("proofs")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        // Filter: pending validation, not from this user, not expired
        const now = Date.now();
        const votableProofs = proofs.filter(
          (p) =>
            p.userId !== args.userId &&
            p.communityValidation === "pending" &&
            (!p.groupValidationDeadline || p.groupValidationDeadline > now)
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
            let userWithImage = user;
            if (user?.profileImageId) {
              const imageUrl = await ctx.storage.getUrl(user.profileImageId);
              userWithImage = { ...user, profileImageUrl: imageUrl || user.profileImageUrl };
            }

            const group = await ctx.db.get(groupId);

            // Convert storage ID to URL if needed
            let proofContentUrl = proof.proofContent;
            if (proof.proofContent?.includes("storageId:")) {
              const storageIdMatch = proof.proofContent.match(/storageId:([a-z0-9]+)/);
              if (storageIdMatch) {
                const storageUrl = await ctx.storage.getUrl(storageIdMatch[1] as any);
                proofContentUrl = storageUrl || proof.proofContent;
              }
            }

            // Get vote counts
            const votes = await ctx.db
              .query("votes")
              .withIndex("by_proof", (q) => q.eq("proofId", proof._id))
              .collect();

            allProofs.push({
              ...proof,
              proofContent: proofContentUrl,
              user: userWithImage,
              challenge,
              group,
              voteCount: votes.length,
              approveCount: votes.filter((v) => v.voteType === "approve").length,
              rejectCount: votes.filter((v) => v.voteType === "reject").length,
              timeRemaining: proof.groupValidationDeadline
                ? Math.max(0, proof.groupValidationDeadline - now)
                : null,
            });
          }
        }
      }
    }

    // Sort by deadline (urgent first)
    return allProofs.sort((a, b) => {
      if (a.groupValidationDeadline && b.groupValidationDeadline) {
        return a.groupValidationDeadline - b.groupValidationDeadline;
      }
      return b.submittedAt - a.submittedAt;
    });
  },
});

// Send a message on a proof (user <-> organizer chat)
export const sendProofMessage = mutation({
  args: {
    proofId: v.id("proofs"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const proof = await ctx.db.get(args.proofId);
    if (!proof) {
      throw new Error("Preuve non trouvée");
    }

    const challenge = await ctx.db.get(proof.challengeId);
    if (!challenge) {
      throw new Error("Pact non trouvé");
    }

    // Only proof owner or organizer can send messages
    const isOwner = proof.userId === args.userId;
    const isOrganizer = challenge.creatorId === args.userId;

    if (!isOwner && !isOrganizer) {
      throw new Error("Non autorisé");
    }

    // Insert the message
    const messageId = await ctx.db.insert("proofMessages", {
      proofId: args.proofId,
      userId: args.userId,
      message: args.message,
      createdAt: Date.now(),
    });

    // Get sender info for notification
    const sender = await ctx.db.get(args.userId);

    // Notify the other party
    const recipientId = isOwner ? challenge.creatorId : proof.userId;

    await ctx.db.insert("notifications", {
      userId: recipientId,
      type: "proof_message",
      title: "Nouveau message",
      body: `${sender?.name || "Quelqu'un"} t'a envoyé un message sur ta preuve`,
      data: JSON.stringify({ proofId: args.proofId, messageId }),
      read: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});
