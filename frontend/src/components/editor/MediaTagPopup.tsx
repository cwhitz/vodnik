import { useState } from "react";
import type { MediaMap, MediaTypes } from "../../types/generation";
import { getMediaType } from "../../utils/media";

type MediaTagPopupProps = {
  id: string;
  anchorRect: DOMRect;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  onPreview: (id: string) => void;
  onSwapTag: (oldId: string, newId: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export default function MediaTagPopup({
  id,
  anchorRect,
  mediaMap,
  mediaTypes,
  onPreview,
  onSwapTag,
  onRemove,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: MediaTagPopupProps) {
  const [showPicker, setShowPicker] = useState(false);

  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.left + anchorRect.width / 2,
    top: anchorRect.top - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
  };

  return (
    <div
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="bg-neutral-800 border border-neutral-600 rounded-lg shadow-2xl p-2 flex flex-col gap-1 min-w-[140px]"
    >
      {/* Caret */}
      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid rgb(82 82 91)",
        }}
      />

      <div className="text-[10px] text-neutral-500 font-mono px-1 pb-0.5 truncate max-w-[160px]">
        {getMediaType(id, mediaTypes) === "video"
          ? "▶"
          : getMediaType(id, mediaTypes) === "audio"
          ? "♪"
          : "▣"}{" "}
        {id}
      </div>

      <button
        onClick={() => { onPreview(id); onClose(); }}
        className="text-xs text-neutral-200 hover:bg-neutral-700 rounded px-2 py-1 text-left transition-colors"
      >
        Preview
      </button>

      {showPicker ? (
        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          <div className="text-[10px] text-neutral-500 px-1">Swap with:</div>
          {Object.keys(mediaMap)
            .filter((mid) => mid !== id)
            .map((mid) => (
              <button
                key={mid}
                onClick={() => { onSwapTag(id, mid); onClose(); }}
                className="text-xs text-neutral-300 hover:bg-neutral-700 rounded px-2 py-1 text-left font-mono transition-colors"
              >
                {mid}
              </button>
            ))}
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs text-neutral-200 hover:bg-neutral-700 rounded px-2 py-1 text-left transition-colors"
        >
          Swap…
        </button>
      )}

      <button
        onClick={() => { onRemove(id); onClose(); }}
        className="text-xs text-red-400 hover:bg-neutral-700 rounded px-2 py-1 text-left transition-colors"
      >
        Remove
      </button>
    </div>
  );
}
