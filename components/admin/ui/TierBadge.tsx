import { AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import { TIER_LABEL } from "@/components/admin/charts/chart-theme";

export type Tier = "GREEN" | "YELLOW" | "RED";

const STYLE: Record<Tier, { className: string; Icon: LucideIcon }> = {
  GREEN: { className: "bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 },
  YELLOW: { className: "bg-amber-500/15 text-amber-300", Icon: AlertTriangle },
  RED: { className: "bg-red-500/15 text-red-300", Icon: XCircle },
};

/**
 * Semáforo de rendimiento. El estado nunca depende solo del color: cada nivel
 * lleva su icono y su palabra (Buena / Regular / Baja).
 */
export function TierBadge({ tier }: { tier: Tier }) {
  const { className, Icon } = STYLE[tier];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon aria-hidden size={12} />
      {TIER_LABEL[tier]}
    </span>
  );
}
