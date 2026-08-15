# Update checklist

## Signup rate-limit repair

- [x] Detect Supabase email-rate-limit errors and show a clear recovery message.
- [x] Prevent repeated signup submissions with loading and cooldown behavior.
- [x] Add an explicit post-rate-limit recovery action that routes existing users to Sign in or safely retries after cooldown.
- [x] Validate signup recovery UI, build, tests, GitHub push, and publish.

## WhatsApp verification notifications

- [x] Add Supabase verification-request table, RLS, and status fields.
- [x] Create a request record when a customer opens WhatsApp Premium verification.
- [x] Show unread request count and request details to approved admins.
- [x] Preserve selected requests through customer lookup, prevent cross-customer linking, and allow transaction-reference entry before activation.
- [x] Verify the selected request belongs to the currently loaded customer before activation or revocation.
- [x] Run tests/build, push all changes to GitHub, and publish the workflow.

## Playback and premium status polish

- [x] Replace the metadata-only play error with a clear, non-alarming in-page explanation and next action; the notice now renders in the player with a Refresh feed action.
- [x] Add active/inactive/verification-pending Premium status to the user profile; revoked records are now distinguished using the admin audit field.
- [x] Validate responsive presentation, entitlement lookup, tests, and production build; mobile screenshots were reviewed.
- [x] Sync and publish the polish update.

## Manual premium verification

- [x] Preserve the existing app while completing the full-stack upgrade merge.
- [x] Add premium entitlement and transaction-reference persistence.
- [x] Restrict admin verification to the two approved email addresses.
- [x] Add WhatsApp payment inquiry redirect and customer-ID lookup.
- [x] Add activate/revoke controls, validation, audit fields, and access feedback.
- [x] Run tests/build, sync, and publish the workflow.

## Verified premium payments

- [x] Resolve the full-stack upgrade conflicts without losing the existing app.
- [x] Use an official merchant payment provider and server-side webhook verification — superseded by the user’s explicit manual WhatsApp verification choice; no unverified automated payment flow was added.
- [x] Do not route customer payments to an unverified personal gift-card or PalmPay destination — the site only opens WhatsApp and requires admin review.
- [x] Gate premium access through approved-admin manual entitlement activation instead of automated subscription status; the app now reads `premium_entitlements.active` and shows a locked room otherwise.

## Stripe premium pricing

- [x] Inspect Stripe integration state and supported project setup; Stripe was unavailable for this region and was not used.
- [x] Add the manual Premium access page and WhatsApp entry point selected by the user instead of Stripe Checkout.
- [x] Build the Eliminator Premium access page and navigation.
- [x] Validate manual verification states, build, sync, and publish.

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

- [x] Inspect the live configuration path and current Supabase environment handling.
- [x] Add a production-safe configuration handoff that works with the selected hosting setup.
- [x] Validate account creation and auth initialization behavior.
- [x] Build, save a checkpoint, and redeploy the fixed version.

- [x] Inspect the deployed page failure and current project configuration.
- [x] Confirm the current Supabase connection path and required environment variables.
- [x] Add Supabase authentication setup for login, account creation, session persistence, and sign-out.
- [x] Store account profile details in Supabase without handling raw passwords directly.
- [x] Protect the video page behind authentication while keeping auth pages reachable.
- [x] Make API video cards render reliably even when thumbnail URLs or response fields vary.
- [x] Ensure Vercel-style static deployment serves the SPA routes correctly.
- [x] Run typecheck/build and verify representative desktop/mobile flows.
- [x] Sync the completed changes to the selected repository and save a recoverable checkpoint.
