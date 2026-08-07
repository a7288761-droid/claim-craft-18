import type { DocumentTextExtractor, ExtractedText } from "./types";

/** Real Word (.docx) text extraction using mammoth in the browser. */
export const docxService: DocumentTextExtractor = {
  name: "mammoth",
  async extract(file: File): Promise<ExtractedText> {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = (result.value ?? "").replace(/\n{3,}/g, "\n\n").trim();
    return {
      source: file.name,
      text: text || `[No readable text found in ${file.name}.]`,
      pages: 1,
      confidence: text ? 1 : 0,
    };
  },
};