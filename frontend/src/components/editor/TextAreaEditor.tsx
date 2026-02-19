import { useState, type DragEvent, type RefObject } from "react";
import type { MediaMap, MediaTypes } from "../../types/generation";
import type { CodeMirrorEditorHandle } from "./CodeMirrorEditor";
import CodeMirrorEditor from "./CodeMirrorEditor";

type TextAreaEditorProps = {
  text: string;
  setText: (text: string) => void;
  additionalInstructions: string;
  setAdditionalInstructions: (instructions: string) => void;
  cmRef: RefObject<CodeMirrorEditorHandle | null>;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  setMediaMap: (updater: (prev: MediaMap) => MediaMap) => void;
  setMediaTypes: (updater: (prev: MediaTypes) => MediaTypes) => void;
  onPreview: (id: string) => void;
  onSwapTag: (oldId: string, newId: string) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  lightMode?: boolean;
};

export default function TextAreaEditor({
  text,
  setText,
  additionalInstructions,
  setAdditionalInstructions,
  cmRef,
  mediaMap,
  mediaTypes,
  setMediaMap,
  setMediaTypes,
  onPreview,
  onSwapTag,
  onSelectionChange,
  lightMode,
}: TextAreaEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes("application/vodnik-media-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const mediaId = e.dataTransfer.getData("application/vodnik-media-id");
    if (!mediaId) return;
    // Wrap whatever is currently selected in the CM editor
    cmRef.current?.wrapSelection(mediaId);
  }

  const borderClass = isDragOver
    ? "border-[#6a6ec3] shadow-[0_0_0_2px_rgba(106,110,195,0.3)]"
    : isFocused
    ? "border-neutral-500"
    : "border-neutral-700";

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 p-4">
      {/* CodeMirror editor */}
      <div
        className={`relative flex-1 min-h-0 rounded-2xl border overflow-hidden transition-colors ${lightMode ? "bg-stone-50" : "bg-black"} ${borderClass}`}
      >
        <CodeMirrorEditor
          ref={cmRef}
          value={text}
          onChange={setText}
          mediaMap={mediaMap}
          mediaTypes={mediaTypes}
          onPreview={onPreview}
          onSwapTag={onSwapTag}
          setMediaMap={setMediaMap}
          setMediaTypes={setMediaTypes}
          placeholder="Write your story here..."
          onFocusChange={setIsFocused}
          onSelectionChange={onSelectionChange}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          isDragOver={isDragOver}
        />
      </div>

      {/* Additional instructions — unchanged */}
      <textarea
        className="w-full h-1/4 p-4 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-300 resize-none focus:outline-none focus:border-neutral-500"
        placeholder="Guide the story..."
        value={additionalInstructions}
        onChange={(e) => setAdditionalInstructions(e.target.value)}
      />
    </div>
  );
}
