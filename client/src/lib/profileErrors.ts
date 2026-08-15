export type ProfileErrorAction = "load" | "save";

export function profileErrorMessage(message: string, action: ProfileErrorAction) {
  const normalized = message.toLowerCase();
  const schemaMissing =
    (normalized.includes("relation") && normalized.includes("profiles")) ||
    (normalized.includes("schema cache") && normalized.includes("profiles")) ||
    (normalized.includes("could not find the table") && normalized.includes("profiles"));

  if (schemaMissing) {
    return `Your profile table is not ready yet. Run the latest supabase/schema.sql in Supabase SQL Editor before you ${action} profile details; your User ID remains available below.`;
  }
  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not authorized")
  ) {
    return `Supabase rejected this profile ${action}. Check the profiles table RLS policies in supabase/schema.sql, then try again.`;
  }
  return `We could not ${action} your profile right now. Check your connection and Supabase configuration, then try again.`;
}
