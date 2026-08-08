import { analyzeDocuments, draftAppealLetter } from "@/lib/ai.functions";
import type { AnalysisEngine, AnalysisPayload, AnalysisRequest, LetterRequest } from "./types";

/**
 * OpenAI-backed analysis engine (via the Lovable AI Gateway).
 * To swap providers, implement `AnalysisEngine` and return it from
 * `getAnalysisEngine()` — no UI or route changes required.
 */
export const openAiEngine: AnalysisEngine = {
  name: "openai",

  async analyze(request: AnalysisRequest): Promise<AnalysisPayload> {
    const result = await analyzeDocuments({
      data: {
        categoryName: request.categoryName,
        fileNames: request.fileNames,
        notes: request.notes ?? "",
        extractedText: request.extractedText ?? "",
        language: request.language ?? "",
      },
    });
    return { ...result, engine: "openai" };
  },

  async draftLetter(request: LetterRequest): Promise<string> {
    const { body } = await draftAppealLetter({
      data: {
        categoryName: request.categoryName,
        extractedText: request.extractedText ?? "",
        analysisJson: JSON.stringify(request.analysis),
        recipient: request.recipient ?? "",
        senderName: request.senderName ?? "",
        language: request.language ?? "",
      },
    });
    return body;
  },
};

export function getAnalysisEngine(): AnalysisEngine {
  return openAiEngine;
}