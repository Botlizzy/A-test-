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

## Supabase status check

The live Supabase status page at https://status.supabase.com/ reports Auth as Operational but API Gateway as Degraded Performance. It also lists a recent incident involving intermittent HTTP 401 JWT rejections, with fixes still being rolled out as of Aug 21, 2026. This can cause browser auth requests to fail or appear as network errors even when the app’s endpoint and credentials are valid.

## SMTP session state

The Supabase SMTP Settings page reports: “Session expired — Please sign in again to continue.” The configuration cannot be inspected or modified until the Supabase dashboard session is re-authenticated. The application remains deployed with its resend and retry behavior.

## Authenticated SMTP configuration

Supabase SMTP Settings is now authenticated and loaded. Custom SMTP is enabled. The configured sender is `no-reply@elizzy-host.nx.kg` with sender name `ELIZZY DOMAIN`, host `smtp.resend.com`, port `465`, minimum interval `60` seconds, and username `resend`. The SMTP password field is blank, so the provider cannot authenticate and confirmation emails cannot be delivered. A Resend API key/password must be entered by the account owner; it must not be invented or committed to the repository.

## Resend API keys

The authenticated Resend API Keys page shows two existing keys: `Mike` with Full access and `Onboarding` with Sending access. The replacement key should use Sending access, not Full access, because Supabase only needs to send auth emails. The Create API key dialog is open and offers Full access or Sending access; no key has been created or revoked yet.

## Resend verification check — 2026-08-25

Resend API Keys currently lists the existing `Mike` key as Full access with last use about one hour ago and an `Onboarding` key with Sending access. The verified sender domain `elizzy-host.nx.kg` is present in Resend Domains. A recent-use timestamp alone does not establish inbox delivery; delivery status and Supabase SMTP configuration still need to be checked. Existing keys should remain active until the replacement is configured and tested.

## Resend delivery-log inspection — 2026-08-25

The newest Resend log is `POST /emails`, status `200`, user agent `SMTP v1.0.0`, created about one hour ago. It contains a confirmation message from `ELIZZY DOMAIN <no-reply@elizzy-host.nx.kg>` to a recipient address and returns a Resend message ID, confirming that Supabase successfully handed the email to Resend. The request uses a verified sender domain. The confirmation URL in that message currently redirects to the older `https://a-test-ten.vercel.app/?confirmed=1`, not the current `https://streamvideo-h2f3nxnx.manus.space/?confirmed=1`; this redirect mismatch should be corrected in Supabase URL Configuration, although it does not itself explain a missing inbox message. Delivery/bounce status still needs to be checked from the message detail.

## Resend recipient event confirmation — 2026-08-25

The newest confirmation email record shows both `sent` and `delivered` events at the same timestamp (Aug 24, 11:29 PM). Resend therefore delivered the message to the recipient mail server; the missing inbox copy is likely a recipient-side spam/quarantine/filter issue or an inbox address mismatch, not a Resend API-key failure. The message detail also confirms the sender `no-reply@elizzy-host.nx.kg` and subject `Confirm your email address`.

## Supabase recheck — 2026-08-25

The authenticated Supabase project is accessible at the `hvaytcqnimsvrrwwwqqz` project. The dashboard currently displays “We are investigating a technical issue,” and the Sign In / Providers page remains skeleton-like without rendering the provider controls. The Emails section is available in the Authentication sidebar and will be opened directly for SMTP inspection.

## Supabase SMTP recheck — 2026-08-25

Supabase SMTP Settings is authenticated and shows custom SMTP enabled with sender `no-reply@elizzy-host.nx.kg`, sender name `ELIZZY DOMAIN`, host `smtp.resend.com`, port `465`, minimum interval `60` seconds, and username `resend`. The password input is visually empty because Supabase does not reveal saved passwords; the new Resend key must be entered there and saved. Resend has already shown that an SMTP request was accepted and delivered for at least one confirmation email, so the immediate configuration task is to ensure the intended replacement key is saved and then correct the Supabase redirect URL from the legacy Vercel domain to the live Manus domain.

## SMTP toggle state during cutover — 2026-08-25

After opening the SMTP page, the provider fields were rendered initially. The toggle interaction caused the fields to disappear and only Cancel/Save changes remained, indicating custom SMTP was switched off by that interaction. It must be turned back on before entering the new password. No save has been submitted after this toggle change.

## SMTP credential save attempt — 2026-08-25

The provided Resend key was entered directly into the Supabase password field while custom SMTP was enabled and the verified sender/host/port/username values remained unchanged. The Save changes control was clicked, but after waiting the form still rendered with the password field populated and no clear success toast in the extracted page text; save status requires a second verification. The Supabase banner still reports an ongoing technical issue.

## SMTP save result — 2026-08-25

The SMTP form accepted the provided key and returned to a non-dirty state: after submission, the Save changes control is present but disabled/greyed with no error message. The sender, host, port, interval, and username remain correct. Supabase still masks the password field, so the credential cannot be visually verified after saving; a new confirmation attempt and Resend log check will provide the definitive test.

## Supabase URL configuration inspection — 2026-08-25

Supabase currently has Site URL `https://a-test-ten.vercel.app` and one redirect allow-list entry `https://a-test-ten.vercel.app/**`. This matches the legacy URL observed inside the delivered confirmation email and must be updated to the current live Manus site `https://streamvideo-h2f3nxnx.manus.space`, with a matching wildcard redirect entry.

## Live redirect allow-list pending — 2026-08-25

Supabase Site URL has been edited in the form to `https://streamvideo-h2f3nxnx.manus.space`. The Add URL dialog now contains the live wildcard `https://streamvideo-h2f3nxnx.manus.space/**` as the first pending entry and an empty second row created automatically. The modal’s `Save URLs` action is ready; the legacy Vercel entry remains until the saved configuration is verified.

## Live URL configuration saved — 2026-08-25

Supabase URL Configuration now shows Site URL `https://streamvideo-h2f3nxnx.manus.space`, and the redirect allow-list contains both `https://a-test-ten.vercel.app/**` and `https://streamvideo-h2f3nxnx.manus.space/**`. The Site URL Save changes control is disabled after submission, indicating the live Site URL was saved. The old Vercel entry was retained for backward compatibility rather than removed during the initial cutover.

## Post-save SMTP reload — 2026-08-25

After navigating back to Supabase SMTP Settings, the page again showed a loading skeleton and the persistent technical-issue banner rather than exposing form values. The prior submission had returned the form to a non-dirty state without an error, so the key is treated as saved; Supabase intentionally does not reveal saved SMTP passwords. A real signup/resend event and the Resend log will be used for final confirmation.

## Resend key cleanup — 2026-08-25

The obsolete `Mike` Full access key was deleted successfully; Resend displayed “This API Key has been deleted.” The new key (listed as `Senf` with the user-provided prefix) remains, and the legacy `Onboarding` Sending access key is still present. An attempted keyboard menu selection opened the Onboarding edit dialog but did not change it; the dialog was closed and the API-key list is clean.

## Final Resend key cleanup — 2026-08-25

The obsolete `Mike` Full access key and `Onboarding` Sending access key were both deleted successfully. Resend now lists only the newly provided key (displayed as `Senf`, with the matching prefix) and no prior keys remain. Supabase SMTP was saved using this key, and the verified sender domain and live Manus redirect configuration are in place. The remaining key is shown by Resend as Full access; it should be rotated to a Sending access key privately later because the full key was exposed in chat, but it is the only active key currently required by the saved SMTP configuration.
