import type { AnalysisEngine, AnalysisPayload, AnalysisRequest, LetterRequest } from "./types";

/**
 * Placeholder analysis engine.
 * A future OpenAI-backed engine only needs to implement `AnalysisEngine` and be
 * returned from `getAnalysisEngine()` — no UI changes required.
 */
export const placeholderEngine: AnalysisEngine = {
  name: "placeholder",

  async analyze(request: AnalysisRequest): Promise<AnalysisPayload> {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const files = request.fileNames.length ? request.fileNames.join(", ") : "your documents";

    return {
      engine: "placeholder",
      summary: `Based on ${files}, this looks like a ${request.categoryName.toLowerCase()} matter. The documents describe a service or policy agreement, an event that triggered a loss, and a decision by the provider that reduced or refused the amount you expected. This summary is placeholder content shown while AI analysis is not yet connected.`,
      keyClauses: [
        { label: "Coverage scope", value: "The agreement lists the covered events and explicitly excludes losses caused by negligence or late reporting." },
        { label: "Notification window", value: "Claims must be reported within a fixed number of days after the incident date." },
        { label: "Evidence requirement", value: "Original receipts or an official report are required to support the requested amount." },
        { label: "Liability cap", value: "The provider limits its maximum liability per incident." },
      ],
      rejectionReasons: [
        { label: "Late notification", value: "The provider may argue the claim was filed after the contractual deadline." },
        { label: "Missing evidence", value: "Supporting receipts or reports may be considered incomplete." },
        { label: "Excluded cause", value: "The provider may classify the event under an exclusion clause." },
      ],
      missingInformation: [
        { label: "Proof of notification", value: "A dated email, letter or reference number showing when you first reported the incident." },
        { label: "Itemised costs", value: "Original invoices or receipts that add up to the exact amount you are claiming." },
        { label: "Official report", value: "A police, medical or provider report describing the incident independently." },
        { label: "Full policy wording", value: "The complete terms document, not only the summary schedule." },
      ],
      importantDates: [
        { label: "Incident date", value: "Identified in the uploaded documents" },
        { label: "Reported to provider", value: "Identified in the uploaded documents" },
        { label: "Appeal deadline", value: "Typically 30 days from the rejection letter" },
      ],
      financialAmounts: [
        { label: "Amount claimed", value: "Detected from your receipts" },
        { label: "Amount paid", value: "Detected from the provider's response" },
        { label: "Disputed balance", value: "The difference you may be entitled to appeal" },
      ],
      nextSteps: [
        { label: "1. Complete your evidence", value: "Collect any missing receipts, reports or correspondence." },
        { label: "2. Send a written appeal", value: "Use the generated appeal letter and keep a dated copy." },
        { label: "3. Track the response", value: "Providers usually must reply within a set period." },
        { label: "4. Escalate if needed", value: "Consider the relevant ombudsman or regulator if the reply is unsatisfactory." },
      ],
    };
  },

  async draftLetter(request: LetterRequest): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 900));
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    return `${today}

To: ${request.recipient ?? "Claims Department"}
Subject: Formal appeal regarding my ${request.categoryName.toLowerCase()} claim

Dear Sir or Madam,

I am writing to formally appeal the decision made regarding my recent claim. After reviewing the agreement and the supporting documents in my possession, I believe the decision does not fully reflect the terms that apply to my case.

The documents I hold show that the event took place within the covered period and that I notified you in line with the process described in the agreement. The supporting evidence attached to this letter confirms the amounts involved and the circumstances of the loss.

In particular, I would like to draw your attention to the following points:

1. The event falls within the scope of cover described in the agreement.
2. The reason given for the reduction or refusal does not appear to match the wording of the relevant clause.
3. The supporting documents provide the evidence required under the agreement.

I therefore request that you reconsider the decision and confirm the outstanding amount in writing. If the decision is upheld, I would appreciate a clear written explanation referring to the specific clause relied upon, together with details of the next escalation stage available to me.

I look forward to your written response within the period set out in your complaints procedure.

Yours faithfully,

${request.senderName ?? "[Your full name]"}
[Contact details]
[Reference number]

---
This letter is a placeholder draft prepared by EasyClaim. It is general information, not legal advice, and does not guarantee any compensation.`;
  },
};

export function getAnalysisEngine(): AnalysisEngine {
  // Future: return an OpenAI-backed engine when an API key/config is present.
  return placeholderEngine;
}