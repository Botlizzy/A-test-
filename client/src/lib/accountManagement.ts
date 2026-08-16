export type AccountStatus = "active" | "suspended";

export function getNextAccountStatus(status: AccountStatus | null | undefined): AccountStatus {
  return status === "suspended" ? "active" : "suspended";
}

export function accountStatusLabel(status: AccountStatus | null | undefined): string {
  return status === "suspended" ? "SUSPENDED" : "ACTIVE";
}

export function accountStatusDescription(status: AccountStatus | null | undefined): string {
  return status === "suspended"
    ? "This account is suspended and cannot enter the website."
    : "This account can use the website normally.";
}
