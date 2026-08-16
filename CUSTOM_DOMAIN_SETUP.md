# ELIZZY DOMAIN authentication redirect

Custom-domain confirmation redirects have been removed. Email confirmation links now return to the deployed production site at `https://a-test-ten.vercel.app/?confirmed=1`.

The signup flow does not impose an app cooldown. If Supabase returns `over_email_send_rate_limit`, the restriction comes from Supabase email delivery or its configured SMTP provider. The page now explains this and offers a direct Sign in recovery action when an account may already exist.
