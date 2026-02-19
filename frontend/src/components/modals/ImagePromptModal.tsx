import { useState, useEffect } from "react";
import { streamImagePrompt } from "../../services/generationApi";
import type { LoreItem, ProviderSettings } from "../../types/generation";

type ImagePromptModalProps = {
  selectedText: string;
  textBefore: string;
  textAfter: string;
  loreItems: LoreItem[];
  providerSettings: ProviderSettings;
  onClose: () => void;
};

export default function ImagePromptModal({
  selectedText,
  textBefore,
  textAfter,
  loreItems,
  providerSettings,
  onClose,
}: ImagePromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setIsGenerating(true);
    setPrompt("");
    setError(null);
    try {
      await streamImagePrompt(
        { selectedText, textBefore, textAfter, loreItems, providerSettings },
        (chunk) => setPrompt((prev) => prev + chunk)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Auto-start on mount
  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-[680px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-neutral-200 font-semibold">Image Prompt</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors text-sm">✕</button>
        </div>

        <div className="flex flex-col gap-4 p-5 overflow-y-auto">

          {/* Source passage */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Selected passage</p>
            <div className="bg-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-300 leading-relaxed max-h-32 overflow-y-auto border border-neutral-700">
              {selectedText}
            </div>
          </div>

          {/* Generated prompt */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Generated image prompt</p>
            <div className="relative bg-neutral-800 rounded-lg border border-neutral-700 min-h-[80px]">
              {prompt ? (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-transparent text-neutral-100 text-sm leading-relaxed px-4 py-3 resize-none focus:outline-none min-h-[80px]"
                  rows={4}
                />
              ) : isGenerating ? (
                <p className="text-neutral-500 text-sm px-4 py-3 animate-pulse">Generating prompt…</p>
              ) : error ? (
                <p className="text-red-400 text-sm px-4 py-3">{error}</p>
              ) : (
                <p className="text-neutral-600 text-sm px-4 py-3">No prompt yet.</p>
              )}
              {prompt && (
                <button
                  onClick={() => { navigator.clipboard.writeText(prompt); }}
                  className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-200 transition-colors p-1"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Image placeholder */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Image</p>
            <div className="bg-neutral-800 border border-dashed border-neutral-600 rounded-lg h-40 flex items-center justify-center">
              <p className="text-neutral-600 text-sm">Image generation coming soon</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-800 shrink-0">
          <button
            onClick={generate}
            disabled={isGenerating}
            className="hacker-button flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating…" : "Re-run"}
          </button>
          <button onClick={onClose} className="hacker-button flex-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
