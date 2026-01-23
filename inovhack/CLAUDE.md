# PACT - Context for Claude

## Project Status: PRODUCTION READY

**Hackathon: WON** ✅
**Current Phase: Ready for App Store / TestFlight release**

## What is PACT?

PACT is a social betting app where users create challenges ("pacts") with friends, bet money on completing them, and submit photo/video proofs. Winners split the pot.

## Tech Stack

- **Frontend**: React Native + Expo (SDK 53)
- **Backend**: Convex (serverless)
- **Auth**: Clerk
- **Payments**: Stripe (Connect + Identity)
- **Language**: TypeScript

## Key Architecture Decisions

1. **NO AI validation** - Proofs are validated manually by challenge organizer
2. **Disputes** resolved by PACT admins (not AI)
3. **Stripe Connect Express** for payouts to winners
4. **Stripe Identity** for KYC verification before withdrawals

## What's DONE ✅

### Core Features
- Auth (Clerk email/password + forgot password flow)
- Social sign-in UI (Google/Apple buttons - ready for configuration)
- Challenge creation & participation with precise hour picker
- Proof submission with photos/videos
- Organizer validation flow with 24h grace period
- Dispute system + Admin Panel
- Wallet/balance logic
- Stripe real API integration (stripeActions.ts)
- Stripe webhooks (http.ts)
- Stripe KYC (Identity)
- CGU/Privacy policy (legally compliant for France)
- Onboarding flow with referral code input
- UI/UX (Luma-inspired design)

### Production Features
- **Auto-finalize cron job** - Runs hourly, handles 24h validation grace period
- **Admin Panel** - Full admin interface in app/admin.tsx (disputes, users, challenges)
- **Rate Limiting** - convex/rateLimit.ts (configurable per action)
- **Push Notifications** - Fully wired (Expo Push API)
- **Badges/Achievements** - 50+ badges, auto-awarded on wins/participations
- **Referrals System** - Code generation, sharing, bonus distribution

### Security Audit Completed
- API keys moved to environment variables
- Convex mutations properly authenticated
- Legal pages have placeholders for company info (SIRET, RCS)

## Before Publishing: Required Steps

1. **Company Registration**
   - Register company (SIRET, RCS)
   - Update legal pages with real company info

2. **Convex Environment Variables**
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - FEATHERLESS_API_KEY (for AI features)

3. **EAS Build**
   - Configure app.json with proper bundle ID
   - `eas build --platform ios` for TestFlight
   - `eas build --platform android` for Play Store

4. **Clerk Configuration**
   - Configure Google OAuth
   - Configure Apple OAuth
   - Update auth.tsx social buttons to use real OAuth

## File Structure

```
/app                 # Expo Router screens
  /legal             # CGU, Privacy pages
  admin.tsx          # Admin panel
  referrals.tsx      # Referral code management
  badges.tsx         # Achievements screen
/components          # Reusable UI components
/convex              # Backend (mutations, queries, actions)
  - stripeActions.ts # Real Stripe API calls
  - http.ts          # Webhooks endpoint
  - stripeWebhooks.ts # Webhook handlers
  - admin.ts         # Admin backend
  - badges.ts        # Badge definitions & logic
  - referrals.ts     # Referral system
  - rateLimit.ts     # Rate limiting
  - rewards.ts       # Auto-finalize & distribution
/providers           # Context providers (Auth, Stripe, Theme)
/constants           # Theme, categories
```

## Environment Variables

### .env.local (client)
- EXPO_PUBLIC_CONVEX_URL
- EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
- EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

### Convex Dashboard (server)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- FEATHERLESS_API_KEY

## Important Notes

- Expo Go = simulated payments (no native Stripe SDK)
- Development build / EAS build = real Stripe payments
- For TestFlight: `eas build --platform ios`
- Apple Developer account required (99€/year)
- Google Play Developer account required (25€ one-time)

## Current Priority

**GOAL: Ship to TestFlight/App Store**

All critical features are implemented. Focus on:
1. Company registration
2. EAS build configuration
3. OAuth configuration (Google/Apple)
4. TestFlight deployment
