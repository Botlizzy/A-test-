# Resend SMTP setup findings

Resend's official Supabase guide requires a Resend API key and a verified sending domain. The SMTP settings are host `smtp.resend.com`, username `resend`, and the API key as the SMTP password. Resend supports ports 465/2465 for implicit TLS and 25/587/2587 for STARTTLS; Supabase's SMTP settings accept the sender email and sender name.

Supabase's official SMTP documentation states that its default Auth mailer is intended for development, has significant limits, and is not suitable for production. Custom SMTP requires a provider host, port, username, password, sender email, and sender name. Supabase also applies a protective initial rate limit after custom SMTP is configured, and the provider's own plan limits still apply. CAPTCHA and abuse controls remain important for public signup.

Official references:

- https://resend.com/docs/send-with-supabase-smtp
- https://resend.com/docs/send-with-smtp
- https://resend.com/docs/dashboard/domains/introduction
- https://supabase.com/docs/guides/auth/auth-smtp

## Live verification

On 2026-08-16, public DNS lookups for `resend._domainkey.elizzy-host.nx.kg` and `send.elizzy-host.nx.kg` returned NXDOMAIN with an SOA pointing to `a.misconfigured.dns.server.invalid`. Resend therefore remains in Pending status. The DNS records were added in Resend, but the authoritative DNS zone for `elizzy-host.nx.kg` is not currently serving them; the domain registrar/nameserver configuration must be corrected before Resend can verify the domain.
