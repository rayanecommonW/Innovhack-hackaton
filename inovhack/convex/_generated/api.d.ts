/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as authHelper from "../authHelper.js";
import type * as badges from "../badges.js";
import type * as challenges from "../challenges.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as directMessages from "../directMessages.js";
import type * as disputes from "../disputes.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as friends from "../friends.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as kyc from "../kyc.js";
import type * as maintenance from "../maintenance.js";
import type * as notifications from "../notifications.js";
import type * as participations from "../participations.js";
import type * as payout from "../payout.js";
import type * as proofVerification from "../proofVerification.js";
import type * as proofs from "../proofs.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as rateLimit from "../rateLimit.js";
import type * as referrals from "../referrals.js";
import type * as rewards from "../rewards.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as stripe from "../stripe.js";
import type * as stripeActions from "../stripeActions.js";
import type * as stripeWebhooks from "../stripeWebhooks.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  authHelper: typeof authHelper;
  badges: typeof badges;
  challenges: typeof challenges;
  chat: typeof chat;
  crons: typeof crons;
  directMessages: typeof directMessages;
  disputes: typeof disputes;
  feed: typeof feed;
  files: typeof files;
  friends: typeof friends;
  groups: typeof groups;
  http: typeof http;
  kyc: typeof kyc;
  maintenance: typeof maintenance;
  notifications: typeof notifications;
  participations: typeof participations;
  payout: typeof payout;
  proofVerification: typeof proofVerification;
  proofs: typeof proofs;
  pushNotifications: typeof pushNotifications;
  rateLimit: typeof rateLimit;
  referrals: typeof referrals;
  rewards: typeof rewards;
  seed: typeof seed;
  stats: typeof stats;
  stripe: typeof stripe;
  stripeActions: typeof stripeActions;
  stripeWebhooks: typeof stripeWebhooks;
  transactions: typeof transactions;
  users: typeof users;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
