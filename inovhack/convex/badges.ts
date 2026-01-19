import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Définition des badges
const BADGE_DEFINITIONS = [
  // Victoires
  { name: "first_win", title: "Première Victoire", description: "Gagne ton premier pact", icon: "🏆", category: "wins", requirement: 1, rarity: "common" },
  { name: "winner_5", title: "Gagnant", description: "Gagne 5 pacts", icon: "⭐", category: "wins", requirement: 5, rarity: "common" },
  { name: "winner_10", title: "Champion", description: "Gagne 10 pacts", icon: "🌟", category: "wins", requirement: 10, rarity: "rare" },
  { name: "winner_25", title: "Maître", description: "Gagne 25 pacts", icon: "👑", category: "wins", requirement: 25, rarity: "epic" },
  { name: "winner_50", title: "Légende", description: "Gagne 50 pacts", icon: "🔥", category: "wins", requirement: 50, rarity: "legendary" },
  { name: "winner_100", title: "Immortel", description: "Gagne 100 pacts", icon: "🦅", category: "wins", requirement: 100, rarity: "legendary" },

  // Séries
  { name: "streak_3", title: "Série de 3", description: "3 victoires d'affilée", icon: "🎯", category: "streak", requirement: 3, rarity: "common" },
  { name: "streak_5", title: "Série de 5", description: "5 victoires d'affilée", icon: "💫", category: "streak", requirement: 5, rarity: "rare" },
  { name: "streak_10", title: "Inarrêtable", description: "10 victoires d'affilée", icon: "⚡", category: "streak", requirement: 10, rarity: "epic" },
  { name: "streak_20", title: "Invincible", description: "20 victoires d'affilée", icon: "💎", category: "streak", requirement: 20, rarity: "legendary" },
  { name: "streak_50", title: "Machine", description: "50 victoires d'affilée", icon: "🤖", category: "streak", requirement: 50, rarity: "legendary" },

  // Gains
  { name: "earner_50", title: "Premier Gain", description: "Gagne 50€ au total", icon: "💵", category: "earnings", requirement: 50, rarity: "common" },
  { name: "earner_100", title: "Petit Gagnant", description: "Gagne 100€ au total", icon: "💰", category: "earnings", requirement: 100, rarity: "common" },
  { name: "earner_500", title: "Gros Gagnant", description: "Gagne 500€ au total", icon: "💸", category: "earnings", requirement: 500, rarity: "rare" },
  { name: "earner_1000", title: "Millionnaire", description: "Gagne 1000€ au total", icon: "🤑", category: "earnings", requirement: 1000, rarity: "epic" },
  { name: "earner_5000", title: "Magnat", description: "Gagne 5000€ au total", icon: "🏦", category: "earnings", requirement: 5000, rarity: "legendary" },
  { name: "earner_10000", title: "Tycoon", description: "Gagne 10000€ au total", icon: "💎", category: "earnings", requirement: 10000, rarity: "legendary" },

  // Social / Parrainage
  { name: "first_referral", title: "Ambassadeur", description: "Parraine ton premier ami", icon: "🤝", category: "social", requirement: 1, rarity: "common" },
  { name: "referral_3", title: "Connecté", description: "Parraine 3 amis", icon: "🔗", category: "social", requirement: 3, rarity: "common" },
  { name: "referral_5", title: "Influenceur", description: "Parraine 5 amis", icon: "📢", category: "social", requirement: 5, rarity: "rare" },
  { name: "referral_10", title: "Leader", description: "Parraine 10 amis", icon: "👥", category: "social", requirement: 10, rarity: "epic" },
  { name: "referral_25", title: "Superstar", description: "Parraine 25 amis", icon: "🌟", category: "social", requirement: 25, rarity: "legendary" },

  // Participation
  { name: "first_pact", title: "Premier Pas", description: "Rejoins ton premier pact", icon: "🚀", category: "participation", requirement: 1, rarity: "common" },
  { name: "pacts_5", title: "Actif", description: "Participe à 5 pacts", icon: "📈", category: "participation", requirement: 5, rarity: "common" },
  { name: "pacts_10", title: "Habitué", description: "Participe à 10 pacts", icon: "📊", category: "participation", requirement: 10, rarity: "common" },
  { name: "pacts_25", title: "Régulier", description: "Participe à 25 pacts", icon: "🎯", category: "participation", requirement: 25, rarity: "rare" },
  { name: "pacts_50", title: "Vétéran", description: "Participe à 50 pacts", icon: "🎖️", category: "participation", requirement: 50, rarity: "rare" },
  { name: "pacts_100", title: "Pro", description: "Participe à 100 pacts", icon: "🏅", category: "participation", requirement: 100, rarity: "epic" },
  { name: "pacts_250", title: "Expert", description: "Participe à 250 pacts", icon: "🥇", category: "participation", requirement: 250, rarity: "legendary" },

  // Catégories spécifiques
  { name: "sport_5", title: "Sportif", description: "Gagne 5 pacts Sport", icon: "🏃", category: "category_sport", requirement: 5, rarity: "common" },
  { name: "sport_20", title: "Athlète", description: "Gagne 20 pacts Sport", icon: "🏅", category: "category_sport", requirement: 20, rarity: "rare" },
  { name: "nutrition_5", title: "Healthy", description: "Gagne 5 pacts Nutrition", icon: "🥗", category: "category_nutrition", requirement: 5, rarity: "common" },
  { name: "nutrition_20", title: "Nutritionniste", description: "Gagne 20 pacts Nutrition", icon: "🥑", category: "category_nutrition", requirement: 20, rarity: "rare" },
  { name: "finance_5", title: "Économe", description: "Gagne 5 pacts Finance", icon: "💳", category: "category_finance", requirement: 5, rarity: "common" },
  { name: "finance_20", title: "Financier", description: "Gagne 20 pacts Finance", icon: "📈", category: "category_finance", requirement: 20, rarity: "rare" },
  { name: "productivity_5", title: "Productif", description: "Gagne 5 pacts Productivité", icon: "⚙️", category: "category_productivity", requirement: 5, rarity: "common" },
  { name: "productivity_20", title: "Ultra Productif", description: "Gagne 20 pacts Productivité", icon: "🚀", category: "category_productivity", requirement: 20, rarity: "rare" },
  { name: "wellness_5", title: "Zen", description: "Gagne 5 pacts Bien-être", icon: "🧘", category: "category_wellness", requirement: 5, rarity: "common" },
  { name: "wellness_20", title: "Maître Zen", description: "Gagne 20 pacts Bien-être", icon: "☯️", category: "category_wellness", requirement: 20, rarity: "rare" },
  { name: "learning_5", title: "Étudiant", description: "Gagne 5 pacts Apprentissage", icon: "📚", category: "category_learning", requirement: 5, rarity: "common" },
  { name: "learning_20", title: "Érudit", description: "Gagne 20 pacts Apprentissage", icon: "🎓", category: "category_learning", requirement: 20, rarity: "rare" },

  // Création de pacts
  { name: "creator_1", title: "Créateur", description: "Crée ton premier pact", icon: "✨", category: "creation", requirement: 1, rarity: "common" },
  { name: "creator_5", title: "Organisateur", description: "Crée 5 pacts", icon: "📝", category: "creation", requirement: 5, rarity: "common" },
  { name: "creator_10", title: "Animateur", description: "Crée 10 pacts", icon: "🎪", category: "creation", requirement: 10, rarity: "rare" },
  { name: "creator_25", title: "Leader Pact", description: "Crée 25 pacts", icon: "👔", category: "creation", requirement: 25, rarity: "epic" },

  // Validation communautaire
  { name: "validator_5", title: "Juge", description: "Vote sur 5 preuves", icon: "⚖️", category: "validation", requirement: 5, rarity: "common" },
  { name: "validator_25", title: "Arbitre", description: "Vote sur 25 preuves", icon: "🔍", category: "validation", requirement: 25, rarity: "rare" },
  { name: "validator_100", title: "Grand Juge", description: "Vote sur 100 preuves", icon: "⚖️", category: "validation", requirement: 100, rarity: "epic" },

  // Ponctualité
  { name: "early_bird_5", title: "Matinal", description: "Soumets 5 preuves avant midi", icon: "🌅", category: "timing", requirement: 5, rarity: "common" },
  { name: "night_owl_5", title: "Couche-tard", description: "Soumets 5 preuves après 22h", icon: "🦉", category: "timing", requirement: 5, rarity: "common" },
  { name: "last_minute_3", title: "Dernière Minute", description: "Soumets 3 preuves dans la dernière heure", icon: "⏰", category: "timing", requirement: 3, rarity: "rare" },

  // Groupes
  { name: "group_creator", title: "Fondateur", description: "Crée ton premier groupe", icon: "🏠", category: "groups", requirement: 1, rarity: "common" },
  { name: "group_5", title: "Social", description: "Rejoins 5 groupes", icon: "👨‍👩‍👧‍👦", category: "groups", requirement: 5, rarity: "rare" },

  // Spéciaux
  { name: "early_adopter", title: "Early Adopter", description: "Parmi les 1000 premiers utilisateurs", icon: "🌱", category: "special", requirement: 1, rarity: "legendary" },
  { name: "sponsor_win", title: "Sponsor Winner", description: "Gagne un pact sponsorisé", icon: "🎁", category: "special", requirement: 1, rarity: "rare" },
  { name: "perfect_month", title: "Mois Parfait", description: "100% de victoires en 1 mois (min 10 pacts)", icon: "📅", category: "special", requirement: 1, rarity: "epic" },
  { name: "comeback_king", title: "Roi du Comeback", description: "Gagne après 3 défaites consécutives", icon: "👊", category: "special", requirement: 1, rarity: "rare" },
  { name: "high_roller", title: "High Roller", description: "Mise 100€ ou plus sur un seul pact", icon: "🎰", category: "special", requirement: 1, rarity: "epic" },
  { name: "big_win", title: "Jackpot", description: "Gagne plus de 500€ sur un seul pact", icon: "🎉", category: "special", requirement: 1, rarity: "legendary" },
  { name: "complete_profile", title: "Profil Complet", description: "Complète ton profil à 100%", icon: "✅", category: "special", requirement: 1, rarity: "common" },
  { name: "first_deposit", title: "Premier Dépôt", description: "Effectue ton premier dépôt", icon: "💳", category: "special", requirement: 1, rarity: "common" },
  { name: "weekend_warrior", title: "Guerrier du Weekend", description: "Gagne 10 pacts le weekend", icon: "🗓️", category: "special", requirement: 10, rarity: "rare" },
];

// Initialiser les badges dans la base (à appeler une fois)
export const seedBadges = mutation({
  handler: async (ctx) => {
    for (const badge of BADGE_DEFINITIONS) {
      const existing = await ctx.db
        .query("badges")
        .withIndex("by_name", (q) => q.eq("name", badge.name))
        .first();

      if (!existing) {
        await ctx.db.insert("badges", badge);
      }
    }
    return { seeded: BADGE_DEFINITIONS.length };
  },
});

// Vérifier et débloquer les badges pour un utilisateur
export const checkAndUnlockBadges = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const badges = await ctx.db.query("badges").collect();
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const unlockedBadgeIds = userBadges.map((ub) => ub.badgeId);
    const newlyUnlocked = [];

    for (const badge of badges) {
      // Skip si déjà débloqué
      if (unlockedBadgeIds.includes(badge._id)) continue;

      let shouldUnlock = false;

      switch (badge.category) {
        case "wins":
          shouldUnlock = (user.totalWins || 0) >= badge.requirement;
          break;
        case "streak":
          shouldUnlock = (user.bestStreak || 0) >= badge.requirement;
          break;
        case "earnings":
          shouldUnlock = (user.totalEarnings || 0) >= badge.requirement;
          break;
        case "social":
          shouldUnlock = (user.referralCount || 0) >= badge.requirement;
          break;
        case "participation":
          shouldUnlock = (user.totalPacts || 0) >= badge.requirement;
          break;
      }

      if (shouldUnlock) {
        await ctx.db.insert("userBadges", {
          userId: args.userId,
          badgeId: badge._id,
          unlockedAt: Date.now(),
        });

        // Créer notification
        await ctx.db.insert("notifications", {
          userId: args.userId,
          type: "badge_unlocked",
          title: `Badge débloqué: ${badge.title}`,
          body: badge.description,
          data: JSON.stringify({ badgeId: badge._id, badgeName: badge.name }),
          read: false,
          createdAt: Date.now(),
        });

        // Créer activité feed
        await ctx.db.insert("activityFeed", {
          userId: args.userId,
          type: "badge_unlocked",
          targetId: badge._id,
          targetType: "badge",
          metadata: JSON.stringify({ badgeTitle: badge.title, badgeIcon: badge.icon }),
          createdAt: Date.now(),
        });

        newlyUnlocked.push(badge);
      }
    }

    return newlyUnlocked;
  },
});

// Récupérer les badges d'un utilisateur
export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const enriched = await Promise.all(
      userBadges.map(async (ub) => {
        const badge = await ctx.db.get(ub.badgeId);
        return { ...ub, badge };
      })
    );

    return enriched.sort((a, b) => b.unlockedAt - a.unlockedAt);
  },
});

// Récupérer tous les badges avec le statut pour un utilisateur
export const getAllBadgesWithStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const badges = await ctx.db.query("badges").collect();
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const user = await ctx.db.get(args.userId);
    const unlockedBadgeIds = userBadges.map((ub) => ub.badgeId);

    return badges.map((badge) => {
      const isUnlocked = unlockedBadgeIds.includes(badge._id);
      const userBadge = userBadges.find((ub) => ub.badgeId === badge._id);

      // Calculer la progression
      let progress = 0;
      if (user) {
        switch (badge.category) {
          case "wins":
            progress = Math.min(100, ((user.totalWins || 0) / badge.requirement) * 100);
            break;
          case "streak":
            progress = Math.min(100, ((user.bestStreak || 0) / badge.requirement) * 100);
            break;
          case "earnings":
            progress = Math.min(100, ((user.totalEarnings || 0) / badge.requirement) * 100);
            break;
          case "social":
            progress = Math.min(100, ((user.referralCount || 0) / badge.requirement) * 100);
            break;
          case "participation":
            progress = Math.min(100, ((user.totalPacts || 0) / badge.requirement) * 100);
            break;
        }
      }

      return {
        ...badge,
        isUnlocked,
        unlockedAt: userBadge?.unlockedAt,
        progress: Math.round(progress),
      };
    });
  },
});

// Récupérer les badges par catégorie
export const getBadgesByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("badges")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});
