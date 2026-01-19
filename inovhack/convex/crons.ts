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

export default crons;
