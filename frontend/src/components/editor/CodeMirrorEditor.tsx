import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { EditorState, Transaction } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import {
  defaultKeymap,
  historyKeymap,
  history,
} from "@codemirror/commands";
import {
  mediaTagExtension,
  mediaDataEffect,
  removeTagById,
} from "../../extensions/MediaTagExtension";
import type { MediaMap, MediaTypes } from "../../types/generation";
import MediaTagPopup from "./MediaTagPopup";

// Each selector must be a separate key — CM6 only scopes the first part of a
// comma-separated string, so split them to ensure both get the scope prefix.
const vodnikTheme = EditorView.theme({
  ".cm-cursor": { borderLeft: "1.5px solid white" },
  ".cm-cursor-primary": { borderLeft: "1.5px solid white" },
});

// ---------------------------------------------------------------------------
// Public handle exposed via ref
// ---------------------------------------------------------------------------

export type CodeMirrorEditorHandle = {
  wrapSelection: (id: string) => void;
  getSelectionOffsets: () => { start: number; end: number };
  getSelectedText: () => string;
  focus: () => void;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CodeMirrorEditorProps = {
  value: string;
  onChange: (value: string) => void;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  onPreview: (id: string) => void;
  onSwapTag: (oldId: string, newId: string) => void;
  setMediaMap: (updater: (prev: MediaMap) => MediaMap) => void;
  setMediaTypes: (updater: (prev: MediaTypes) => MediaTypes) => void;
  placeholder?: string;
  onFocusChange?: (focused: boolean) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragOver?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CodeMirrorEditor = forwardRef<
  CodeMirrorEditorHandle,
  CodeMirrorEditorProps
>(function CodeMirrorEditor(props, ref) {
  const {
    value,
    onChange,
    mediaMap,
    mediaTypes,
    onPreview,
    onSwapTag,
    setMediaMap,
    setMediaTypes,
    placeholder,
    onFocusChange,
    onSelectionChange,
    onDragOver,
    onDragLeave,
    onDrop,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Popup state for media tag hover
  const [popupState, setPopupState] = useState<{
    id: string;
    anchorRect: DOMRect;
  } | null>(null);
  const popupCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so extensions don't capture stale closures
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const setMediaMapRef = useRef(setMediaMap);
  setMediaMapRef.current = setMediaMap;
  const setMediaTypesRef = useRef(setMediaTypes);
  setMediaTypesRef.current = setMediaTypes;
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const hasSelectionRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Create the EditorView once
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          drawSelection(),
          cmPlaceholder(placeholder ?? "Write your story here…"),
          vodnikTheme,
          mediaTagExtension(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const isRemote = update.transactions.some((tr) =>
                tr.annotation(Transaction.remote)
              );
              if (!isRemote) {
                onChangeRef.current(update.state.doc.toString());
              }
            }
            if (update.selectionSet) {
              const nowHasSelection = !update.state.selection.main.empty;
              if (nowHasSelection !== hasSelectionRef.current) {
                hasSelectionRef.current = nowHasSelection;
                onSelectionChangeRef.current?.(nowHasSelection);
              }
            }
          }),
          EditorView.domEventHandlers({
            focus: () => onFocusChangeRef.current?.(true),
            blur: () => onFocusChangeRef.current?.(false),
            paste(event, view) {
              const items = event.clipboardData?.items ?? [];
              let handled = false;
              for (const item of Array.from(items)) {
                if (
                  item.type.startsWith("image/") ||
                  item.type.startsWith("video/") ||
                  item.type.startsWith("audio/")
                ) {
                  const file = item.getAsFile();
                  if (!file) continue;
                  handled = true;
                  const mediaType: "image" | "video" | "audio" =
                    item.type.startsWith("video/")
                      ? "video"
                      : item.type.startsWith("audio/")
                      ? "audio"
                      : "image";
                  const prefix =
                    mediaType === "video"
                      ? "vid"
                      : mediaType === "audio"
                      ? "aud"
                      : "img";
                  const id = `${prefix}-${Date.now()}`;
                  // Insert the tag immediately so the editor updates right away
                  const { from, to } = view.state.selection.main;
                  const selected = view.state.sliceDoc(from, to);
                  const tag = selected
                    ? `<${id}>\n${selected}\n</${id}>`
                    : `<${id}>\n\n</${id}>`;
                  view.dispatch({ changes: { from, to, insert: tag } });
                  // Register the type immediately, then load the data URL async
                  setMediaTypesRef.current((prev) => ({
                    ...prev,
                    [id]: mediaType,
                  }));
                  const reader = new FileReader();
                  reader.onload = () => {
                    setMediaMapRef.current((prev) => ({
                      ...prev,
                      [id]: reader.result as string,
                    }));
                  };
                  reader.readAsDataURL(file);
                }
              }
              return handled;
            },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once

  // ---------------------------------------------------------------------------
  // Sync external value changes into CM
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: Transaction.remote.of(true),
    });
  }, [value]);

  // ---------------------------------------------------------------------------
  // Sync mediaMap / mediaTypes into CM state field
  // ---------------------------------------------------------------------------

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: mediaDataEffect.of({ mediaMap, mediaTypes }),
    });
  }, [mediaMap, mediaTypes]);

  // ---------------------------------------------------------------------------
  // Expose handle methods
  // ---------------------------------------------------------------------------

  useImperativeHandle(ref, () => ({
    wrapSelection(id: string) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const wrapped = selected
        ? `<${id}>\n${selected}\n</${id}>`
        : `<${id}>\n\n</${id}>`;
      view.dispatch({
        changes: { from, to, insert: wrapped },
        selection: EditorSelection.cursor(from + wrapped.length),
      });
      view.focus();
    },

    getSelectionOffsets() {
      const view = viewRef.current;
      if (!view) return { start: 0, end: 0 };
      const { from, to } = view.state.selection.main;
      return { start: from, end: to };
    },

    getSelectedText() {
      const view = viewRef.current;
      if (!view) return "";
      const { from, to } = view.state.selection.main;
      return view.state.sliceDoc(from, to);
    },

    focus() {
      viewRef.current?.focus();
    },
  }));

  // ---------------------------------------------------------------------------
  // Hover detection
  // ---------------------------------------------------------------------------

  function schedulePopupClose() {
    if (popupCloseTimer.current) clearTimeout(popupCloseTimer.current);
    popupCloseTimer.current = setTimeout(() => setPopupState(null), 150);
  }

  function cancelPopupClose() {
    if (popupCloseTimer.current) clearTimeout(popupCloseTimer.current);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as Element).closest("[data-media-id]");
    if (target) {
      cancelPopupClose();
      const id = (target as HTMLElement).dataset.mediaId!;
      const rect = target.getBoundingClientRect();
      setPopupState((prev) =>
        prev?.id === id ? prev : { id, anchorRect: rect }
      );
    } else {
      schedulePopupClose();
    }
  }

  // ---------------------------------------------------------------------------
  // Popup action handlers
  // ---------------------------------------------------------------------------

  function handleRemove(id: string) {
    const view = viewRef.current;
    if (!view) return;
    removeTagById(view, id);
    setPopupState(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div
        ref={containerRef}
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={schedulePopupClose}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />

      {popupState &&
        createPortal(
          <MediaTagPopup
            id={popupState.id}
            anchorRect={popupState.anchorRect}
            mediaMap={mediaMap}
            mediaTypes={mediaTypes}
            onPreview={onPreview}
            onSwapTag={onSwapTag}
            onRemove={handleRemove}
            onClose={() => setPopupState(null)}
            onMouseEnter={cancelPopupClose}
            onMouseLeave={schedulePopupClose}
          />,
          document.body
        )}
    </>
  );
});

export default CodeMirrorEditor;
