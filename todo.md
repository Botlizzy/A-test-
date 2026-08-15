# Update checklist

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
