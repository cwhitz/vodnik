import { useState, useEffect } from "react";
import { fetchModels } from "../../services/generationApi";
import type { ProviderName, ProviderModels, ProviderSettings } from "../../types/generation";

type SettingsProps = {
  providerSettings: ProviderSettings;
  onSave: (settings: ProviderSettings) => void;
  onClose: () => void;
};

const PROVIDER_LABELS: Record<ProviderName, string> = {
  xai: "xAI (Grok)",
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
};

export default function Settings({
  providerSettings,
  onSave,
  onClose,
}: SettingsProps) {
  const [provider, setProvider] = useState<ProviderName>(providerSettings.provider);
  const [model, setModel] = useState(providerSettings.model);
  const [apiKeys, setApiKeys] = useState(providerSettings.apiKeys);
  const [availableModels, setAvailableModels] = useState<ProviderModels | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    fetchModels()
      .then((models) => {
        setAvailableModels(models);
        setLoadingModels(false);
      })
      .catch((err) => {
        console.error("Failed to fetch models:", err);
        setLoadingModels(false);
      });
  }, []);

  // Update model when provider changes
  useEffect(() => {
    if (availableModels && availableModels[provider]) {
      const modelsForProvider = availableModels[provider];
      if (!modelsForProvider.includes(model)) {
        setModel(modelsForProvider[0]);
      }
    }
  }, [provider, availableModels]);

  const handleSave = () => {
    onSave({
      provider,
      model,
      apiKeys,
    });
    onClose();
  };

  const updateApiKey = (providerKey: ProviderName, value: string) => {
    setApiKeys((prev) => ({ ...prev, [providerKey]: value }));
  };

  const modelsForCurrentProvider = availableModels?.[provider] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="p-6 w-full max-w-md bg-neutral-900 rounded-xl border border-neutral-700 shadow-lg flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 p-0 text-[#6a6ec3]/50 hover:text-[#6a6ec3] text-sm"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-neutral-200 mb-2">Settings</h2>

        {/* Provider Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-neutral-300 font-medium">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderName)}
            className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#6a6ec3]"
          >
            {(Object.keys(PROVIDER_LABELS) as ProviderName[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-neutral-300 font-medium">Model</label>
          {loadingModels ? (
            <div className="p-2 text-neutral-400">Loading models...</div>
          ) : (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#6a6ec3]"
            >
              {modelsForCurrentProvider.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <hr className="border-neutral-700 my-2" />

        <h3 className="text-lg font-semibold text-neutral-200">API Keys</h3>
        <p className="text-sm text-neutral-400">
          Enter API keys for the providers you want to use. Keys configured in the backend .env file take priority.
        </p>

        {/* xAI API Key */}
        <div className="flex flex-col gap-1">
          <label className="text-neutral-300 font-medium">xAI API Key</label>
          <input
            type="password"
            value={apiKeys.xai || ""}
            onChange={(e) => updateApiKey("xai", e.target.value)}
            placeholder="xai-..."
            className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#6a6ec3]"
          />
        </div>

        {/* OpenAI API Key */}
        <div className="flex flex-col gap-1">
          <label className="text-neutral-300 font-medium">OpenAI API Key</label>
          <input
            type="password"
            value={apiKeys.openai || ""}
            onChange={(e) => updateApiKey("openai", e.target.value)}
            placeholder="sk-..."
            className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#6a6ec3]"
          />
        </div>

        {/* Anthropic API Key */}
        <div className="flex flex-col gap-1">
          <label className="text-neutral-300 font-medium">Anthropic API Key</label>
          <input
            type="password"
            value={apiKeys.anthropic || ""}
            onChange={(e) => updateApiKey("anthropic", e.target.value)}
            placeholder="sk-ant-..."
            className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-[#6a6ec3]"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-4 bg-[#6a6ec3] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#4d53c4] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
