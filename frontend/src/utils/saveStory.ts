import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { LoreItem, MediaMap } from "../types/generation";

// Generate zip blob without saving to file
export async function generateStoryZip(
  text: string,
  mediaMap: MediaMap,
  loreItems: LoreItem[],
  title?: string
): Promise<Blob> {
  const zip = new JSZip();

  zip.file("story.md", text);
  zip.file("lore.json", JSON.stringify(loreItems, null, 2));
  if (title !== undefined) {
    zip.file("title.txt", title);
  }

  for (const [id, url] of Object.entries(mediaMap)) {
    const response = await fetch(url);
    const blob = await response.blob();
    const ext = blob.type.split("/")[1] || "bin";
    zip.file(`media/${id}.${ext}`, blob);
  }

  return zip.generateAsync({ type: "blob" });
}

export async function saveStory(
  title: string,
  text: string,
  mediaMap: MediaMap,
  loreItems: LoreItem[]
) {
  const content = await generateStoryZip(text, mediaMap, loreItems, title);
  const safeTitle = sanitizeFilename(title);
  saveAs(content, `${safeTitle}.zip`);
}

export function sanitizeFilename(title: string): string {
  return (
    title
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-story"
  );
}
