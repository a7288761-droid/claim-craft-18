import type { DocumentTextExtractor, ExtractedText } from "./types";

/**
 * Placeholder PDF text extraction adapter.
 * Replace with pdf.js / a server-side parser later; the contract is unchanged.
 */
export const pdfService: DocumentTextExtractor = {
  name: "placeholder-pdf-parser",
  async extract(file: File): Promise<ExtractedText> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      source: file.name,
      text: `[Placeholder PDF text for ${file.name}. Connect a PDF parser to read real contract text.]`,
      pages: 1,
      confidence: 0.0,
    };
  },
};

export function pickExtractor(fileType: string) {
  return fileType.includes("pdf") ? "pdf" : "ocr";
}