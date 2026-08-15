import { CheckCircle2, Clock3, Crown, XCircle } from "lucide-react";

export type PremiumBadgeState = "active" | "pending" | "inactive";

type PremiumBadgeProps = {
  state: PremiumBadgeState;
  compact?: boolean;
};

const stateCopy: Record<PremiumBadgeState, { label: string; description: string }> = {
  active: { label: "PREMIUM ACTIVE", description: "Premium access enabled" },
  pending: { label: "PREMIUM PENDING", description: "Awaiting admin verification" },
  inactive: { label: "PREMIUM INACTIVE", description: "Activation required" },
};

export default function PremiumBadge({ state, compact = false }: PremiumBadgeProps) {
  const copy = stateCopy[state];
  const Icon = state === "active" ? CheckCircle2 : state === "pending" ? Clock3 : XCircle;
  return (
    <span className={`premium-badge premium-badge--${state}${compact ? " premium-badge--compact" : ""}`} role="status" aria-label={copy.label}>
      <Icon size={compact ? 14 : 17} />
      <span className="premium-badge__copy"><strong>{copy.label}</strong>{!compact && <small>{copy.description}</small>}</span>
      <Crown className="premium-badge__crown" size={compact ? 12 : 14} />
    </span>
  );
}
