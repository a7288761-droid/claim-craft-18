const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
export const AI_MODEL = "openai/gpt-5.6-sol";

export type ResponseContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export type GatewayOptions = {
  instructions?: string;
  content: ResponseContentPart[];
  schema?: { name: string; schema: Record<string, unknown> };
};

/**
 * Minimal provider adapter for the Lovable AI Gateway (OpenAI Responses API).
 * Swap the body of this function to move to another provider — callers only
 * depend on `callAi` returning text.
 */
export async function callAi({ instructions, content, schema }: GatewayOptions): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured. Missing API key.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      stream: true,
      store: false,
      ...(instructions ? { instructions } : {}),
      input: [{ role: "user", content }],
      reasoning: { effort: "low", summary: "auto" },
      ...(schema
        ? {
            text: {
              format: {
                type: "json_schema",
                name: schema.name,
                strict: true,
                schema: schema.schema,
              },
            },
          }
        : {}),
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits.");
    throw new Error(`AI request failed (${res.status}). ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          if (!text) text = event.response.output_text;
        }
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
  }

  if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
  return text;
}