export const SIGNUP_CODE_LENGTH = 6;

export function sanitizeSignupCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, SIGNUP_CODE_LENGTH);
}

export function isValidSignupCode(value: string): boolean {
  return new RegExp(`^\\d{${SIGNUP_CODE_LENGTH}}$`).test(value);
}

export function signupVerificationMessage(email: string): string {
  return `We sent a six-digit verification code to ${email}. Enter it below to activate your account.`;
}

export function signupVerificationSuccessMessage(): string {
  return "Email verified. Your ELIZZY DOMAIN account is ready and you are signed in.";
}

export function signupVerificationResentMessage(): string {
  return "A new six-digit verification code was sent. Check your inbox and spam folder.";
}
