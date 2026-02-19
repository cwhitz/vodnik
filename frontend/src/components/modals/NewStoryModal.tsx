import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamStart, generateStartingLore } from "../../services/generationApi";
import type { LoreItem, ProviderSettings } from "../../types/generation";

type NewStoryModalProps = {
  onClose: () => void;
  setText: (text: string) => void;
  setTitle: (title: string) => void;
  setLoreItems: (items: LoreItem[]) => void;
  loreItems: LoreItem[];
  providerSettings: ProviderSettings;
};

const GENRES = ["Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance", "Thriller", "Historical", "Literary"];

const WORD_COUNT_OPTIONS = [
  { label: "Short", value: 150 },
  { label: "Medium", value: 400 },
  { label: "Long", value: 700 },
];

const SURPRISE_SEEDS = [
  "A detective who can see the last moments of any dead person takes a case where the victim saw nothing at all.",
  "Two rival AI systems discover they've both fallen in love with the same human.",
  "A lighthouse keeper finds a message in a bottle from themselves, dated ten years in the future.",
  "In a city where memories are traded like currency, a thief steals one that was never meant to exist.",
  "The last librarian on Earth guards the final physical book — it contains the key to rebuilding civilization.",
  "A time traveler gets stuck in the five minutes before a massive explosion, reliving it endlessly.",
  "An archaeologist unearths a smartphone from 3,000 years ago. It still has battery.",
  "A child's imaginary friend turns out to be the ghost of someone who hasn't been born yet.",
  "Two strangers keep meeting in their dreams and decide to find each other in the waking world.",
  "A musician discovers every song they write comes true within a week.",
  "The first colonists on Mars find evidence that someone was there before them — recently.",
  "A translator hired to decode an ancient text realizes it's addressed to her, by name.",
];

const CATEGORY_STYLES: Record<LoreItem["category"], string> = {
  character: "bg-[#6a6ec3]/20 text-[#6a6ec3] border-[#6a6ec3]/40",
  setting: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
  "plot point": "bg-[#c3b96a]/15 text-[#c3b96a] border-[#c3b96a]/35",
};

export default function NewStoryModal({
  onClose,
  setText,
  setTitle,
  setLoreItems,
  loreItems,
  providerSettings,
}: NewStoryModalProps) {
  const [title, setLocalTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(400);
  const [preview, setPreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingLore, setStartingLore] = useState<LoreItem[]>([]);
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [loreError, setLoreError] = useState<string | null>(null);

  async function runNewStory() {
    if (isGenerating) return;
    setIsGenerating(true);
    setPreview("");
    setError(null);
    setStartingLore([]);
    setLoreError(null);

    const promptParts = [
      title ? `Story title: "${title}"` : null,
      selectedGenre ? `Genre / style: ${selectedGenre}` : null,
      instructions.trim() || null,
    ].filter(Boolean);

    const promptText = promptParts.join("\n\n");

    try {
      let accumulated = "";
      await streamStart(
        {
          text: promptText,
          word_count: wordCount,
          lore: loreItems,
          providerSettings,
        },
        (chunk: string) => {
          accumulated += chunk;
          setPreview(accumulated);
        }
      );

      // After prose finishes, generate lore from the prose + prompt
      setIsGeneratingLore(true);
      try {
        const newLore = await generateStartingLore({
          prompt: promptText,
          prose: accumulated,
          providerSettings,
        });
        setStartingLore(newLore);
      } catch (loreErr) {
        setLoreError(loreErr instanceof Error ? loreErr.message : "Lore generation failed.");
      } finally {
        setIsGeneratingLore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function acceptNewStory() {
    setText(preview);
    if (title.trim()) setTitle(title.trim());
    if (startingLore.length > 0) setLoreItems(startingLore);
    onClose();
  }

  function surpriseMe() {
    const seed = SURPRISE_SEEDS[Math.floor(Math.random() * SURPRISE_SEEDS.length)];
    setInstructions(seed);
    setSelectedGenre(null);
  }

  function updateLoreText(id: number, text: string) {
    setStartingLore((prev) => prev.map((item) => item.id === id ? { ...item, text } : item));
  }

  function deleteLoreItem(id: number) {
    setStartingLore((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Atmospheric backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 40%, rgba(106,110,195,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(30,20,60,0.6) 0%, transparent 70%), linear-gradient(135deg, #0a0a12 0%, #0f0f1a 50%, #0a0a0f 100%)",
        }}
        onClick={onClose}
      />

      <div className="relative z-10 flex w-[1100px] max-w-[96vw] h-[82vh] max-h-[720px] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(145deg, #111118 0%, #0d0d14 100%)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>

        {/* ── Left panel: inputs ───────────────────────────────────────── */}
        <div className="w-[34%] shrink-0 flex flex-col gap-5 p-7 border-r border-white/8 overflow-y-auto">
          <div>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-0.5">New Story</h2>
            <p className="text-neutral-500 text-xs">Start with a title, a genre, or a spark.</p>
          </div>

          {/* Title */}
          <input
            autoFocus
            value={title}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Story title..."
            className="bg-transparent border-b border-neutral-700 focus:border-[#6a6ec3] text-white text-lg font-semibold placeholder-neutral-600 outline-none pb-2 transition-colors w-full"
          />

          {/* Genre chips */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Genre</p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-100 ${
                    selectedGenre === g
                      ? "bg-[#6a6ec3]/25 border-[#6a6ec3]/70 text-[#6a6ec3]"
                      : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col flex-1 min-h-0">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Prompt / instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runNewStory(); }}
              placeholder="Describe your story, its world, its characters, the opening scene..."
              className="flex-1 min-h-[80px] bg-neutral-800/50 border border-neutral-700/60 focus:border-[#6a6ec3]/50 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none resize-none transition-colors leading-relaxed"
            />
          </div>

          {/* Word count */}
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Opening length</p>
            <div className="flex gap-1.5">
              {WORD_COUNT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWordCount(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all duration-100 ${
                    wordCount === opt.value
                      ? "bg-neutral-700 border-neutral-500 text-neutral-100"
                      : "bg-neutral-800/50 border-neutral-700/50 text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={surpriseMe}
              className="w-full py-2 rounded-lg text-xs font-medium border border-dashed border-neutral-700 text-neutral-500 hover:border-[#6a6ec3]/50 hover:text-[#6a6ec3] transition-all flex items-center justify-center gap-2"
            >
              <span>✦</span> Surprise me
            </button>
            <div className="flex gap-2">
              <button
                onClick={runNewStory}
                disabled={isGenerating}
                className="hacker-button flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating…" : isGeneratingLore ? "Extracting…" : preview ? "Re-run" : "Generate"}
              </button>
              <button
                onClick={acceptNewStory}
                disabled={isGenerating || isGeneratingLore || !preview}
                className="hacker-button flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Accept
              </button>
            </div>
          </div>
        </div>

        {/* ── Center panel: prose preview ──────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
          <div className="px-7 pt-7 pb-3 shrink-0 border-b border-white/5">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Preview</p>
          </div>
          <div className="flex-1 overflow-y-auto px-7 py-5">
            {error ? (
              <p className="text-red-400 text-sm">{error}</p>
            ) : preview ? (
              <div className="prose prose-invert prose-sm max-w-none text-neutral-200 leading-relaxed">
                <ReactMarkdown>{preview}</ReactMarkdown>
              </div>
            ) : isGenerating ? (
              <p className="text-neutral-600 text-sm animate-pulse">Writing your story…</p>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 select-none">
                <p className="text-neutral-700 text-4xl">✦</p>
                <p className="text-neutral-600 text-sm text-center leading-relaxed max-w-xs">
                  Your opening will appear here.<br />Add a prompt or pick a genre and click Generate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: starting lore ───────────────────────────────── */}
        <div className="w-[26%] shrink-0 flex flex-col overflow-hidden">
          <div className="px-5 pt-7 pb-3 shrink-0 border-b border-white/5">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Starting Lore</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isGeneratingLore ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-neutral-600 text-xs animate-pulse">Extracting lore…</p>
              </div>
            ) : loreError ? (
              <p className="text-red-400 text-xs">{loreError}</p>
            ) : startingLore.length > 0 ? (
              <div className="flex flex-col gap-3">
                {startingLore.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.character}`}>
                        {item.category}
                      </span>
                      <button
                        onClick={() => deleteLoreItem(item.id)}
                        className="text-neutral-700 hover:text-red-400 text-sm leading-none transition-colors"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      value={item.text}
                      onChange={(e) => updateLoreText(item.id, e.target.value)}
                      rows={3}
                      className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-800/40 border border-neutral-700/50 rounded-lg px-2.5 py-2 resize-none outline-none focus:border-[#6a6ec3]/50 w-full transition-colors"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 select-none px-2">
                <p className="text-neutral-700 text-3xl">◈</p>
                <p className="text-neutral-700 text-xs text-center leading-relaxed">
                  Characters, settings, and plot notes will appear here after generation.
                </p>
              </div>
            )}
          </div>

          {startingLore.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 shrink-0">
              <p className="text-[10px] text-neutral-600 text-center">
                Accept will replace your current lore
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
