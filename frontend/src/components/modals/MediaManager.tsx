import type { MediaMap, MediaTypes } from "../../types/generation";
import { getMediaType } from "../../utils/media";

type MediaManagerProps = {
  isOpen: boolean;
  onClose: () => void;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function MediaManager({ isOpen, onClose, mediaMap, mediaTypes }: MediaManagerProps) {
  if (!isOpen) return null;

  const entries = Object.entries(mediaMap);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-xl w-2/3 max-h-[80vh] overflow-y-auto relative border border-neutral-700">
        <button
          className="absolute top-3 right-3 p-0 text-[#6a6ec3]/50 hover:text-[#6a6ec3] text-sm"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-neutral-200 text-2xl mb-2">Media Manager</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Wrap text in editor with <code className="bg-neutral-800 px-1 rounded text-neutral-300">&lt;media-id&gt;…&lt;/media-id&gt;</code> to link it to media in Read mode.
        </p>

        {entries.length === 0 ? (
          <p className="text-neutral-400 text-sm">
            No media uploaded yet. Use "Add Media" in the right panel or paste images/videos into the editor.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {entries.map(([id, url]) => {
              const type = getMediaType(id, mediaTypes);
              return (
                <div key={id} className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 flex flex-col gap-2">
                  <div className="h-32 rounded overflow-hidden bg-black flex items-center justify-center">
                    {type === 'video' ? (
                      <video src={url} className="w-full h-full object-cover" muted />
                    ) : type === 'audio' ? (
                      <span className="text-neutral-500 text-4xl select-none">♪</span>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 truncate font-mono" title={id}>{id}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(id)}
                      className="hacker-button flex-1 text-xs py-1"
                      title="Copy media ID"
                    >
                      Copy ID
                    </button>
                    <button
                      onClick={() => copyToClipboard(`<${id}>\n\n</${id}>`)}
                      className="hacker-button flex-1 text-xs py-1"
                      title="Copy tag snippet"
                    >
                      Copy tag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <button onClick={onClose} className="hacker-button w-full">Done</button>
        </div>
      </div>
    </div>
  );
}
