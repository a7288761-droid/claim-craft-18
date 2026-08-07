import { docxService } from "./docx.service";
import { ocrService } from "./ocr.service";
import { pdfService } from "./pdf.service";
import type { DocumentTextExtractor, ExtractedText } from "./types";

export function extractorFor(file: File): DocumentTextExtractor {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) return pdfService;
  if (
    type.includes("word") ||
    type.includes("officedocument.wordprocessing") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return docxService;
  }
  return ocrService;
}

export const extractionService = {
  async extract(file: File): Promise<ExtractedText> {
    return extractorFor(file).extract(file);
  },
};