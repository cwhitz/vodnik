export type LoreItem = {
  id: number;
  category: "character" | "setting" | "plot point";
  text: string;
};

export type LoreItemPayload = {
  category: string;
  text: string;
};

export type GeneratedRange = {
  start: number;
  end: number;
  originalText?: string; // present when undoing a modification
};

export type GenerationRequest =
  | { type: "next" }
  | { type: "between"; startPos: number; endPos: number };

export type Mode = "write" | "read";

export type MediaMap = Record<string, string>;

export type MediaTypes = Record<string, 'image' | 'video' | 'audio'>;

export type DropdownOption = {
  label: string;
  onClick: () => void;
};

export type ProviderName = "xai" | "openai" | "anthropic";

export type ProviderModels = Record<ProviderName, string[]>;

export type ProviderSettings = {
  provider: ProviderName;
  model: string;
  apiKeys: {
    xai?: string;
    openai?: string;
    anthropic?: string;
  };
};
