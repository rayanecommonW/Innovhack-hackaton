import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Vérifier et distribuer les gains des pacts terminés - toutes les 5 minutes
crons.interval(
  "distribute-rewards",
  { minutes: 5 },
  internal.rewards.checkAndDistributeEndedChallenges
);

// Envoyer les rappels de deadline - toutes les heures
crons.interval(
  "deadline-reminders",
  { hours: 1 },
  internal.notifications.createDeadlineReminders
);

// Envoyer les rappels de demandes d'ami - toutes les 6 heures
crons.interval(
  "friend-request-reminders",
  { hours: 6 },
  internal.notifications.createFriendRequestReminders
);

// Envoyer les rappels de preuves à valider - toutes les 4 heures
crons.interval(
  "proof-validation-reminders",
  { hours: 4 },
  internal.notifications.createProofValidationReminders
);

// Nettoyer les anciennes notifications (plus de 30 jours) - une fois par jour
crons.daily(
  "cleanup-old-notifications",
  { hourUTC: 3, minuteUTC: 0 }, // 3h du matin UTC
  internal.maintenance.cleanupOldNotifications
);

// Mettre à jour le leaderboard - toutes les heures
crons.interval(
  "update-leaderboard",
  { hours: 1 },
  internal.stats.updateLeaderboard
);

// Seed badges si la table est vide - toutes les heures (idempotent)
crons.interval(
  "seed-badges",
  { hours: 1 },
  internal.badges.seedBadgesInternal
);

export default crons;
