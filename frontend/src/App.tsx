import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { CodeMirrorEditorHandle } from "./components/editor/CodeMirrorEditor";
import LeftPanel from "./components/panels/LeftPanel";
import RightPanel from "./components/panels/RightPanel";
import Editor from "./components/editor/Editor";
import Presentation from "./components/modes/Presentation";
import MediaManager from "./components/modals/MediaManager";
import SettingsModal from "./components/modals/Settings";
import ReadmeModal from "./components/modals/ReadmeModal";
import ImagePromptModal from "./components/modals/ImagePromptModal";
import NewStoryModal from "./components/modals/NewStoryModal";
import "./buttons.css";
import { useGeneration } from "./hooks/useGeneration";
import { useDirtyUnloadGuard } from "./hooks/useDirtyUnloadGuard";
import { useGoogleDrive } from "./hooks/useGoogleDrive";
import { saveStory, generateStoryZip, sanitizeFilename } from "./utils/saveStory";
import { getMediaType } from "./utils/media";
import { loadStory } from "./utils/loadStory";
import type { LoreItem, MediaMap, MediaTypes, Mode, ProviderSettings } from "./types/generation";
import { type ToneKey, getTonePrompt } from "./components/panels/ToneSelector";

export default function App() {
  const [text, setText] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [wordCount, setWordCount] = useState(50);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mediaMap, setMediaMap] = useState<MediaMap>({});
  const [mediaTypes, setMediaTypes] = useState<MediaTypes>({});
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [loreItems, setLoreItems] = useState<LoreItem[]>([
    { id: Date.now(), category: "character", text: "" },
  ]);
  const [mode, setMode] = useState<Mode>("write");
  const [selectedTone, setSelectedTone] = useState<ToneKey>("Normal");
  const [customPrompt, setCustomPrompt] = useState("");
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem("vodnik-provider-settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parse errors
      }
    }
    return {
      provider: "xai",
      model: "grok-3-mini",
      apiKeys: {},
    };
  });
  const [lightMode, setLightMode] = useState(() => localStorage.getItem("vodnik-light-mode") === "true");
  const [hasSelection, setHasSelection] = useState(false);
  const [imagePromptModal, setImagePromptModal] = useState<{
    selectedText: string;
    textBefore: string;
    textAfter: string;
  } | null>(null);
  const cmRef = useRef<CodeMirrorEditorHandle | null>(null);
  const [editorPreviewId, setEditorPreviewId] = useState<string | null>(null);
  const isDirty = text.length > 0;
  useDirtyUnloadGuard(isDirty);
  const [newStoryOpen, setNewStoryOpen] = useState(false);

  const {
    loading,
    generateNextLine,
    generateBetweenText,
    undoLastGenerated,
    modifySection,
  } = useGeneration();

  const {
    isLoading: isDriveLoading,
    saveStory: saveToDrive,
    loadStory: loadFromDrive,
    openPicker,
  } = useGoogleDrive();

  const handleSaveToDrive = async () => {
    try {
      const blob = await generateStoryZip(text, mediaMap, loreItems, title);
      const filename = `${sanitizeFilename(title)}.zip`;
      await saveToDrive(blob, filename);
      alert("Story saved to Google Drive!");
    } catch (err) {
      console.error("Failed to save to Drive:", err);
      alert("Failed to save to Google Drive. Please try again.");
    }
  };

  const handleLoadFromDrive = async () => {
    try {
      await openPicker(async (fileId, fileName) => {
        try {
          const blob = await loadFromDrive(fileId);
          const file = new File([blob], fileName, { type: "application/zip" });
          await loadStory(file, setText, setMediaMap, setLoreItems, setTitle, setMediaTypes);
        } catch (err) {
          console.error("Failed to load from Drive:", err);
          alert("Failed to load from Google Drive. Please try again.");
        }
      });
    } catch (err) {
      console.error("Failed to open picker:", err);
      alert("Failed to open Google Drive picker. Please try again.");
    }
  };

  const handleRenameMedia = (oldId: string, newId: string) => {
    if (!newId || newId === oldId || !mediaMap[oldId]) return;
    setMediaMap((prev) => {
      const { [oldId]: url, ...rest } = prev;
      return { ...rest, [newId]: url };
    });
    setMediaTypes((prev) => {
      const { [oldId]: type, ...rest } = prev;
      return { ...rest, [newId]: type };
    });
    setText((prev) =>
      prev
        .replaceAll(`<${oldId}>`, `<${newId}>`)
        .replaceAll(`</${oldId}>`, `</${newId}>`)
    );
  };

  const wrapSelection = (id: string) => {
    cmRef.current?.wrapSelection(id);
  };

  const handleSwapTag = (oldId: string, newId: string) => {
    setText((prev) =>
      prev
        .replaceAll(`<${oldId}>`, `<${newId}>`)
        .replaceAll(`</${oldId}>`, `</${newId}>`)
    );
  };

  const handleDeleteMedia = (id: string) => {
    setMediaMap((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setMediaTypes((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleGenerateImagePrompt = () => {
    const selectedText = cmRef.current?.getSelectedText() ?? "";
    if (!selectedText) return;
    const { start, end } = cmRef.current?.getSelectionOffsets() ?? { start: 0, end: 0 };
    const before = text.slice(0, start);
    const after = text.slice(end);
    // Grab up to 2 paragraphs of context on each side
    const textBefore = before.split(/\n\n+/).slice(-2).join("\n\n");
    const textAfter = after.split(/\n\n+/).slice(0, 2).join("\n\n");
    setImagePromptModal({ selectedText, textBefore, textAfter });
  };

  const handleModifySection = () => {
    const selectedText = cmRef.current?.getSelectedText() ?? "";
    if (!selectedText) return;
    const { start, end } = cmRef.current?.getSelectionOffsets() ?? { start: 0, end: 0 };
    const tonePrompt = getTonePrompt(selectedTone, customPrompt);
    const combinedInstructions = [tonePrompt, additionalInstructions].filter(Boolean).join("\n\n");
    modifySection({ text, selectedText, start, end, additionalInstructions: combinedInstructions, loreItems, providerSettings, setText });
  };

  const handleGenerateNext = useCallback(() => {
    if (loading) return;
    const tonePrompt = getTonePrompt(selectedTone, customPrompt);
    const combinedInstructions = [tonePrompt, additionalInstructions]
      .filter(Boolean)
      .join("\n\n");
    generateNextLine({
      text,
      additionalInstructions: combinedInstructions,
      wordCount,
      loreItems,
      providerSettings,
      setText,
    });
  }, [loading, selectedTone, customPrompt, additionalInstructions, text, wordCount, loreItems, providerSettings, generateNextLine]);

  // Persist provider settings to localStorage
  useEffect(() => {
    localStorage.setItem("vodnik-provider-settings", JSON.stringify(providerSettings));
  }, [providerSettings]);

  // Cmd+Enter keyboard shortcut for generate next line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && mode === 'write') {
        e.preventDefault();
        handleGenerateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleGenerateNext]);

  return (
    <div
      className={`flex flex-col h-screen w-screen text-neutral-200 ${lightMode ? "light-mode bg-stone-50" : ""}`}
      style={lightMode ? {} : {
        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      {!lightMode && <div className="absolute inset-0 bg-black/70 pointer-events-none"></div>}
      <div className="relative z-10 flex flex-col h-full">
        <LeftPanel
          mode={mode}
          setMode={setMode}
          onNewStory={() => setNewStoryOpen(true)}
          saveStory={() => saveStory(title, text, mediaMap, loreItems)}
          onLoadStory={(file) => loadStory(file, setText, setMediaMap, setLoreItems, setTitle, setMediaTypes)}
          setSettingsOpen={setSettingsOpen}
          setReadmeOpen={setReadmeOpen}
          onSaveToDrive={handleSaveToDrive}
          onLoadFromDrive={handleLoadFromDrive}
          isDriveLoading={isDriveLoading}
          lightMode={lightMode}
          onToggleLightMode={() => {
            const next = !lightMode;
            setLightMode(next);
            localStorage.setItem("vodnik-light-mode", String(next));
          }}
        />

        {mode === "write" && (
          <RightPanel
            wordCount={wordCount}
            setWordCount={setWordCount}
            onAddMedia={() => document.getElementById("fileUpload")?.click()}
            onEditLore={() => setLoreOpen(true)}
            mediaMap={mediaMap}
            mediaTypes={mediaTypes}
            onRenameMedia={handleRenameMedia}
            onDeleteMedia={handleDeleteMedia}
            onWrapSelection={wrapSelection}
            hasSelection={hasSelection}
            onGenerateImagePrompt={handleGenerateImagePrompt}
            selectedTone={selectedTone}
            setSelectedTone={setSelectedTone}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
            lightMode={lightMode}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            providerSettings={providerSettings}
            onSave={setProviderSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {readmeOpen && (
          <ReadmeModal onClose={() => setReadmeOpen(false)} />
        )}

        {newStoryOpen && (
          <NewStoryModal
            onClose={() => setNewStoryOpen(false)}
            setText={setText}
            setTitle={setTitle}
            setLoreItems={setLoreItems}
            loreItems={loreItems}
            providerSettings={providerSettings}
          />
        )}

        {imagePromptModal && (
          <ImagePromptModal
            selectedText={imagePromptModal.selectedText}
            textBefore={imagePromptModal.textBefore}
            textAfter={imagePromptModal.textAfter}
            loreItems={loreItems}
            providerSettings={providerSettings}
            onClose={() => setImagePromptModal(null)}
          />
        )}

        {mediaManagerOpen && (
          <MediaManager
            isOpen={mediaManagerOpen}
            onClose={() => setMediaManagerOpen(false)}
            mediaMap={mediaMap}
            mediaTypes={mediaTypes}
          />
        )}

        {/* Preview overlay triggered from in-editor media tag popup */}
        {editorPreviewId && mediaMap[editorPreviewId] && createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-pointer"
            onClick={() => setEditorPreviewId(null)}
          >
            {getMediaType(editorPreviewId, mediaTypes) === 'video' ? (
              <video src={mediaMap[editorPreviewId]} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            ) : getMediaType(editorPreviewId, mediaTypes) === 'audio' ? (
              <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
                <span className="text-neutral-400 text-8xl">♪</span>
                <p className="text-neutral-300 font-mono text-sm">{editorPreviewId}</p>
                <audio src={mediaMap[editorPreviewId]} controls autoPlay />
              </div>
            ) : (
              <img src={mediaMap[editorPreviewId]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" />
            )}
            <button className="absolute top-4 right-4 text-white text-xl hover:text-neutral-300 transition-colors" onClick={() => setEditorPreviewId(null)}>✕</button>
            <div className="absolute bottom-4 text-neutral-500 text-xs">Click anywhere to close</div>
          </div>,
          document.body
        )}

      <div className={`flex flex-1 overflow-hidden ${
        mode === "write"
          ? lightMode
            ? "justify-center bg-stone-50"
            : "justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900"
          : lightMode ? "bg-gray-50" : "bg-black"
      }`}>
        <div className={`flex flex-col w-full ${mode === "write" ? "gap-6 pb-6 max-w-4xl px-6 ml-64 mr-64" : "pl-72 h-full"}`}>
          {mode === "write" ? (
            <Editor
              text={text}
              setText={setText}
              title={title}
              setTitle={setTitle}
              additionalInstructions={additionalInstructions}
              setAdditionalInstructions={setAdditionalInstructions}
              wordCount={wordCount}
              handleGenerateNextLine={handleGenerateNext}
              handleGenerateBetween={() => {
                const { start: startPos, end: endPos } =
                  cmRef.current?.getSelectionOffsets() ?? { start: 0, end: 0 };
                const tonePrompt = getTonePrompt(selectedTone, customPrompt);
                const combinedInstructions = [tonePrompt, additionalInstructions]
                  .filter(Boolean)
                  .join("\n\n");
                generateBetweenText({
                  text,
                  additionalInstructions: combinedInstructions,
                  wordCount,
                  startPos,
                  endPos,
                  loreItems,
                  providerSettings,
                  setText,
                });
              }}
              handleUndoLastGenerated={() => undoLastGenerated(setText)}
              mediaMap={mediaMap}
              mediaTypes={mediaTypes}
              setMediaMap={setMediaMap}
              setMediaTypes={setMediaTypes}
              cmRef={cmRef}
              onPreview={setEditorPreviewId}
              onSwapTag={handleSwapTag}
              onModifySection={handleModifySection}
              onSelectionChange={setHasSelection}
              lightMode={lightMode}
              loading={loading}
              loreItems={loreItems}
              setLoreItems={setLoreItems}
              loreOpen={loreOpen}
              setLoreOpen={setLoreOpen}
              newStoryOpen={newStoryOpen}
              setNewStoryOpen={setNewStoryOpen}
            />
          ) : (
            <Presentation
              text={text}
              mediaMap={mediaMap}
              mediaTypes={mediaTypes}
              title={title}
              setTitle={setTitle}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
