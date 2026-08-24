# Confirmation-email delivery findings

- Application signup code calls `supabase.auth.signUp` with `emailRedirectTo: getConfirmationRedirect(window.location.origin)`.
- The current app fallback is `https://streamvideo-h2f3nxnx.manus.space/?confirmed=1`; live public origins are preserved.
- The app offers `Resend Confirmation Email` after a signup with no session.
- Current `.manus-logs` contain no signup or resend request from the reported attempt, so they cannot prove a provider response.
- Supabase Sign In / Providers page loaded authenticated and shows Email provider Enabled.
- Supabase User Signups section shows Confirm email enabled.
- Supabase displayed a banner saying it is investigating a technical issue, which may affect dashboard/auth services.
- Supabase provider and confirmation settings therefore appear enabled; remaining likely causes are provider delivery/rate limits, SMTP configuration, spam/quarantine, or a transient Supabase incident.

## Rate-limit page

The authenticated Supabase Rate Limits page loaded but showed only a skeleton/empty content state rather than numeric limits. The navigation exposes separate Email templates and URL Configuration sections. No numeric quota or SMTP setting was visible in the loaded page.

## URL configuration

The Supabase URL Configuration page opened but remained in a skeleton/loading state, so the current Site URL and redirect allow-list could not be read from the dashboard. This means the application redirect fix is deployed, but the Supabase allow-list still needs direct verification in the dashboard if delivery or link opening continues to fail.

## Email settings page

The Supabase Emails page loaded and exposes separate Templates and SMTP Settings sections, but the template configuration itself remained in a skeleton/loading state. The project therefore has email authentication enabled, but the dashboard evidence does not show that a custom SMTP provider is configured. The current Supabase dashboard also displayed a technical-issue banner during provider inspection.
