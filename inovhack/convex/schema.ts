import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Utilisateurs
  users: defineTable({
    clerkId: v.optional(v.string()), // Clerk auth ID
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    bio: v.optional(v.string()), // Description du profil
    profileImageId: v.optional(v.id("_storage")), // Photo de profil (Convex storage)
    profileImageUrl: v.optional(v.string()), // URL de la photo de profil
    balance: v.number(),
    totalWins: v.number(),
    totalLosses: v.number(),
    // Stats additionnelles
    currentStreak: v.optional(v.number()), // Série de victoires en cours
    bestStreak: v.optional(v.number()), // Meilleure série
    totalEarnings: v.optional(v.number()), // Gains totaux
    totalPacts: v.optional(v.number()), // Nombre total de pacts
    successRate: v.optional(v.number()), // Taux de réussite (0-100)
    // Parrainage
    referralCode: v.optional(v.string()), // Code unique de parrainage
    referredBy: v.optional(v.id("users")), // Qui l'a parrainé
    referralCount: v.optional(v.number()), // Nombre de filleuls
    referralEarnings: v.optional(v.number()), // Gains via parrainage
    // Notifications
    pushToken: v.optional(v.string()), // Token pour push notifications
    notificationsEnabled: v.optional(v.boolean()),
    // Modération
    blockedUsers: v.optional(v.array(v.id("users"))), // Utilisateurs bloqués
    isBlocked: v.optional(v.boolean()), // Compte bloqué par admin
    isAdmin: v.optional(v.boolean()), // Admin PACT (peut résoudre les litiges)
    // Onboarding
    onboardingCompleted: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    // Stripe Connect
    stripeConnectedAccountId: v.optional(v.string()),
    stripeAccountStatus: v.optional(v.string()), // "none", "pending", "verified", "restricted"
    stripeCustomerId: v.optional(v.string()),
    // KYC (Stripe Identity)
    kycStatus: v.optional(v.string()), // "none", "pending", "verified", "rejected", "requires_input"
    kycVerified: v.optional(v.boolean()),
    kycVerifiedAt: v.optional(v.number()),
    kycSessionId: v.optional(v.string()),
    kycStartedAt: v.optional(v.number()),
    // Legal acceptance
    termsAcceptedAt: v.optional(v.number()),
    privacyAcceptedAt: v.optional(v.number()),
    // Age verification
    birthDate: v.optional(v.number()), // Timestamp de la date de naissance
    ageVerified: v.optional(v.boolean()), // A confirmé avoir 18+
    ageVerifiedAt: v.optional(v.number()), // Quand il a confirmé
    // Chargeback tracking
    chargebackCount: v.optional(v.number()), // Number of chargebacks received
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_clerkId", ["clerkId"])
    .index("by_referral_code", ["referralCode"])
    .index("by_stripe_account", ["stripeConnectedAccountId"]),

  // Défis
  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.string(), // "public", "friends", "group"
    creatorId: v.id("users"),
    groupId: v.optional(v.id("groups")), // Si pact dans un groupe

    // Code invitation (pour pacts entre amis)
    inviteCode: v.optional(v.string()),

    // Objectif du défi
    goal: v.optional(v.string()),
    goalValue: v.optional(v.number()),
    goalUnit: v.optional(v.string()),

    // Preuve requise
    proofType: v.string(), // "screenshot", "photo", "text", "number"
    proofDescription: v.string(),
    proofValidationCriteria: v.string(),

    // Mise minimum
    minBet: v.number(),

    // Dates
    startDate: v.number(),
    endDate: v.number(), // Timestamp exact de fin (inclut l'heure)

    // Période de grâce pour validation (24h après endDate)
    validationDeadline: v.optional(v.number()), // endDate + 24h

    // Status
    status: v.string(), // "pending", "active", "completed", "cancelled", "distributing", "validating"

    // Sponsor (pour pacts B2B)
    sponsorId: v.optional(v.string()),
    sponsorName: v.optional(v.string()),
    sponsorPromoCode: v.optional(v.string()),
    sponsorDiscount: v.optional(v.string()),
    sponsorReward: v.optional(v.number()),
    sponsorRewardText: v.optional(v.string()),

    // Autres champs
    durationDays: v.optional(v.number()),
    maxParticipants: v.optional(v.number()),
    currentParticipants: v.optional(v.number()),
    totalPot: v.optional(v.number()), // Pot total
    winnersCount: v.optional(v.number()), // Nombre de gagnants
    losersCount: v.optional(v.number()), // Nombre de perdants

    // Group pact settings
    allowMembersToJoin: v.optional(v.boolean()), // Allow group members to join
    groupValidationDeadlineHours: v.optional(v.number()), // Hours for group to vote (default 24h)
    groupValidationThreshold: v.optional(v.number()), // Percentage needed (default 50)
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_creator", ["creatorId"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_sponsor", ["sponsorId"])
    .index("by_group", ["groupId"])
    .index("by_end_date", ["endDate"]),

  // Participations aux défis
  participations: defineTable({
    challengeId: v.id("challenges"),
    usertId: v.id("users"),
    betAmount: v.number(),
    status: v.string(), // "active", "pending_proof", "pending_validation", "won", "lost"
    joinedAt: v.number(),
    proofSubmittedAt: v.optional(v.number()),
    validatedAt: v.optional(v.number()),
    earnings: v.optional(v.number()), // Gains si gagnant
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["usertId"])
    .index("by_challenge_user", ["challengeId", "usertId"])
    .index("by_status", ["status"]),

  // Preuves soumises
  proofs: defineTable({
    participationId: v.id("participations"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),

    // Contenu de la preuve
    proofContent: v.string(), // URL de l'image ou texte
    proofType: v.optional(v.string()), // "image", "text", "link"
    proofValue: v.optional(v.number()),

    // Validation par l'organisateur
    organizerValidation: v.optional(v.string()), // "pending", "approved", "rejected"
    validatedBy: v.optional(v.id("users")), // ID de l'organisateur qui a validé
    organizerComment: v.optional(v.string()),

    // Validation communautaire (pour pacts amis/groupe)
    communityValidation: v.optional(v.string()), // "pending", "approved", "rejected"
    approveCount: v.optional(v.number()),
    rejectCount: v.optional(v.number()),
    vetoCount: v.optional(v.number()), // Legacy - votes contre
    requiredVotes: v.optional(v.number()), // Nombre de votes requis

    // Group validation specific
    groupValidationDeadline: v.optional(v.number()), // Timestamp until when group can vote
    totalGroupMembers: v.optional(v.number()), // Total members in group at time of submission
    validationPercentage: v.optional(v.number()), // Percentage threshold needed (default 50%)

    // Legacy - Validation IA (gardé pour compatibilité)
    aiValidation: v.optional(v.string()),
    aiComment: v.optional(v.string()),

    submittedAt: v.number(),
    validatedAt: v.optional(v.number()),
  })
    .index("by_participation", ["participationId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_organizer_validation", ["organizerValidation"]),

  // Votes communautaires sur les preuves
  votes: defineTable({
    proofId: v.id("proofs"),
    voterId: v.id("users"),
    challengeId: v.id("challenges"),
    voteType: v.string(), // "approve" ou "reject"
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_voter", ["voterId"])
    .index("by_proof_voter", ["proofId", "voterId"]),

  // Commentaires sur les preuves
  proofComments: defineTable({
    proofId: v.id("proofs"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_user", ["userId"]),

  // Réactions sur les preuves
  proofReactions: defineTable({
    proofId: v.id("proofs"),
    userId: v.id("users"),
    emoji: v.string(), // "🔥", "💪", "👏", "❤️", "😮"
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_proof_user", ["proofId", "userId"]),

  // Messages de chat sur les preuves (entre user et organisateur)
  proofMessages: defineTable({
    proofId: v.id("proofs"),
    userId: v.id("users"),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_user", ["userId"])
    .index("by_proof_created", ["proofId", "createdAt"]),

  // Gains distribués
  rewards: defineTable({
    challengeId: v.id("challenges"),
    participationId: v.optional(v.id("participations")),
    userId: v.id("users"),
    amount: v.number(),
    type: v.optional(v.string()), // "win", "refund", "bonus", "referral", "sponsor"
    promoCode: v.optional(v.string()),
    promoSponsor: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // Transactions (dépôts/retraits)
  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(), // "deposit", "withdrawal", "bet", "win", "refund", "referral_bonus"
    method: v.optional(v.string()), // "card", "apple_pay", "google_pay", "bank_transfer"
    status: v.string(), // "pending", "completed", "failed", "cancelled"
    reference: v.optional(v.string()), // ID externe (Stripe, etc.)
    description: v.optional(v.string()),
    relatedChallengeId: v.optional(v.id("challenges")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"])
    .index("by_stripe_payment", ["stripePaymentIntentId"]),

  // Badges / Achievements
  badges: defineTable({
    name: v.string(), // "first_win", "streak_5", "streak_10", "big_winner", etc.
    title: v.string(), // "Première Victoire", "Série de 5", etc.
    description: v.string(),
    icon: v.string(), // Emoji ou nom d'icône
    category: v.string(), // "streak", "wins", "social", "special"
    requirement: v.number(), // Valeur requise pour débloquer
    rarity: v.string(), // "common", "rare", "epic", "legendary"
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // Badges débloqués par les utilisateurs
  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    unlockedAt: v.number(),
    progress: v.optional(v.number()), // Progression vers le prochain palier
  })
    .index("by_user", ["userId"])
    .index("by_badge", ["badgeId"])
    .index("by_user_badge", ["userId", "badgeId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "challenge_ending", "proof_required", "proof_validated", "you_won", "you_lost", "new_participant", "vote_required", "badge_unlocked", "referral_bonus"
    title: v.string(),
    body: v.string(),
    data: v.optional(v.string()), // JSON stringifié pour données additionnelles
    read: v.boolean(),
    createdAt: v.number(),
    scheduledFor: v.optional(v.number()), // Pour notifications programmées
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_scheduled", ["scheduledFor"]),

  // Feed d'activité
  activityFeed: defineTable({
    userId: v.id("users"), // L'utilisateur qui a fait l'action
    type: v.string(), // "joined_pact", "submitted_proof", "won_pact", "lost_pact", "badge_unlocked", "streak"
    targetId: v.optional(v.string()), // ID de l'objet concerné (challenge, proof, badge)
    targetType: v.optional(v.string()), // "challenge", "proof", "badge"
    metadata: v.optional(v.string()), // JSON pour données additionnelles
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"])
    .index("by_type", ["type"]),

  // Parrainages
  referrals: defineTable({
    referrerId: v.id("users"), // Le parrain
    referredId: v.id("users"), // Le filleul
    status: v.string(), // "pending", "completed", "rewarded"
    bonusAmount: v.number(), // Montant du bonus
    referrerBonus: v.optional(v.number()), // Bonus du parrain
    referredBonus: v.optional(v.number()), // Bonus du filleul
    firstPactCompleted: v.optional(v.boolean()), // Le filleul a-t-il fait son premier pact?
    createdAt: v.number(),
    rewardedAt: v.optional(v.number()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredId"])
    .index("by_status", ["status"]),

  // Groupes d'amis
  groups: defineTable({
    name: v.string(),
    creatorId: v.id("users"),
    inviteCode: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    memberCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_invite_code", ["inviteCode"]),

  // Membres des groupes
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.string(), // "admin", "moderator", "member"
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  // Tâches récurrentes de groupe
  groupTasks: defineTable({
    groupId: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.string(),
    betAmount: v.number(),
    creatorId: v.id("users"),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_status", ["status"]),

  // Progression des membres sur les tâches
  taskProgress: defineTable({
    taskId: v.id("groupTasks"),
    userId: v.id("users"),
    periodStart: v.number(),
    completed: v.boolean(),
    proofUrl: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_task_user", ["taskId", "userId"]),

  // Amis
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_friend", ["userId", "friendId"])
    .index("by_status", ["status"]),

  // Messages de chat pour les pacts
  messages: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    content: v.string(),
    type: v.string(), // "text", "system", "image"
    createdAt: v.number(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_created", ["challengeId", "createdAt"]),

  // Direct messages between users
  directMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    type: v.string(), // "text", "image", "proof_link"
    relatedProofId: v.optional(v.id("proofs")), // Link to proof if message is about a proof
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"])
    .index("by_created", ["createdAt"]),

  // Conversations (cached for quick lookup)
  conversations: defineTable({
    participantIds: v.array(v.id("users")), // [userId1, userId2] sorted
    lastMessageId: v.optional(v.id("directMessages")),
    lastMessageContent: v.optional(v.string()),
    lastMessageAt: v.number(),
    unreadCount: v.object({
      // Map of unread counts per user
    }),
  })
    .index("by_last_message", ["lastMessageAt"]),

  // Leaderboard cache (mis à jour périodiquement)
  leaderboard: defineTable({
    userId: v.id("users"),
    period: v.string(), // "all_time", "monthly", "weekly"
    category: v.optional(v.string()), // null = global, ou catégorie spécifique
    rank: v.number(),
    score: v.number(), // Basé sur les gains ou taux de réussite
    wins: v.number(),
    earnings: v.number(),
    updatedAt: v.number(),
  })
    .index("by_period", ["period"])
    .index("by_period_category", ["period", "category"])
    .index("by_user_period", ["userId", "period"])
    .index("by_user", ["userId"])
    .index("by_rank", ["period", "rank"]),

  // Vérifications de preuves (audit trail)
  proofVerifications: defineTable({
    proofId: v.id("proofs"),
    userId: v.id("users"),
    // Métadonnées de capture
    capturedAt: v.number(),
    deviceTime: v.number(),
    platform: v.string(),
    captureMethod: v.string(),
    imageHash: v.optional(v.string()),
    location: v.optional(v.string()), // JSON stringifié
    // Résultat de vérification
    serverSubmissionTime: v.number(),
    verificationScore: v.number(),
    verificationConfidence: v.string(), // "high", "medium", "low", "suspicious"
    verificationIssues: v.optional(v.string()),
    verifiedAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_user", ["userId"])
    .index("by_confidence", ["verificationConfidence"]),

  // Rate Limiting
  rateLimits: defineTable({
    identifier: v.string(), // userId ou IP
    action: v.string(), // Nom de l'action
    timestamp: v.number(),
  })
    .index("by_identifier_action", ["identifier", "action"])
    .index("by_timestamp", ["timestamp"]),

  // Litiges / Contestations
  disputes: defineTable({
    proofId: v.id("proofs"),
    challengeId: v.id("challenges"),
    disputerId: v.id("users"), // Qui conteste
    targetUserId: v.id("users"), // Contre qui (propriétaire de la preuve)
    reason: v.string(), // Raison de la contestation
    description: v.string(), // Description détaillée
    evidence: v.optional(v.string()), // Preuves supplémentaires (URLs)
    status: v.string(), // "pending", "under_review", "resolved_favor_disputer", "resolved_favor_target", "dismissed"
    resolution: v.optional(v.string()), // Explication de la résolution
    resolvedBy: v.optional(v.id("users")), // Admin/organisateur qui a résolu
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_proof", ["proofId"])
    .index("by_challenge", ["challengeId"])
    .index("by_disputer", ["disputerId"])
    .index("by_target", ["targetUserId"])
    .index("by_status", ["status"]),

  // Admin Audit Logs - Track all admin actions for security and compliance
  auditLogs: defineTable({
    adminId: v.id("users"), // Admin who performed the action
    action: v.string(), // Action type: "resolve_dispute", "block_user", "toggle_admin", "cancel_challenge", etc.
    targetType: v.string(), // Type of target: "user", "challenge", "dispute", "transaction"
    targetId: v.optional(v.string()), // ID of the target (stored as string for flexibility)
    details: v.string(), // JSON stringified details of the action
    ipAddress: v.optional(v.string()), // IP address if available
    userAgent: v.optional(v.string()), // User agent if available
    result: v.string(), // "success" or "failure"
    errorMessage: v.optional(v.string()), // Error message if failed
    createdAt: v.number(),
  })
    .index("by_admin", ["adminId"])
    .index("by_action", ["action"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_timestamp", ["createdAt"]),
});
