import type { ChangeEvent } from "react";
import type { Mode } from "../../types/generation";

type LeftPanelProps = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  onNewStory: () => void;
  saveStory: () => void;
  onLoadStory: (file: File) => void;
  setSettingsOpen: (open: boolean) => void;
  setReadmeOpen: (open: boolean) => void;
  onSaveToDrive: () => void;
  onLoadFromDrive: () => void;
  isDriveLoading: boolean;
  lightMode: boolean;
  onToggleLightMode: () => void;
};

export default function LeftPanel({
  mode,
  setMode,
  onNewStory,
  saveStory,
  onLoadStory,
  setSettingsOpen,
  setReadmeOpen,
  onSaveToDrive,
  onLoadFromDrive,
  isDriveLoading,
  lightMode,
  onToggleLightMode,
}: LeftPanelProps) {
  const handleLoadStory = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadStory(e.target.files[0]);
    }
  };

  const activeBtn = lightMode
    ? "!bg-[#6ab87a] !text-[#14532d] shadow-lg"
    : "!bg-[#6a6ec3] !text-black shadow-lg";
  const inactiveBtn = lightMode
    ? "!bg-white !text-[#16a34a] hover:!bg-green-50"
    : "!bg-black !text-[#6a6ec3] hover:!bg-neutral-900";

  return (
    <div className={`fixed left-6 top-6 z-40 flex flex-col gap-4 p-6 backdrop-blur border rounded-xl shadow-2xl w-56 ${
      lightMode
        ? "bg-white/95 border-gray-200"
        : "bg-neutral-900/90 border-neutral-700"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <img src="/logo.png" alt="Vodnik" className="h-8" />
      </div>

      <div className={`flex gap-2 p-1 rounded-lg ${lightMode ? "bg-green-50" : "bg-neutral-800"}`}>
        <button
          onClick={() => setMode("write")}
          className={`flex-1 py-2 px-3 rounded transition-all text-sm font-medium ${
            mode === "write" ? activeBtn : inactiveBtn
          }`}
        >
          Write
        </button>
        <button
          onClick={() => setMode("read")}
          className={`flex-1 py-2 px-3 rounded transition-all text-sm font-medium ${
            mode === "read" ? activeBtn : inactiveBtn
          }`}
        >
          Read
        </button>
      </div>

      <div className="h-px bg-neutral-700"></div>

      <button
        onClick={onNewStory}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800"
      >
        New Story
      </button>

      <button
        onClick={saveStory}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800"
      >
        Save Story
      </button>

      <label className="hacker-button w-full text-center py-2 hover:bg-neutral-800 cursor-pointer block">
        Load Story
        <input
          type="file"
          accept=".zip"
          onChange={handleLoadStory}
          className="hidden"
        />
      </label>

      <div className="h-px bg-neutral-700"></div>

      <button
        onClick={onSaveToDrive}
        disabled={isDriveLoading}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800 disabled:opacity-50"
      >
        {isDriveLoading ? "Saving..." : "Save to Drive"}
      </button>

      <button
        onClick={onLoadFromDrive}
        disabled={isDriveLoading}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800 disabled:opacity-50"
      >
        Load from Drive
      </button>

      <div className="h-px bg-neutral-700"></div>

      <button
        onClick={() => setSettingsOpen(true)}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800"
      >
        Settings
      </button>

      <button
        onClick={() => setReadmeOpen(true)}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800"
      >
        Help
      </button>

      <div className="h-px bg-neutral-700"></div>

      <button
        onClick={onToggleLightMode}
        className="hacker-button w-full text-center py-2 hover:bg-neutral-800 text-xs"
      >
        {lightMode ? "Dark Mode" : "Light Mode"}
      </button>
    </div>
  );
}
