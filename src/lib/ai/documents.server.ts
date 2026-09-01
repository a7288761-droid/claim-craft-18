import { callAi } from "./gateway.server";

/** Canonical comparable fields extracted from every document of a claim. */
export const FACT_KEYS = [
  "claimantName",
  "claimNumber",
  "policyNumber",
  "insurerName",
  "providerName",
  "serviceDate",
  "submissionDate",
  "decisionDate",
  "appealDeadline",
  "amounts",
  "serviceType",
] as const;

export type FactKey = (typeof FACT_KEYS)[number];

export type DocumentFact = { key: string; label: string; value: string };

const FACT_DESCRIPTIONS: Record<FactKey, string> = {
  claimantName: "Full name of the claimant / policy holder / patient",
  claimNumber: "Claim number or claim reference",
  policyNumber: "Policy number / membership number",
  insurerName: "Name of the insurance company or payer",
  providerName: "Name of the service provider (hospital, garage, airline, clinic…)",
  serviceDate: "Date the service / incident took place",
  submissionDate: "Date the claim was submitted",
  decisionDate: "Date of the rejection or decision",
  appealDeadline: "Appeal or objection deadline stated in the document",
  amounts: "Financial amounts stated (claimed, paid, deducted, outstanding) with currency",
  serviceType: "Type of procedure / service / treatment / repair",
};

const FACTS_SCHEMA = {
  name: "document_facts",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      fields: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(
          FACT_KEYS.map((key) => [key, { type: "string" }]),
        ) as Record<string, { type: string }>,
        required: [...FACT_KEYS],
      },
      other: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { label: { type: "string" }, value: { type: "string" } },
          required: ["label", "value"],
        },
      },
    },
    required: ["fields", "other"],
  },
};

const FACTS_INSTRUCTIONS = `You extract literal facts from a single claim-related document.
Rules:
- Copy values EXACTLY as written in the document. Never normalise, translate, guess or infer.
- If a field is not explicitly present in this document, return an empty string "" for it.
- Dates: return exactly as written in the document (do not reformat).
- amounts: list the amounts written in the document with their currency, comma separated.
- other: up to 6 additional clearly-stated key facts (label + value) that would be worth comparing
  with other documents of the same claim. Use short English labels. Leave the array empty when unsure.
Never invent information.

Fields:
${FACT_KEYS.map((key) => `- ${key}: ${FACT_DESCRIPTIONS[key]}`).join("\n")}`;

function truncate(text: string, max = 60000) {
  return text.length > max ? `${text.slice(0, max)}\n\n[document truncated]` : text;
}

export async function runDocumentFacts(input: {
  fileName: string;
  text: string;
}): Promise<DocumentFact[]> {
  if (!input.text.trim()) return [];

  const raw = await callAi({
    instructions: FACTS_INSTRUCTIONS,
    content: [
      {
        type: "input_text",
        text: `DOCUMENT FILE NAME: ${input.fileName}\n\nDOCUMENT TEXT:\n${truncate(input.text)}`,
      },
    ],
    schema: FACTS_SCHEMA,
  });

  let parsed: { fields?: Record<string, unknown>; other?: unknown };
  try {
    parsed = JSON.parse(raw) as { fields?: Record<string, unknown>; other?: unknown };
  } catch {
    return [];
  }

  const facts: DocumentFact[] = [];
  for (const key of FACT_KEYS) {
    const value = parsed.fields?.[key];
    facts.push({ key, label: key, value: typeof value === "string" ? value.trim() : "" });
  }
  if (Array.isArray(parsed.other)) {
    for (const item of parsed.other) {
      if (!item || typeof item !== "object") continue;
      const label = String((item as Record<string, unknown>)["label"] ?? "").trim();
      const value = String((item as Record<string, unknown>)["value"] ?? "").trim();
      if (!label || !value) continue;
      facts.push({ key: `other:${label.toLowerCase()}`, label, value });
    }
  }
  return facts;
}

const QA_SCHEMA = {
  name: "document_answer",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: { type: "string" },
      found: { type: "boolean" },
      inferred: { type: "boolean" },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { document: { type: "string" }, excerpt: { type: "string" } },
          required: ["document", "excerpt"],
        },
      },
    },
    required: ["answer", "found", "inferred", "sources"],
  },
};

const LANGUAGE_NAMES: Record<string, string> = { ar: "Arabic", en: "English" };

export async function runDocumentQa(input: {
  question: string;
  documents: { fileName: string; text: string }[];
  language?: string;
  notFoundMessage: string;
}): Promise<{ answer: string; found: boolean; inferred: boolean; sources: { document: string; excerpt: string }[] }> {
  const languageName = LANGUAGE_NAMES[input.language ?? ""] ?? "the language of the question";

  const corpus = input.documents
    .map((doc) => `--- DOCUMENT: ${doc.fileName} ---\n${truncate(doc.text, 40000)}`)
    .join("\n\n");

  if (!corpus.trim()) {
    return { answer: input.notFoundMessage, found: false, inferred: false, sources: [] };
  }

  const raw = await callAi({
    instructions: `You answer questions about the claim documents supplied below, and nothing else.
Rules:
- Use ONLY the supplied documents. Never use outside knowledge or assumptions.
- If the answer is not in the documents, set found=false and answer exactly: "${input.notFoundMessage}"
- When the answer combines several facts, set inferred=true and state in the answer that it is based on
  the available documents and is not a guarantee.
- Never present legal advice as certain fact.
- sources: the document file name(s) you relied on plus a short verbatim excerpt (max 200 characters).
- Write the answer in ${languageName}. Keep quoted values (names, numbers, dates, amounts) as written.
Keep the answer under 1200 characters.`,
    content: [
      { type: "input_text", text: `QUESTION: ${input.question}\n\nDOCUMENTS:\n${corpus}` },
    ],
    schema: QA_SCHEMA,
  });

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sources = Array.isArray(parsed["sources"])
      ? (parsed["sources"] as Record<string, unknown>[])
          .map((item) => ({
            document: String(item["document"] ?? ""),
            excerpt: String(item["excerpt"] ?? ""),
          }))
          .filter((item) => item.document)
      : [];
    const found = parsed["found"] === true;
    return {
      answer: typeof parsed["answer"] === "string" && parsed["answer"].trim()
        ? (parsed["answer"] as string)
        : input.notFoundMessage,
      found,
      inferred: parsed["inferred"] === true,
      sources: found ? sources : [],
    };
  } catch {
    return { answer: input.notFoundMessage, found: false, inferred: false, sources: [] };
  }
}
