import { callAi, type ResponseContentPart } from "./gateway.server";

export type Section = { label: string; value: string };

export type StrengthLevel = "strong" | "moderate" | "needs_more_info";

export type AnalysisResult = {
  summary: string;
  keyClauses: Section[];
  rejectionReasons: Section[];
  missingInformation: Section[];
  userRights: Section[];
  keyEntities: Section[];
  importantDates: Section[];
  financialAmounts: Section[];
  nextSteps: Section[];
  strengthLevel: StrengthLevel;
  strengthReasons: Section[];
  strengthImprovements: Section[];
  deadlineDate: string;
  deadlineNote: string;
};

const sectionArray = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      label: { type: "string" },
      value: { type: "string" },
    },
    required: ["label", "value"],
  },
};

const ANALYSIS_SCHEMA = {
  name: "claim_analysis",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      keyClauses: sectionArray,
      rejectionReasons: sectionArray,
      missingInformation: sectionArray,
      userRights: sectionArray,
      keyEntities: sectionArray,
      importantDates: sectionArray,
      financialAmounts: sectionArray,
      nextSteps: sectionArray,
      strength: {
        type: "object",
        additionalProperties: false,
        properties: {
          level: { type: "string", enum: ["strong", "moderate", "needs_more_info"] },
          reasons: sectionArray,
          improvements: sectionArray,
        },
        required: ["level", "reasons", "improvements"],
      },
      appealDeadline: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string" },
          note: { type: "string" },
        },
        required: ["date", "note"],
      },
    },
    required: [
      "summary",
      "keyClauses",
      "rejectionReasons",
      "missingInformation",
      "userRights",
      "keyEntities",
      "importantDates",
      "financialAmounts",
      "nextSteps",
      "strength",
      "appealDeadline",
    ],
  },
};

const ANALYST_INSTRUCTIONS = `You are an expert insurance and consumer-claims analyst.
Analyse the complete document text supplied by the user and return structured findings.
Rules:
- Base every finding strictly on the supplied document text; never invent facts.
- If something is not present in the documents, say so explicitly in the value.
- summary: 4-8 sentences of plain, non-legal language a normal person understands.
- keyClauses: important contractual clauses, each label a short clause name.
- rejectionReasons: concrete reasons the provider could refuse or reduce this claim.
- missingInformation: evidence or details the user still needs to supply.
- userRights: rights the document (or clearly applicable consumer/insurance practice referenced in it) grants the user, e.g. appeal windows, ombudsman escalation, right to written reasons.
- keyEntities: names of people, companies, policy/claim/reference numbers found in the documents.
- importantDates: incident, notification, decision and deadline dates found in the documents.
- financialAmounts: claimed, paid, deducted and outstanding amounts with currency.
- nextSteps: numbered, actionable steps.
- strength: an estimated assessment of how strong this claim looks BASED ONLY on the supplied documents.
  level is "strong" when the documents clearly support the claim, "moderate" when support exists but has gaps,
  and "needs_more_info" when essential evidence or details are absent.
  reasons: short factual reasons for that level, each grounded in the documents.
  improvements: concrete things the claimant can do or provide to strengthen the claim.
  This is an estimate, never a guarantee — never state that the claim will be accepted or paid.
- appealDeadline: if the documents state an appeal/objection deadline date or a period (e.g. "within 30 days of the decision")
  AND the start date is present so the deadline can be computed reliably, return date as an ISO YYYY-MM-DD string.
  If the date is unclear, missing, or cannot be computed, return date as an empty string — never guess.
  note: a short explanation of where the deadline comes from, or why none was found.
Keep each value under 400 characters.`;

const LANGUAGE_NAMES: Record<string, string> = { ar: "Arabic", en: "English" };

function languageDirective(code?: string) {
  const name = LANGUAGE_NAMES[code ?? ""] ?? "";
  return name
    ? `Write the entire output in ${name}, regardless of the language of the source documents. Keep names, policy numbers and amounts exactly as written in the documents.`
    : "Write in the same language as the document when it is not English.";
}

const LETTER_INSTRUCTIONS = `You are a professional claims correspondence writer.
Write a formal, polite and persuasive appeal letter based only on the supplied document text and analysis.
Use real details (names, policy numbers, dates, amounts) found in the documents; use [square bracket]
placeholders only where the information is genuinely missing. Structure: date, recipient, subject line,
salutation, factual background, numbered arguments referencing the relevant clauses, a clear request,
a request for a written response with escalation details, and a sign-off.
End with a one-line note that this draft is general information, not legal advice.
Return the letter text only — no markdown, no commentary.`;

function truncate(text: string, max = 120000) {
  return text.length > max ? `${text.slice(0, max)}\n\n[document truncated]` : text;
}

function asSections(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Section =>
        !!item && typeof item === "object" && "label" in item && "value" in item,
    )
    .map((item) => ({ label: String(item.label), value: String(item.value) }));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function asLevel(value: unknown): StrengthLevel {
  return value === "strong" || value === "moderate" ? value : "needs_more_info";
}

export async function runAnalysis(input: {
  categoryName: string;
  fileNames: string[];
  notes?: string;
  extractedText: string;
  language?: string;
}): Promise<AnalysisResult> {
  const prompt = [
    `Claim category: ${input.categoryName}`,
    `Uploaded files: ${input.fileNames.join(", ") || "none"}`,
    input.notes?.trim() ? `What the claimant says happened: ${input.notes.trim()}` : "",
    "",
    "DOCUMENT TEXT:",
    truncate(input.extractedText || "(no readable text was extracted)"),
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callAi({
    instructions: `${ANALYST_INSTRUCTIONS}\n${languageDirective(input.language)}`,
    content: [{ type: "input_text", text: prompt }],
    schema: ANALYSIS_SCHEMA,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("The AI returned an unreadable result. Please try again.");
  }

  const strength = (parsed["strength"] ?? {}) as Record<string, unknown>;
  const deadline = (parsed["appealDeadline"] ?? {}) as Record<string, unknown>;
  const deadlineDate = typeof deadline["date"] === "string" ? (deadline["date"] as string) : "";

  return {
    summary: typeof parsed["summary"] === "string" ? (parsed["summary"] as string) : "",
    keyClauses: asSections(parsed["keyClauses"]),
    rejectionReasons: asSections(parsed["rejectionReasons"]),
    missingInformation: asSections(parsed["missingInformation"]),
    userRights: asSections(parsed["userRights"]),
    keyEntities: asSections(parsed["keyEntities"]),
    importantDates: asSections(parsed["importantDates"]),
    financialAmounts: asSections(parsed["financialAmounts"]),
    nextSteps: asSections(parsed["nextSteps"]),
    strengthLevel: asLevel(strength["level"]),
    strengthReasons: asSections(strength["reasons"]),
    strengthImprovements: asSections(strength["improvements"]),
    deadlineDate: ISO_DATE.test(deadlineDate) ? deadlineDate : "",
    deadlineNote: typeof deadline["note"] === "string" ? (deadline["note"] as string) : "",
  };
}

export async function runLetter(input: {
  categoryName: string;
  extractedText?: string;
  analysisJson: string;
  recipient?: string;
  senderName?: string;
  language?: string;
}): Promise<string> {
  const prompt = [
    `Claim category: ${input.categoryName}`,
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
    input.recipient ? `Recipient: ${input.recipient}` : "",
    input.senderName ? `Sender: ${input.senderName}` : "",
    "",
    "ANALYSIS (JSON):",
    input.analysisJson,
    "",
    "DOCUMENT TEXT:",
    truncate(input.extractedText || "(not available)", 60000),
  ]
    .filter(Boolean)
    .join("\n");

  return callAi({
    instructions: `${LETTER_INSTRUCTIONS}\n${languageDirective(input.language)}`,
    content: [{ type: "input_text", text: prompt }],
  });
}

export async function runImageOcr(input: {
  fileName: string;
  dataUrl: string;
}): Promise<string> {
  const content: ResponseContentPart[] = [
    {
      type: "input_text",
      text: `Transcribe every piece of text visible in this document image (${input.fileName}). Preserve headings, numbers, dates and amounts. Return the raw text only.`,
    },
    { type: "input_image", image_url: input.dataUrl },
  ];
  return callAi({ content });
}