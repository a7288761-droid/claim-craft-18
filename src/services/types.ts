/**
 * Shared contracts for the EasyClaim service layer.
 * Implementations are swappable: today they return deterministic placeholder
 * data, later they can be backed by OpenAI, an OCR engine and a PDF parser
 * without any change to the UI layer.
 */

export type AnalysisSection = {
  label: string;
  value: string;
};

export type ClaimStrengthLevel = "strong" | "moderate" | "needs_more_info";

export type AnalysisPayload = {
  summary: string;
  keyClauses: AnalysisSection[];
  rejectionReasons: AnalysisSection[];
  missingInformation: AnalysisSection[];
  userRights: AnalysisSection[];
  keyEntities: AnalysisSection[];
  importantDates: AnalysisSection[];
  financialAmounts: AnalysisSection[];
  nextSteps: AnalysisSection[];
  /** Estimated claim strength derived only from the uploaded documents. */
  strengthLevel: ClaimStrengthLevel;
  strengthReasons: AnalysisSection[];
  strengthImprovements: AnalysisSection[];
  /** ISO date of an appeal deadline found in the documents, or "" when unknown. */
  deadlineDate: string;
  deadlineNote: string;
  engine: string;
};

export type AnalysisRequest = {
  category: string;
  categoryName: string;
  fileNames: string[];
  notes?: string;
  extractedText?: string;
  /** UI language code (e.g. "ar" | "en") used for the AI output language. */
  language?: string;
};

export type LetterRequest = AnalysisRequest & {
  analysis: AnalysisPayload;
  recipient?: string;
  senderName?: string;
};

export type ExtractedText = {
  source: string;
  text: string;
  pages: number;
  confidence: number;
};

export interface DocumentTextExtractor {
  readonly name: string;
  extract(file: File): Promise<ExtractedText>;
}

export interface AnalysisEngine {
  readonly name: string;
  analyze(request: AnalysisRequest): Promise<AnalysisPayload>;
  draftLetter(request: LetterRequest): Promise<string>;
}