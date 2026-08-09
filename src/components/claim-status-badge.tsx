import { cn } from "@/lib/utils";
import { normalizeStatus, STATUS_TONE } from "@/lib/claim-status";
import { useI18n } from "@/i18n/language-provider";

export function ClaimStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { t } = useI18n();
  const normalized = normalizeStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_TONE[normalized],
        className,
      )}
    >
      {t(`claimStatus.${normalized}`)}
    </span>
  );
}
