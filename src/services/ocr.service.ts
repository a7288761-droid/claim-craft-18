import type { DocumentTextExtractor, ExtractedText } from "./types";

/**
 * Placeholder OCR adapter for image documents.
 * Swap the body of `extract` for a real OCR call (Tesseract / Google Vision /
 * OpenAI vision) — the interface stays identical.
 */
export const ocrService: DocumentTextExtractor = {
  name: "placeholder-ocr",
  async extract(file: File): Promise<ExtractedText> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      source: file.name,
      text: `[Placeholder OCR output for ${file.name}. Connect an OCR provider to read real text from images.]`,
      pages: 1,
      confidence: 0.0,
    };
  },
};