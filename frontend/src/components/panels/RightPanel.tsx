import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import ToneSelector, { type ToneKey } from "./ToneSelector";
import type { MediaMap, MediaTypes } from "../../types/generation";
import { getMediaType } from "../../utils/media";

type RightPanelProps = {
  wordCount: number;
  setWordCount: (value: number) => void;
  onAddMedia: () => void;
  onEditLore: () => void;
  selectedTone: ToneKey;
  setSelectedTone: (tone: ToneKey) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  onRenameMedia: (oldId: string, newId: string) => void;
  onDeleteMedia: (id: string) => void;
  onWrapSelection: (id: string) => void;
  hasSelection: boolean;
  onGenerateImagePrompt: () => void;
  lightMode: boolean;
};

function sanitizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function RightPanel({
  wordCount,
  setWordCount,
  onAddMedia,
  onEditLore,
  selectedTone,
  setSelectedTone,
  customPrompt,
  setCustomPrompt,
  mediaMap,
  mediaTypes,
  onRenameMedia,
  onDeleteMedia,
  onWrapSelection,
  hasSelection,
  onGenerateImagePrompt,
  lightMode,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'media'>('text');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const entries = Object.entries(mediaMap);

  function startRename(id: string) {
    setRenamingId(id);
    setRenameValue(id);
    // Focus is handled by autoFocus on the input
  }

  function commitRename() {
    if (!renamingId) return;
    const newId = sanitizeId(renameValue);
    if (newId && newId !== renamingId) {
      onRenameMedia(renamingId, newId);
    }
    setRenamingId(null);
  }

  function cancelRename() {
    setRenamingId(null);
  }

  return (
    <div className={`fixed right-6 top-6 z-40 flex flex-col w-56 max-h-[calc(100vh-3rem)] backdrop-blur border rounded-xl shadow-2xl overflow-hidden ${
      lightMode ? "bg-white/95 border-gray-200" : "bg-neutral-900/90 border-neutral-700"
    }`}>

      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-neutral-700">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'text'
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'media'
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Media {entries.length > 0 && <span className="text-xs text-neutral-500">({entries.length})</span>}
        </button>
      </div>

      {/* Text tab */}
      {activeTab === 'text' && (
        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
          <button
            onClick={onEditLore}
            className="hacker-button w-full text-center py-2 hover:bg-neutral-800"
          >
            Edit Lore
          </button>

          <div className="h-px bg-neutral-700" />

          <ToneSelector
            selectedTone={selectedTone}
            setSelectedTone={setSelectedTone}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
          />

          <div className="h-px bg-neutral-700" />

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-neutral-300">
              Word count: {wordCount}
            </label>
            <input
              type="range"
              min="25"
              max="250"
              step="25"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>just a little</span>
              <span>go crazy</span>
            </div>
          </div>

        </div>
      )}

      {/* Media tab */}
      {activeTab === 'media' && (
        <div className="flex flex-col overflow-hidden">
          {/* Full preview overlay */}
          {fullPreviewId && mediaMap[fullPreviewId] && createPortal(
            <div
              className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-pointer"
              onClick={() => setFullPreviewId(null)}
            >
              {getMediaType(fullPreviewId, mediaTypes) === 'video' ? (
                <video src={mediaMap[fullPreviewId]} controls autoPlay preload="auto" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
              ) : getMediaType(fullPreviewId, mediaTypes) === 'audio' ? (
                <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                  <span className="text-neutral-400 text-8xl">♪</span>
                  <p className="text-neutral-300 font-mono text-sm">{fullPreviewId}</p>
                  <audio src={mediaMap[fullPreviewId]} controls autoPlay />
                </div>
              ) : (
                <img src={mediaMap[fullPreviewId]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
              )}
              <button
                className="absolute top-4 right-4 text-white text-xl hover:text-neutral-300 transition-colors"
                onClick={() => setFullPreviewId(null)}
              >✕</button>
              <div className="absolute bottom-4 text-neutral-500 text-xs">Click anywhere to close</div>
            </div>,
            document.body
          )}

          {/* Hover preview — portaled to body, floats left of cursor */}
          {hoveredPreviewId && mediaMap[hoveredPreviewId] && createPortal(
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                left: mousePos.x - 12,
                top: Math.max(
                  window.innerHeight * 0.30,
                  Math.min(mousePos.y, window.innerHeight * 0.70)
                ),
                transform: 'translate(-100%, -50%)',
              }}
            >
              {getMediaType(hoveredPreviewId, mediaTypes) === 'video' ? (
                <video src={mediaMap[hoveredPreviewId]} className="max-w-[45vw] max-h-[60vh] rounded-xl shadow-2xl" muted />
              ) : getMediaType(hoveredPreviewId, mediaTypes) === 'audio' ? (
                <div className="bg-neutral-800 rounded-xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
                  <span className="text-neutral-400 text-5xl">♪</span>
                  <p className="text-neutral-300 font-mono text-xs">{hoveredPreviewId}</p>
                </div>
              ) : (
                <img src={mediaMap[hoveredPreviewId]} alt="" className="max-w-[45vw] max-h-[60vh] object-contain rounded-xl shadow-2xl" />
              )}
            </div>,
            document.body
          )}

          {/* Add button */}
          <div className="p-3 shrink-0 border-b border-neutral-800">
            <button onClick={onAddMedia} className="hacker-button w-full text-xs py-1.5">
              + Add Media
            </button>
          </div>

          {/* Filter bar */}
          {entries.length > 0 && (
            <div className="flex shrink-0 border-b border-neutral-800">
              {(['all', 'image', 'video', 'audio'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMediaFilter(f)}
                  className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                    mediaFilter === f
                      ? 'text-neutral-100 bg-neutral-800'
                      : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'image' ? '▣' : f === 'video' ? '▶' : '♪'}
                </button>
              ))}
            </div>
          )}

          {entries.length === 0 ? (
            <div className="p-4 text-center flex-1">
              <p className="text-neutral-500 text-xs leading-relaxed">
                No media yet.<br />
                Add files or paste into the editor.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
              {entries.filter(([id]) => {
                if (mediaFilter === 'all') return true;
                const type = getMediaType(id, mediaTypes);
                return type === mediaFilter;
              }).map(([id]) => {
                const type = getMediaType(id, mediaTypes);
                const isRenaming = renamingId === id;

                return (
                  <div
                    key={id}
                    draggable={!isRenaming}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/vodnik-media-id', id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 flex flex-col gap-2"
                    style={{ cursor: isRenaming ? 'default' : 'grab' }}
                  >
                    {/* Title row */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-neutral-500 text-xs shrink-0 select-none">
                        {type === 'video' ? '▶' : type === 'audio' ? '♪' : '▣'}
                      </span>
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') cancelRename();
                          }}
                          onBlur={commitRename}
                          className="text-[10px] font-mono bg-neutral-700 border border-[#6a6ec3] rounded px-1 py-0.5 flex-1 min-w-0 text-neutral-200 focus:outline-none"
                          placeholder="new-name"
                        />
                      ) : (
                        <button
                          onClick={() => startRename(id)}
                          className="text-[10px] text-neutral-300 font-mono flex-1 min-w-0 text-left hover:text-white transition-colors truncate"
                          title={`${id} — click to rename`}
                        >
                          {id}
                        </button>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-around border-t border-neutral-700 pt-1.5">
                      <button
                        onClick={() => setFullPreviewId(id)}
                        onMouseEnter={(e) => { setHoveredPreviewId(id); setMousePos({ x: e.clientX, y: e.clientY }); }}
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredPreviewId(null)}
                        title="Preview"
                        className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onWrapSelection(id)}
                        title="Wrap selected text"
                        className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteMedia(id)}
                        title="Delete"
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generate Image Prompt footer */}
          <div className="shrink-0 p-3 border-t border-neutral-800">
            <button
              onClick={onGenerateImagePrompt}
              disabled={!hasSelection}
              title={hasSelection ? 'Generate an image prompt from the selected passage' : 'Select text in the editor first'}
              className={`
                w-full py-2 px-3 rounded-lg text-xs font-semibold
                flex items-center justify-center gap-2
                border transition-all duration-150
                ${hasSelection
                  ? 'bg-[#c3b96a]/10 border-[#c3b96a]/45 text-[#c3b96a] hover:bg-[#c3b96a]/20 hover:border-[#c3b96a]/75 cursor-pointer'
                  : 'bg-neutral-800/40 border-neutral-700/50 text-neutral-600 cursor-not-allowed'
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/>
              </svg>
              Generate Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
