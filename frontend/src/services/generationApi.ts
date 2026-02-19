import type { LoreItem, LoreItemPayload, ProviderModels, ProviderSettings } from "../types/generation";

const BASE_URL = "http://127.0.0.1:8000";

export type StreamCallback = (chunk: string) => void;

// Helper to filter and transform lore items for API
function prepareLoreForApi(loreItems: LoreItem[]): LoreItemPayload[] {
  return loreItems
    .filter(item => item.text.trim() !== "") // Filter empty items
    .map(({ category, text }) => ({ category, text })); // Remove id field
}

// Fetch available models for all providers
export async function fetchModels(): Promise<ProviderModels> {
  const res = await fetch(`${BASE_URL}/settings/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

// Get the appropriate API key for the selected provider
function getApiKeyForProvider(settings?: ProviderSettings): string | undefined {
  if (!settings) return undefined;
  return settings.apiKeys[settings.provider];
}

export async function generateNext(payload: {
  text: string;
  additional_instructions: string;
  word_count: number;
  lore?: LoreItem[];
  providerSettings?: ProviderSettings;
}) {
  const apiPayload = {
    text: payload.text,
    additional_instructions: payload.additional_instructions,
    word_count: payload.word_count,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) throw new Error("Generate next failed");
  return res.json();
}

export async function generateBetween(payload: {
  text: string;
  additional_instructions: string;
  word_count: number;
  start_position: number;
  end_position: number;
  lore?: LoreItem[];
  providerSettings?: ProviderSettings;
}) {
  const apiPayload = {
    text: payload.text,
    additional_instructions: payload.additional_instructions,
    word_count: payload.word_count,
    start_position: payload.start_position,
    end_position: payload.end_position,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/between`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) throw new Error("Generate between failed");
  return res.json();
}

// Helper to parse SSE stream and call callback for each chunk
async function parseSSEStream(
  response: Response,
  onChunk: StreamCallback
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          // Check for error in stream
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch (e) {
          // Re-throw if it's our error
          if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
            throw e;
          }
          // Ignore parse errors for malformed chunks
        }
      }
    }
  }
}

export async function streamNext(
  payload: {
    text: string;
    additional_instructions: string;
    word_count: number;
    lore?: LoreItem[];
    providerSettings?: ProviderSettings;
  },
  onChunk: StreamCallback
): Promise<void> {
  const apiPayload = {
    text: payload.text,
    additional_instructions: payload.additional_instructions,
    word_count: payload.word_count,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/next/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(error.detail || "Generate next stream failed");
  }

  await parseSSEStream(res, onChunk);
}

export async function streamBetween(
  payload: {
    text: string;
    additional_instructions: string;
    word_count: number;
    current_position: number;
    lore?: LoreItem[];
    providerSettings?: ProviderSettings;
  },
  onChunk: StreamCallback
): Promise<void> {
  const apiPayload = {
    text: payload.text,
    additional_instructions: payload.additional_instructions,
    word_count: payload.word_count,
    current_position: payload.current_position,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/between/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(error.detail || "Generate between stream failed");
  }

  await parseSSEStream(res, onChunk);
}

export async function streamStart(
  payload: {
    text: string;
    word_count: number;
    lore?: LoreItem[];
    providerSettings?: ProviderSettings;
  },
  onChunk: StreamCallback
): Promise<void> {
  const apiPayload = {
    text: payload.text,
    word_count: payload.word_count,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/start/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(error.detail || "Generate start stream failed");
  }

  await parseSSEStream(res, onChunk);
}

export async function streamImagePrompt(
  payload: {
    selectedText: string;
    textBefore: string;
    textAfter: string;
    lore?: LoreItem[];
    providerSettings?: ProviderSettings;
  },
  onChunk: StreamCallback
): Promise<void> {
  const apiPayload = {
    text: "",
    selected_text: payload.selectedText,
    text_before: payload.textBefore,
    text_after: payload.textAfter,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/image-prompt/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(error.detail || "Image prompt stream failed");
  }

  await parseSSEStream(res, onChunk);
}

export async function generateStartingLore(payload: {
  prompt: string;
  prose: string;
  providerSettings?: ProviderSettings;
}): Promise<LoreItem[]> {
  const apiPayload = {
    text: payload.prompt,
    selected_text: payload.prose,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/start-lore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed" }));
    throw new Error(error.detail || "Lore generation failed");
  }

  const data = await res.json();
  return (data.lore || []).map((item: { category: string; text: string }) => ({
    id: Date.now() + Math.random(),
    category: item.category as LoreItem["category"],
    text: item.text,
  }));
}

export async function streamModify(
  payload: {
    selectedText: string;
    textBefore: string;
    textAfter: string;
    additionalInstructions: string;
    lore?: LoreItem[];
    providerSettings?: ProviderSettings;
  },
  onChunk: StreamCallback
): Promise<void> {
  const apiPayload = {
    text: "",
    selected_text: payload.selectedText,
    text_before: payload.textBefore,
    text_after: payload.textAfter,
    additional_instructions: payload.additionalInstructions,
    lore: payload.lore ? prepareLoreForApi(payload.lore) : undefined,
    provider: payload.providerSettings?.provider,
    model: payload.providerSettings?.model,
    api_key: getApiKeyForProvider(payload.providerSettings),
  };

  const res = await fetch(`${BASE_URL}/generate/modify/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiPayload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Stream failed" }));
    throw new Error(error.detail || "Modify stream failed");
  }

  await parseSSEStream(res, onChunk);
}
