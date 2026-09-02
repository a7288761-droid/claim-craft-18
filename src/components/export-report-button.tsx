import { useNavigate } from "@tanstack/react-router";
import { Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/language-provider";
import { useSubscription } from "@/lib/subscription";
import type { AnalysisSection } from "@/services/types";

export type ReportSection = { heading: string; items: AnalysisSection[] };

export function ExportReportButton({
  title,
  summary,
  sections,
  fileName = "easyclaim-report.pdf",
  label,
  successMessage,
}: {
  title: string;
  summary: string;
  sections: ReportSection[];
  /** Output file name; defaults to the analysis report name. */
  fileName?: string;
  label?: string;
  successMessage?: string;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data } = useSubscription();
  const allowed = !!data?.limits.exports;

  function exportPdf() {
    if (!allowed) {
      toast.error(t("quota.exportLocked"));
      void navigate({ to: "/plans" });
      return;
    }
    void (async () => {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 56;
      const width = doc.internal.pageSize.getWidth() - margin * 2;
      const height = doc.internal.pageSize.getHeight();
      let y = margin;

      const write = (text: string, size: number, bold: boolean) => {
        doc.setFont("times", bold ? "bold" : "normal");
        doc.setFontSize(size);
        for (const line of doc.splitTextToSize(text, width) as string[]) {
          if (y > height - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += size + 5;
        }
      };

      write(title, 16, true);
      y += 6;
      if (summary) {
        write(t("analysis.summary"), 12, true);
        write(summary, 11, false);
        y += 8;
      }
      for (const section of sections) {
        if (section.items.length === 0) continue;
        write(section.heading, 12, true);
        for (const item of section.items) {
          write(`• ${item.label}: ${item.value}`, 11, false);
        }
        y += 8;
      }
      write(t("analysis.footerNote"), 9, false);
      doc.save(fileName);
      toast.success(successMessage ?? t("quota.exported"));
    })();
  }

  return (
    <Button variant="outline" onClick={exportPdf}>
      {allowed ? <Download className="size-4" /> : <Lock className="size-4" />}
      {label ?? t("quota.exportReport")}
    </Button>
  );
}
