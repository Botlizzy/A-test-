export const PASSWORD_RESET_MIN_LENGTH = 8;

export function validatePasswordReset(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_RESET_MIN_LENGTH) return `Your new password must be at least ${PASSWORD_RESET_MIN_LENGTH} characters.`;
  if (password !== confirmation) return "Your new passwords do not match.";
  return null;
}

export function getPasswordResetRedirect(confirmationRedirect: string): string {
  const separator = confirmationRedirect.includes("?") ? "&" : "?";
  return `${confirmationRedirect}${separator}mode=reset`;
}
