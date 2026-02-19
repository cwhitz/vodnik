import type { MediaTypes } from "../types/generation";

export function getMediaType(
  id: string,
  mediaTypes: MediaTypes
): "image" | "video" | "audio" {
  return (
    mediaTypes[id] ??
    (id.startsWith("vid-") ? "video" : id.startsWith("aud-") ? "audio" : "image")
  );
}
