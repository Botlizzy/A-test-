export function formatSignupSuccess(hasSession: boolean): string {
  return hasSession
    ? "Signup successful. Your account is ready and you are signed in."
    : "Signup successful. Use Sign in to enter your account.";
}

export function formatAuthError(rawMessage: string, mode: "login" | "signup"): string {
  const message = rawMessage || "We could not complete that request.";
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return "We could not reach the login service. Check your mobile connection, keep this page open, and tap Sign in again. If the problem continues, the service may be temporarily unavailable.";
  }
  if (/rate limit|too many requests|over_email_send_rate_limit|429/i.test(message)) {
    return mode === "signup"
      ? "We could not complete signup right now. If you already have an account, use Sign in; otherwise please try again shortly."
      : "We could not complete that request right now. Please try again shortly.";
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
  return message;
}
