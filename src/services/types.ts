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

export type AnalysisPayload = {
  summary: string;
  keyClauses: AnalysisSection[];
  rejectionReasons: AnalysisSection[];
  importantDates: AnalysisSection[];
  financialAmounts: AnalysisSection[];
  nextSteps: AnalysisSection[];
  engine: string;
};

export type AnalysisRequest = {
  category: string;
  categoryName: string;
  fileNames: string[];
  notes?: string;
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