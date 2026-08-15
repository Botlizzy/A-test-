# Update checklist

## Manual premium verification

- [x] Preserve the existing app while completing the full-stack upgrade merge.
- [x] Add premium entitlement and transaction-reference persistence.
- [x] Restrict admin verification to the two approved email addresses.
- [x] Add WhatsApp payment inquiry redirect and customer-ID lookup.
- [x] Add activate/revoke controls, validation, audit fields, and access feedback.
- [x] Run tests/build, sync, and publish the workflow.

## Verified premium payments

- [ ] Resolve the full-stack upgrade conflicts without losing the existing app.
- [ ] Use an official merchant payment provider and server-side webhook verification.
- [ ] Do not route customer payments to an unverified personal gift-card or PalmPay destination.
- [ ] Gate premium access only on verified paid subscription status.

## Stripe premium pricing

- [ ] Inspect Stripe integration state and supported project setup.
- [ ] Add subscription plan configuration and checkout entry points.
- [ ] Build the Eliminator premium pricing page and navigation.
- [ ] Validate payment states, build, sync, and publish.

## In-site playback and monetization

- [x] Confirm the current API has no direct video stream field.
- [x] Add direct MP4/HLS support without forcing external redirects.
- [x] Add an in-site unavailable state when the API returns metadata only.
- [x] Add a monetization-ready placement and document the required ad/payment IDs.
- [x] Verify build, sync, and publish the revision.

## Branding revision

- [x] Update site title and visible wordmark to Eliminator Streaming Platform and Multitools.
- [x] Add feedback mailto contact for elijahchinecheremonah@gmail.com.
- [x] Introduce a restrained red accent while preserving the blue-and-white foundation.
- [x] Validate branding, build, and publish the revision.

## Avatar upload

- [x] Add Supabase Storage avatar upload and file validation.
- [x] Persist avatar URL in the profiles table and auth metadata.
- [x] Render avatar preview and upload state on the profile page.
- [x] Add storage bucket/RLS setup instructions and verify the production build.

## Profile page

- [x] Add authenticated profile route and navigation.
- [x] Load profile details from Supabase and fall back to auth metadata.
- [x] Save editable profile fields with validation and feedback.
- [x] Verify build, responsive layout, and publish the feature.

## Production configuration repair

- [ ] Inspect the live configuration path and current Supabase environment handling.
- [ ] Add a production-safe configuration handoff that works with the selected hosting setup.
- [ ] Validate account creation and auth initialization behavior.
- [ ] Build, save a checkpoint, and redeploy the fixed version.

- [x] Inspect the deployed page failure and current project configuration.
- [x] Confirm the current Supabase connection path and required environment variables.
- [x] Add Supabase authentication setup for login, account creation, session persistence, and sign-out.
- [x] Store account profile details in Supabase without handling raw passwords directly.
- [x] Protect the video page behind authentication while keeping auth pages reachable.
- [x] Make API video cards render reliably even when thumbnail URLs or response fields vary.
- [x] Ensure Vercel-style static deployment serves the SPA routes correctly.
- [x] Run typecheck/build and verify representative desktop/mobile flows.
- [ ] Sync the completed changes to the selected repository and save a recoverable checkpoint.
