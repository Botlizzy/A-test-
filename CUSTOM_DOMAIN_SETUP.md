# ELIZZY DOMAIN custom-domain setup

The application now sends email-confirmation links to `https://elizzy-host.nx.kg/?confirmed=1`.

Before using the new destination in production, bind `elizzy-host.nx.kg` to this project from the WebDev Management UI under **Settings → Domains** and complete the DNS records requested there. Then add `https://elizzy-host.nx.kg/?confirmed=1` to the Supabase Auth URL configuration and email redirect allow-list. Until both steps are complete, keep the existing deployed domain available as a fallback for testing.

The application does not impose a signup cooldown. A message such as `over_email_send_rate_limit` comes from Supabase email delivery limits or the configured SMTP provider, not from the app. Configure a project SMTP provider or wait for the provider window to clear before attempting another confirmation email.
