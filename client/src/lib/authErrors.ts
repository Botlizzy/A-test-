export function formatSignupSuccess(hasSession: boolean): string {
  return hasSession
    ? "Signup successful. Your account is ready and you are signed in."
    : "Signup successful. Check your inbox for the confirmation link, then return here and use Sign in.";
}

export function formatPasswordResetError(rawMessage: string): string {
  if (/auth session missing|session missing|jwt|expired|invalid.*token|token.*invalid|already been used/i.test(rawMessage)) {
    return "This password-reset link is expired or was already used. Request a new reset link and open the newest email.";
  }
  return formatAuthError(rawMessage, "login");
}

export function formatAuthError(rawMessage: string, mode: "login" | "signup"): string {
  const message = rawMessage || "We could not complete that request.";
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return "We could not reach the login service. Check your mobile connection, keep this page open, and tap Sign in again. If the problem continues, the service may be temporarily unavailable.";
  }
  if (/over_email_send_rate_limit|email.*(rate|limit)|rate limit|too many requests|429/i.test(message)) {
    return mode === "signup"
      ? "Supabase could not send the confirmation email right now. This is an email-provider limit, not an ELIZZY DOMAIN signup cooldown. Check spam, wait before requesting another message, or configure SMTP in Supabase."
      : "The email provider is temporarily limiting messages. Please try again later.";
  }
  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "The email or password is incorrect. Check both fields, or switch to Create account if you are new here.";
  }
  if (/user already registered|already been registered/i.test(message)) {
    return "An account with this email already exists. Switch to Sign in instead.";
  }
  if (/password/i.test(message) && /weak|short|characters/i.test(message)) {
    return "Choose a stronger password with at least 6 characters.";
  }
  if (/email/i.test(message) && /invalid|valid/i.test(message)) {
    return "Enter a valid email address and try again.";
  }
  return mode === "signup" && /confirm/i.test(message) ? `${message} You can return here and use Sign in after confirming.` : message;
}
