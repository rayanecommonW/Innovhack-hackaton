import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Seeder toutes les données de démo en une fois
export const seedAll = action({
  handler: async (ctx) => {
    // 1. Créer les utilisateurs de démo
    const userIds = await ctx.runMutation(api.users.seedDemoUsers);
    console.log("Users créés:", userIds.length);

    // 2. Créer les défis de démo avec le premier utilisateur comme créateur
    const challengeIds = await ctx.runMutation(api.challenges.seedDemoChallenges, {
      creatorId: userIds[0],
    });
    console.log("Challenges créés:", challengeIds.length);

    // 3. Faire participer les autres utilisateurs aux défis
    for (let i = 1; i < userIds.length; i++) {
      for (const challengeId of challengeIds) {
        try {
          await ctx.runMutation(api.participations.joinChallenge, {
            challengeId,
            userId: userIds[i],
            betAmount: 10 + i * 5, // Mises variées
          });
        } catch (e) {
          console.log("Participation déjà existante ou erreur:", e);
        }
      }
    }

    return {
      users: userIds.length,
      challenges: challengeIds.length,
      message: "Données de démo créées avec succès!",
    };
  },
});

// Simuler un scénario complet pour la démo
export const simulateDemo = action({
  handler: async (ctx) => {
    // Récupérer les utilisateurs
    const users = await ctx.runQuery(api.users.listUsers);
    if (users.length === 0) {
      throw new Error("Aucun utilisateur. Lancez seedAll d'abord.");
    }

    // Récupérer les défis publics
    const challenges = await ctx.runQuery(api.challenges.listPublicChallenges);
    if (challenges.length === 0) {
      throw new Error("Aucun défi. Lancez seedAll d'abord.");
    }

    const challenge = challenges[0];

    // Récupérer les participants du premier défi
    const participants = await ctx.runQuery(api.participations.getChallengeParticipants, {
      challengeId: challenge._id,
    });

    // Simuler des preuves pour certains participants
    const results = [];
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      // Alterner succès/échec
      const succeeded = i % 2 === 0;
      const proofValue = succeeded ? 12000 : 5000; // Objectif 10000 pas

      try {
        const result = await ctx.runAction(api.proofs.submitAndValidateProof, {
          participationId: p._id,
          proofContent: succeeded
            ? "Screenshot montrant 12000 pas"
            : "Screenshot montrant 5000 pas",
          proofValue,
        });
        results.push({
          user: p.user?.name,
          succeeded,
          validation: result.validation,
        });
      } catch (e) {
        console.log("Erreur preuve:", e);
      }
    }

    // Distribuer les gains
    const distribution = await ctx.runMutation(api.rewards.distributeRewards, {
      challengeId: challenge._id,
    });

    return {
      challenge: challenge.title,
      results,
      distribution,
    };
  },
});
