export function signupAccessMessage(hasSession: boolean, email: string) {
  if (hasSession) return "Account created. You are signed in and ready to enter the site.";
  return `Account created for ${email}. Sign in now to enter the site.`;
}
