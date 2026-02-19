type ReadmeModalProps = {
  onClose: () => void;
};

export default function ReadmeModal({ onClose }: ReadmeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-xl w-2/3 max-w-3xl max-h-[82vh] overflow-y-auto relative border border-neutral-700">
        <button
          className="absolute top-3 right-3 p-0 text-[#6a6ec3]/50 hover:text-[#6a6ec3] text-sm"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-neutral-200 text-2xl mb-1">Vodnik</h2>
        <p className="text-neutral-500 text-sm mb-6">An AI-assisted story editor with media support.</p>

        <div className="space-y-7 text-neutral-300">

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Writing with the AI</h3>
            <p className="text-neutral-400 text-sm mb-2">
              Three buttons sit at the bottom of the editor. They all use your current tone, lore, and instructions.
            </p>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Generate next line</strong> — appends a new passage to the end of your story. <span className="text-neutral-500">Shortcut: Cmd/Ctrl + Enter.</span></li>
              <li><strong className="text-neutral-200">Generate at cursor</strong> — inserts AI text at wherever your cursor is, or between the start and end of a selection.</li>
              <li><strong className="text-neutral-200">Modify Section</strong> — select any passage first, then click this. The AI rewrites just that selection in context of the surrounding story. <strong className="text-neutral-200">Undo ⟲</strong> restores your original text exactly.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Attaching images, video & audio</h3>
            <p className="text-neutral-400 text-sm mb-2">
              Media lives inside tags in your text — like <span className="font-mono text-neutral-300 bg-neutral-800 px-1 rounded text-xs">&lt;photo-id&gt;A rainy street&lt;/photo-id&gt;</span>. The text inside is the caption shown in Read mode. There are a few ways to create a tag:
            </p>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Paste</strong> — copy an image to your clipboard and paste into the editor. If you have text selected, it becomes the caption.</li>
              <li><strong className="text-neutral-200">Drag & drop</strong> — drag any card from the Media panel on the right and drop it onto the editor.</li>
              <li><strong className="text-neutral-200">Wrap button</strong> — in the Media panel, the bracket icon wraps whatever you have selected in the editor.</li>
              <li><strong className="text-neutral-200">Hover a tag badge</strong> — hovering the purple badge in the editor opens a small popup to preview, swap the image, or remove the tag.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Reading your story</h3>
            <p className="text-neutral-400 text-sm mb-2">
              Switch to Read mode with the toggle at the top of the left panel. Your story is split into segments — one per media tag, plus any surrounding text — and displayed like a slideshow.
            </p>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Navigate</strong> with the arrow buttons or your keyboard's ← → keys.</li>
              <li><strong className="text-neutral-200">Portrait images</strong> (taller than wide) sit on the left; your text scrolls on the right.</li>
              <li><strong className="text-neutral-200">Landscape images</strong> (wider than tall) sit on top; your text scrolls below.</li>
              <li><strong className="text-neutral-200">Fullscreen</strong> — click the expand icon in the top-right corner. Escape exits.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Shaping how the AI writes</h3>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Tone</strong> (right panel) — Normal, Fantasy, Spicy, or a Custom prompt you write yourself. This sets the overall voice for all generations.</li>
              <li><strong className="text-neutral-200">Guide the story</strong> — the text area below the editor. Use it for session-level hints: where the plot is heading, what mood to maintain, constraints to respect.</li>
              <li><strong className="text-neutral-200">Word count slider</strong> — controls roughly how long each generation is (25–250 words).</li>
              <li><strong className="text-neutral-200">Lore Manager</strong> — a persistent place to record characters, settings, and plot points. Everything here gets sent with every AI request, so the model stays consistent with your world.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Saving your work</h3>
            <p className="text-neutral-400 text-sm mb-2">
              Stories are saved as <span className="font-mono text-xs text-neutral-300">.zip</span> files that bundle your text, title, lore, and all media together — so everything travels as one file.
            </p>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Save / Load Story</strong> — saves to or loads from your computer.</li>
              <li><strong className="text-neutral-200">Save / Load to Drive</strong> — syncs the same zip with Google Drive.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[#6a6ec3] text-base font-semibold mb-1.5">Settings & appearance</h3>
            <ul className="space-y-2 text-sm">
              <li><strong className="text-neutral-200">Settings</strong> — pick your AI provider (xAI / Grok, OpenAI, or Anthropic) and enter your API key. The key is stored locally in your browser only.</li>
              <li><strong className="text-neutral-200">Light Mode</strong> — toggle at the bottom of the left panel. Your preference is remembered between sessions.</li>
            </ul>
          </section>

        </div>

        <button onClick={onClose} className="hacker-button w-full mt-6">
          Got it!
        </button>
      </div>
    </div>
  );
}
