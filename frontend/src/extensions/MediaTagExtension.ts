import {
  StateEffect,
  StateField,
  type EditorState,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { MediaMap, MediaTypes } from "../types/generation";

// ---------------------------------------------------------------------------
// Media data — passed from React into the CM state machine
// ---------------------------------------------------------------------------

export type MediaData = { mediaMap: MediaMap; mediaTypes: MediaTypes };

export const mediaDataEffect = StateEffect.define<MediaData>();

export const mediaDataField = StateField.define<MediaData>({
  create: () => ({ mediaMap: {}, mediaTypes: {} }),
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(mediaDataEffect)) return effect.value;
    }
    return value;
  },
});

// ---------------------------------------------------------------------------
// Widget types — rendered in place of the raw tag text
// ---------------------------------------------------------------------------

function mediaTypeIcon(
  id: string,
  mediaTypes: MediaTypes
): string {
  const t =
    mediaTypes[id] ??
    (id.startsWith("vid-") ? "video" : id.startsWith("aud-") ? "audio" : "image");
  return t === "video" ? "▶" : t === "audio" ? "♪" : "▣";
}

class OpenTagWidget extends WidgetType {
  id: string;
  mediaTypes: MediaTypes;

  constructor(id: string, mediaTypes: MediaTypes) {
    super();
    this.id = id;
    this.mediaTypes = mediaTypes;
  }

  eq(other: OpenTagWidget) {
    return other.id === this.id;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-media-tag-badge cm-media-tag-open";
    span.dataset.mediaId = this.id;
    span.textContent = `${mediaTypeIcon(this.id, this.mediaTypes)} ${this.id}`;
    span.setAttribute("aria-label", `Media: ${this.id}`);
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

class CloseTagWidget extends WidgetType {
  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  eq(other: CloseTagWidget) {
    return other.id === this.id;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-media-tag-badge cm-media-tag-close";
    span.dataset.mediaId = this.id;
    span.textContent = `∕${this.id}`;
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Decoration builder
// ---------------------------------------------------------------------------

const TAG_REGEX = /<([^>\s/]+)>([\s\S]*?)<\/\1>/g;

function buildDecorations(state: EditorState): DecorationSet {
  const doc = state.doc.toString();
  const { mediaTypes } = state.field(mediaDataField);

  type RangedDeco = { from: number; to: number; deco: Decoration };
  const items: RangedDeco[] = [];

  TAG_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(doc)) !== null) {
    const id = match[1];
    const fullStart = match.index;
    const fullEnd = fullStart + match[0].length;

    const openTagLen = id.length + 2; // <id>
    const openTagEnd = fullStart + openTagLen;

    const closeTagLen = id.length + 3; // </id>
    const closeTagStart = fullEnd - closeTagLen;

    // Safety: skip degenerate matches
    if (openTagEnd > closeTagStart) continue;

    // Replace <id> with open badge
    items.push({
      from: fullStart,
      to: openTagEnd,
      deco: Decoration.replace({
        widget: new OpenTagWidget(id, mediaTypes),
        inclusive: false,
      }),
    });

    // Mark content
    if (openTagEnd < closeTagStart) {
      items.push({
        from: openTagEnd,
        to: closeTagStart,
        deco: Decoration.mark({
          class: "cm-media-content",
          attributes: { "data-media-id": id },
        }),
      });
    }

    // Replace </id> with close badge
    items.push({
      from: closeTagStart,
      to: fullEnd,
      deco: Decoration.replace({
        widget: new CloseTagWidget(id),
        inclusive: false,
      }),
    });
  }

  // CM requires decorations sorted by from, then by startSide
  items.sort((a, b) => a.from - b.from || a.deco.startSide - b.deco.startSide);

  return Decoration.set(items.map((i) => i.deco.range(i.from, i.to)));
}

// ---------------------------------------------------------------------------
// ViewPlugin
// ---------------------------------------------------------------------------

const mediaTagPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view.state);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.startState.field(mediaDataField) !==
          update.state.field(mediaDataField)
      ) {
        this.decorations = buildDecorations(update.state);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

// ---------------------------------------------------------------------------
// Helper: find media id at a document position
// ---------------------------------------------------------------------------

export function getMediaIdAtPos(
  state: EditorState,
  pos: number
): string | null {
  const doc = state.doc.toString();
  TAG_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(doc)) !== null) {
    const id = match[1];
    const fullStart = match.index;
    const fullEnd = fullStart + match[0].length;
    const openTagEnd = fullStart + id.length + 2;
    const closeTagStart = fullEnd - (id.length + 3);

    if (pos >= openTagEnd && pos <= closeTagStart) return id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Remove a tag by id (keeps content, strips delimiters)
// ---------------------------------------------------------------------------

export function removeTagById(view: EditorView, id: string) {
  const doc = view.state.doc.toString();
  const regex = new RegExp(
    `<${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>([\\s\\S]*?)<\\/${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>`,
    "g"
  );
  const changes: { from: number; to: number; insert: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(doc)) !== null) {
    changes.push({ from: m.index, to: m.index + m[0].length, insert: m[1] });
  }
  if (changes.length > 0) view.dispatch({ changes });
}

// ---------------------------------------------------------------------------
// Exported extension array
// ---------------------------------------------------------------------------

export function mediaTagExtension() {
  return [mediaDataField, mediaTagPlugin];
}
