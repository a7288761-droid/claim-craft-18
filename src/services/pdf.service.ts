import type { DocumentTextExtractor, ExtractedText } from "./types";

/** Real PDF text extraction using pdf.js in the browser. */
export const pdfService: DocumentTextExtractor = {
  name: "pdfjs",
  async extract(file: File): Promise<ExtractedText> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;

    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const parts: string[] = [];
    for (let page = 1; page <= doc.numPages; page += 1) {
      const content = await (await doc.getPage(page)).getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) parts.push(`[Page ${page}]\n${text}`);
    }
    const text = parts.join("\n\n");
    return {
      source: file.name,
      text: text || `[No selectable text found in ${file.name} — it may be a scanned document.]`,
      pages: doc.numPages,
      confidence: text ? 1 : 0,
    };
  },
};

export function pickExtractor(fileType: string) {
  return fileType.includes("pdf") ? "pdf" : "ocr";
}