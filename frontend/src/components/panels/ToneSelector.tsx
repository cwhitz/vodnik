import { useState } from "react";
import tonePrompts from "../../config/tonePrompts.json";

export type ToneKey = "Normal" | "Fantasy" | "Spicy" | "Custom";

type ToneSelectorProps = {
  selectedTone: ToneKey;
  setSelectedTone: (tone: ToneKey) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
};

const toneKeys: ToneKey[] = ["Normal", "Fantasy", "Spicy", "Custom"];

export function getTonePrompt(tone: ToneKey, customPrompt: string): string {
  if (tone === "Custom") {
    return customPrompt;
  }
  return tonePrompts[tone] || "";
}

export default function ToneSelector({
  selectedTone,
  setSelectedTone,
  customPrompt,
  setCustomPrompt,
}: ToneSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);

  const handleToneClick = (tone: ToneKey) => {
    setSelectedTone(tone);
    if (tone === "Custom") {
      setCustomOpen(true);
    } else {
      setCustomOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-300">Tone</label>
      <div className="flex flex-col gap-1">
        {toneKeys.map((tone) => (
          <button
            key={tone}
            onClick={() => handleToneClick(tone)}
            className={`w-full text-center py-2 text-sm transition-colors rounded ${
              selectedTone === tone
                ? "!bg-[#6a6ec3] !text-black font-medium"
                : "hacker-button hover:bg-neutral-800"
            }`}
          >
            {tone}
          </button>
        ))}
      </div>

      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-neutral-900 rounded-xl p-6 w-96 max-w-[90vw] border border-neutral-700 relative">
            <button
              onClick={() => setCustomOpen(false)}
              className="absolute top-3 right-3 p-0 text-[#6a6ec3]/50 hover:text-[#6a6ec3] text-sm"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold text-neutral-200 mb-4">
              Custom Tone Prompt
            </h2>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom style prompt..."
              className="w-full h-40 p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 resize-none focus:outline-none focus:border-[#6a6ec3]"
            />
            <button
              onClick={() => setCustomOpen(false)}
              className="hacker-button mt-4 w-full"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
