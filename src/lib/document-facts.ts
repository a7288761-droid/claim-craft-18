export type DocumentFact = { key: string; label: string; value: string };

export type ClaimDocumentFacts = {
  documentId: string;
  fileName: string;
  facts: DocumentFact[];
};

export type ComparisonStatus = "match" | "different" | "missing";

export type ComparisonRow = {
  key: string;
  label: string;
  /** value per document id ("" when the document does not state it) */
  values: Record<string, string>;
  status: ComparisonStatus;
};

const ARABIC_DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/g;

function toLatinDigits(value: string) {
  return value.replace(ARABIC_DIGITS, (digit) =>
    String(digit.charCodeAt(0) & 0xf),
  );
}

/** Loose comparison key: ignores case, punctuation, diacritics and spacing. */
export function normaliseValue(value: string) {
  return toLatinDigits(value)
    .toLowerCase()
    .replace(/[\u064b-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ةه]/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

/** Builds one comparison row per fact key across the selected documents. */
export function buildComparison(documents: ClaimDocumentFacts[]): ComparisonRow[] {
  const order: string[] = [];
  const labels = new Map<string, string>();
  for (const doc of documents) {
    for (const fact of doc.facts) {
      if (!labels.has(fact.key)) {
        labels.set(fact.key, fact.label);
        order.push(fact.key);
      }
    }
  }

  const rows: ComparisonRow[] = [];
  for (const key of order) {
    const values: Record<string, string> = {};
    for (const doc of documents) {
      values[doc.documentId] = doc.facts.find((fact) => fact.key === key)?.value?.trim() ?? "";
    }
    const present = Object.values(values).filter(Boolean);
    if (present.length === 0) continue;

    const unique = new Set(present.map(normaliseValue));
    const status: ComparisonStatus =
      unique.size > 1 ? "different" : present.length < documents.length ? "missing" : "match";

    rows.push({ key, label: labels.get(key) ?? key, values, status });
  }
  return rows;
}

/** Rows where two or more documents state conflicting values. */
export function findContradictions(documents: ClaimDocumentFacts[]): ComparisonRow[] {
  if (documents.length < 2) return [];
  return buildComparison(documents).filter((row) => row.status === "different");
}

export function hasFacts(documents: ClaimDocumentFacts[]) {
  return documents.some((doc) => doc.facts.length > 0);
}
