import type { DocumentTextExtractor, ExtractedText } from "./types";

/**
 * Placeholder Word document text extraction adapter.
 * Replace with mammoth/docx parsing later; the contract is unchanged.
 */
export const docxService: DocumentTextExtractor = {
  name: "placeholder-docx-parser",
  async extract(file: File): Promise<ExtractedText> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      source: file.name,
      text: `[Placeholder Word document text for ${file.name}. Connect a document parser to read the real contents.]`,
      pages: 1,
      confidence: 0,
    };
  },
};