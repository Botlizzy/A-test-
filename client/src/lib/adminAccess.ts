export const APPROVED_ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);

export const isApprovedAdminEmail = (email?: string | null) => APPROVED_ADMIN_EMAILS.has((email || "").trim().toLowerCase());
