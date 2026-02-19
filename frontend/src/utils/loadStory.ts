import JSZip from "jszip";
import type { LoreItem, MediaMap, MediaTypes } from "../types/generation";

const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'opus', 'wma']);

export async function loadStory(
  file: File,
  setText: (text: string) => void,
  setMediaMap: (mediaMap: MediaMap) => void,
  setLoreItems: (items: LoreItem[]) => void,
  setTitle?: (title: string) => void,
  setMediaTypes?: (types: MediaTypes) => void,
) {
  const zip = await JSZip.loadAsync(file);

  const markdownFile = zip.file("story.md");
  if (!markdownFile) return;

  const text = await markdownFile.async("string");
  setText(text);

  const loreFile = zip.file("lore.json");
  if (loreFile) {
    const loreText = await loreFile.async("string");
    const loreData = JSON.parse(loreText) as LoreItem[];
    setLoreItems(loreData);
  } else {
    setLoreItems([{ id: Date.now(), category: "character", text: "" }]);
  }

  if (setTitle) {
    const titleFile = zip.file("title.txt");
    if (titleFile) {
      const titleText = await titleFile.async("string");
      setTitle(titleText);
    } else {
      setTitle("");
    }
  }

  const newMediaMap: MediaMap = {};
  const newMediaTypes: MediaTypes = {};

  // Only process files whose paths start with "media/" — zip.files is a flat
  // global map so we must filter manually to exclude story.md, lore.json, etc.
  const mediaEntries = Object.values(zip.files).filter(
    (f) => !f.dir && f.name.startsWith("media/")
  );

  for (const f of mediaEntries) {
    const filename = f.name.split("/").pop() || "";
    const dotIdx = filename.lastIndexOf(".");
    const id = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;
    if (!id) continue;

    const blob = await f.async("blob");
    const url = URL.createObjectURL(blob);
    newMediaMap[id] = url;

    const ext = dotIdx > 0 ? filename.slice(dotIdx + 1).toLowerCase() : "";
    newMediaTypes[id] = VIDEO_EXTS.has(ext) ? "video" : AUDIO_EXTS.has(ext) ? "audio" : "image";
  }

  setMediaMap(newMediaMap);
  if (setMediaTypes) setMediaTypes(newMediaTypes);
}
