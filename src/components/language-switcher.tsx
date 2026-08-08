import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/language-provider";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost";
  className?: string;
}) {
  const { t, language, setLanguage } = useI18n();
  const active = SUPPORTED_LANGUAGES.find((item) => item.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={cn("gap-2", className)} aria-label={t("common.language")}>
          <Languages className="size-4" />
          <span className="hidden sm:inline">{active?.label ?? language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {SUPPORTED_LANGUAGES.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onSelect={() => setLanguage(item.code)}
            className="justify-between gap-3"
          >
            <span>{item.label}</span>
            {item.code === language ? <Check className="size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}