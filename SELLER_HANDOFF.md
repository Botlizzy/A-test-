# Eliminator — Buyer Handoff

This archive contains the source code for **Eliminator Streaming Platform and Multitools**, a React, Vite, Express, tRPC, Supabase, and Drizzle application designed for mobile-first use. The archive intentionally excludes credentials, local runtime logs, generated build output, dependency folders, private deployment metadata, and session data.

## Included functionality

The project includes the public API directory, protected authentication flow, profiles, avatar storage integration, Premium Room, AI chat, image-generation workspaces, social boosters, APK Vault, lyrics search, football live scores, and Text-to-Speech Studio. The public homepage presents documented API references and copyable request snippets, while functional execution is reserved for authenticated Premium areas.

## Requirements

Use Node.js 22 or a compatible current Node.js release, pnpm 10, a Supabase project, and a MySQL-compatible database for the full-stack server template. Supabase Auth, database tables, Row Level Security policies, and Storage configuration are required for production authentication and profile features.

## Setup

1. Copy `.env.example` to `.env` and provide values for every required variable. Never commit `.env` or paste secrets into source files.
2. Install dependencies with `pnpm install`.
3. Apply the Drizzle schema using the project’s normal migration workflow. Review generated SQL before applying it to any production database.
4. Run `pnpm check` and `pnpm test`.
5. Start development with `pnpm dev`.
6. Create a production build with `pnpm build` and run it with `pnpm start`.

## Environment variables

The browser requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Supabase authentication. The server requires `DATABASE_URL` and `JWT_SECRET`. The remaining variables are integration or platform settings and should be supplied only when the related capability is enabled.

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase browser-safe anonymous key |
| `DATABASE_URL` | Server database connection string |
| `JWT_SECRET` | Server session signing secret |
| `BUILT_IN_FORGE_API_URL` | Server-side platform API base URL, if used |
| `BUILT_IN_FORGE_API_KEY` | Server-side platform API credential, if used |
| `VITE_FRONTEND_FORGE_API_URL` | Browser platform API base URL, if used |
| `VITE_FRONTEND_FORGE_API_KEY` | Browser-safe platform API credential, if used |
| `VITE_APP_ID` | OAuth/application identifier, if used |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL, if used |
| `OAUTH_SERVER_URL` | OAuth server URL, if used |
| `OWNER_OPEN_ID` | Owner identity used by the server, if used |
| `PORT` | Runtime port; the host may override it |

## Supabase redirect configuration

Set the Supabase Site URL to the buyer’s deployed HTTPS origin. Add the corresponding wildcard redirect, such as `https://buyer-domain.example/**`, in Authentication → URL Configuration. Do not retain the previous owner’s production URL unless the buyer explicitly controls that domain.

## Security and transfer notes

The seller must rotate any credentials that were ever exposed outside the protected deployment environment. The buyer should create new Supabase, database, OAuth, and third-party provider credentials under their own accounts, configure their own domain, and review all API provider terms before launch. This archive does not transfer ownership of third-party accounts, domains, Supabase projects, deployment projects, or private keys.

The archive is source code, not a transfer of live customer data. It excludes `.env` files, `.manus-logs`, `.git`, `node_modules`, `dist`, local screenshots, browser captures, and project-management metadata. Before resale, the buyer should replace branding, contact details, provider endpoints, admin allowlists, and any owner-specific access rules.

## Validation performed before packaging

The source was tested with Vitest and checked with the production build before packaging. The archive is scanned for private-key patterns, JWT-like tokens, provider secret prefixes, environment files, and runtime logs. A clean scan is a packaging check, not a substitute for rotating credentials or commissioning an independent security review.
