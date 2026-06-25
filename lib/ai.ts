const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const AI_CONFIGURED = !!ANTHROPIC_KEY;

interface AskResult {
  ok: boolean;
  text: string;
  /** true when the failure is "no API key configured" (vs a runtime error) */
  notConfigured?: boolean;
}

/** Call Claude with a system prompt + conversation. No SDK — direct Messages API. */
export async function askAssistant(system: string, messages: ChatMessage[]): Promise<AskResult> {
  if (!ANTHROPIC_KEY) {
    return {
      ok: false,
      notConfigured: true,
      text:
        "The AI assistant isn't switched on yet. An admin needs to add an Anthropic API key (ANTHROPIC_API_KEY) in the app's environment settings — once that's in, I'll be ready to help.",
    };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, text: `The assistant hit an error (${res.status}). ${detail.slice(0, 160)}` };
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();
    return { ok: true, text: text || "(I didn't have anything to add there — try rephrasing?)" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return { ok: false, text: `The assistant couldn't reach the AI service: ${msg}` };
  }
}
