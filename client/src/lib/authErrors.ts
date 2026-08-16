export function formatAuthError(rawMessage: string, mode: "login" | "signup"): string {
  const message = rawMessage || "We could not complete that request.";
  if (/rate limit|too many requests|over_email_send_rate_limit|429/i.test(message)) {
    return "The email provider is temporarily limiting delivery. Your account details are still valid; try again later or use Sign in if you already confirmed your email. The app does not impose a cooldown.";
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
