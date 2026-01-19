/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as badges from "../badges.js";
import type * as challenges from "../challenges.js";
import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as friends from "../friends.js";
import type * as groups from "../groups.js";
import type * as maintenance from "../maintenance.js";
import type * as notifications from "../notifications.js";
import type * as participations from "../participations.js";
import type * as proofs from "../proofs.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as referrals from "../referrals.js";
import type * as rewards from "../rewards.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  badges: typeof badges;
  challenges: typeof challenges;
  chat: typeof chat;
  crons: typeof crons;
  feed: typeof feed;
  files: typeof files;
  friends: typeof friends;
  groups: typeof groups;
  maintenance: typeof maintenance;
  notifications: typeof notifications;
  participations: typeof participations;
  proofs: typeof proofs;
  pushNotifications: typeof pushNotifications;
  referrals: typeof referrals;
  rewards: typeof rewards;
  seed: typeof seed;
  stats: typeof stats;
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
