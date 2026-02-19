import { useState } from "react";
import type { RefObject, ChangeEvent } from "react";
import type { LoreItem, MediaMap, MediaTypes } from "../../types/generation";
import TextAreaEditor from "./TextAreaEditor";
import GenerateButtons from "./GenerateButtons";
import LoreManager from "../modals/LoreManager";
import type { CodeMirrorEditorHandle } from "./CodeMirrorEditor";

type EditorProps = {
  text: string;
  setText: (text: string) => void;
  title: string;
  setTitle: (title: string) => void;
  additionalInstructions: string;
  setAdditionalInstructions: (instructions: string) => void;
  wordCount: number;
  handleGenerateNextLine: () => void;
  handleGenerateBetween: () => void;
  handleUndoLastGenerated: () => void;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  setMediaMap: (updater: (prev: MediaMap) => MediaMap) => void;
  setMediaTypes: (updater: (prev: MediaTypes) => MediaTypes) => void;
  setNewStoryOpen: (open: boolean) => void;
  newStoryOpen: boolean;
  cmRef: RefObject<CodeMirrorEditorHandle | null>;
  loading: boolean;
  loreItems: LoreItem[];
  setLoreItems: (items: LoreItem[]) => void;
  loreOpen: boolean;
  setLoreOpen: (open: boolean) => void;
  onPreview: (id: string) => void;
  onSwapTag: (oldId: string, newId: string) => void;
  onModifySection: () => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  lightMode: boolean;
};

export default function Editor({
  text,
  setText,
  title,
  setTitle,
  additionalInstructions,
  setAdditionalInstructions,
  wordCount,
  handleGenerateNextLine,
  handleGenerateBetween,
  handleUndoLastGenerated,
  mediaMap,
  mediaTypes,
  setMediaMap,
  setMediaTypes,
  setNewStoryOpen,
  newStoryOpen,
  cmRef,
  loading,
  loreItems,
  setLoreItems,
  loreOpen,
  setLoreOpen,
  onPreview,
  onSwapTag,
  onModifySection,
  onSelectionChange,
  lightMode,
}: EditorProps) {
  const [hasSelection, setHasSelection] = useState(false);
  const handleSelectionChange = (has: boolean) => {
    setHasSelection(has);
    onSelectionChange?.(has);
  };
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: { id: string; url: string; mediaType: 'image' | 'video' | 'audio'; name: string }[] = [];

    for (const file of Array.from(files)) {
      const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const url = URL.createObjectURL(file);
      const mediaType: 'image' | 'video' | 'audio' =
        file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'image';
      newMedia.push({ id, url, mediaType, name: file.name });
    }

    // Add to mediaMap and mediaTypes
    setMediaMap((prev) => {
      const updated = { ...prev };
      for (const item of newMedia) {
        updated[item.id] = item.url;
      }
      return updated;
    });
    setMediaTypes((prev) => {
      const updated = { ...prev };
      for (const item of newMedia) {
        updated[item.id] = item.mediaType;
      }
      return updated;
    });

    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex flex-col w-full h-full relative">
      <LoreManager
        isOpen={loreOpen}
        onClose={() => setLoreOpen(false)}
        loreItems={loreItems}
        setLoreItems={setLoreItems}
      />
      <input
        id="fileUpload"
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="px-4 pt-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Story title..."
          className="
            w-full
            bg-transparent
            text-2xl
            font-bold
            text-neutral-100
            outline-none
            border-b
            border-neutral-700
            focus:border-[#6a6ec3]
            pb-2
          "
        />
      </div>
      <TextAreaEditor
        text={text}
        setText={setText}
        additionalInstructions={additionalInstructions}
        setAdditionalInstructions={setAdditionalInstructions}
        cmRef={cmRef}
        mediaMap={mediaMap}
        mediaTypes={mediaTypes}
        setMediaMap={setMediaMap}
        setMediaTypes={setMediaTypes}
        onPreview={onPreview}
        onSwapTag={onSwapTag}
        onSelectionChange={handleSelectionChange}
        lightMode={lightMode}
      />
      <GenerateButtons
        onGenerateNext={handleGenerateNextLine}
        onGenerateAtCursor={handleGenerateBetween}
        onUndoLast={handleUndoLastGenerated}
        onModifySection={onModifySection}
        hasSelection={hasSelection}
        loading={loading}
      />
    </div>
  );
}
