import { ocrImage } from "@/lib/ai.functions";
import type { DocumentTextExtractor, ExtractedText } from "./types";

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Vision OCR for image documents, executed server-side through the AI service. */
export const ocrService: DocumentTextExtractor = {
  name: "openai-vision-ocr",
  async extract(file: File): Promise<ExtractedText> {
    const dataUrl = await toDataUrl(file);
    const { text } = await ocrImage({ data: { fileName: file.name, dataUrl } });
    const clean = (text ?? "").trim();
    return {
      source: file.name,
      text: clean || `[No readable text found in ${file.name}.]`,
      pages: 1,
      confidence: clean ? 0.9 : 0,
    };
  },
};