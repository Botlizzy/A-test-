export function shouldRetryMemberListError(error: { code?: string | null; message?: string | null } | null) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "PGRST202" || message.includes("schema cache") || message.includes("could not find the function");
}

export function memberListErrorMessage(error: { code?: string | null; message?: string | null } | null) {
  const message = String(error?.message || "");
  const normalized = message.toLowerCase();
  if (normalized.includes("only approved administrators")) {
    return "Sign in with an approved admin email to view registered members.";
  }
  if (shouldRetryMemberListError(error)) {
    return "The member-list API is refreshing. Tap Refresh members in a moment; no database rows need to be created manually.";
  }
  if (normalized.includes("premium_entitlements") || normalized.includes("relation")) {
    return "The member-list tables are incomplete in Supabase. Run the latest schema, then refresh this page.";
  }
  return message || "Unable to load registered members. Tap Refresh members to try again.";
}
