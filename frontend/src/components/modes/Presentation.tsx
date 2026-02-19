import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { MediaMap, MediaTypes } from "../../types/generation";
import { getMediaType } from "../../utils/media";

type Segment = { mediaId: string | null; text: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const tagRegex = /<([^>\s/]+)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) segments.push({ mediaId: null, text: before });
    segments.push({ mediaId: match[1], text: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  const tail = text.slice(lastIndex).trim();
  if (tail) segments.push({ mediaId: null, text: tail });
  return segments;
}

const mdComponents = {
  p({ children }: { children?: React.ReactNode }) {
    return <p className="text-neutral-100 leading-relaxed mb-2 last:mb-0">{children}</p>;
  },
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="text-2xl font-bold text-white mb-3">{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="text-xl font-bold text-white mb-2">{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-lg font-semibold text-neutral-200 mb-2">{children}</h3>;
  },
  em({ children }: { children?: React.ReactNode }) {
    return <em className="italic text-neutral-300">{children}</em>;
  },
  strong({ children }: { children?: React.ReactNode }) {
    return <strong className="font-bold text-white">{children}</strong>;
  },
};

type PresentationProps = {
  text: string;
  mediaMap: MediaMap;
  mediaTypes: MediaTypes;
  title: string;
  setTitle: (title: string) => void;
};

export default function Presentation({ text, mediaMap, mediaTypes, title, setTitle }: PresentationProps) {
  const segments = parseSegments(text);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Eagerly preload image/video dimensions so orientation is always known synchronously,
  // with no intermediate null state that would cause a layout flash.
  const [mediaDims, setMediaDims] = useState<Record<string, { w: number; h: number }>>({});
  const loadingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const [id, url] of Object.entries(mediaMap)) {
      if (loadingRef.current.has(id)) continue;
      const type = getMediaType(id, mediaTypes);
      if (type !== 'image' && type !== 'video') continue;
      loadingRef.current.add(id);
      if (type === 'image') {
        const img = new Image();
        img.onload = () => {
          setMediaDims((prev) => ({ ...prev, [id]: { w: img.naturalWidth, h: img.naturalHeight } }));
        };
        img.src = url;
      } else {
        const vid = document.createElement('video');
        vid.onloadedmetadata = () => {
          setMediaDims((prev) => ({ ...prev, [id]: { w: vid.videoWidth, h: vid.videoHeight } }));
        };
        vid.src = url;
      }
    }
  }, [mediaMap, mediaTypes]);

  // Slide 0 is always the title card; story segments start at index 1.
  const total = segments.length + 1;
  const isTitleCard = currentIndex === 0;
  const currentSegment = isTitleCard
    ? { mediaId: null, text: '' }
    : (segments[currentIndex - 1] ?? { mediaId: null, text: '' });

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, total - 1)));
  }, [total]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      else if (e.key === 'ArrowRight') goTo(currentIndex + 1);
      else if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, goTo]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [text]);

  const mediaId = currentSegment.mediaId;
  const mediaUrl = mediaId ? mediaMap[mediaId] : null;
  const mediaType = mediaId ? getMediaType(mediaId, mediaTypes) : null;

  const dims = mediaId ? mediaDims[mediaId] : null;
  const mediaOrientation = dims ? (dims.h > dims.w ? 'portrait' : 'landscape') : null;
  const showOrientedLayout = (mediaType === 'image' || mediaType === 'video') && mediaOrientation !== null;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">

      {isTitleCard ? (
        // ── Title card ────────────────────────────────────────────────────────
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-black pb-16">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title..."
            className="bg-transparent text-5xl font-bold text-white text-center outline-none placeholder-neutral-600 w-full px-16"
          />
        </div>
      ) : showOrientedLayout ? (
        mediaOrientation === 'portrait' ? (
          // ── Portrait: media left, text right ──────────────────────────────
          <div className="absolute inset-0 flex pt-14 pb-16">
            <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-center bg-black">
              {mediaType === 'video' ? (
                <video
                  key={`vid-${currentIndex}`}
                  src={mediaUrl!}
                  loop
                  playsInline
                  onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img src={mediaUrl!} className="max-w-full max-h-full object-contain" alt="" />
              )}
            </div>
            {currentSegment.text && (
              <div className="w-[42%] shrink-0 overflow-y-auto bg-neutral-950 px-6 py-6 border-l border-white/10">
                <ReactMarkdown components={mdComponents}>{currentSegment.text}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          // ── Landscape: media top, text below ──────────────────────────────
          <div className="absolute inset-0 flex flex-col pt-14 pb-16">
            <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-black">
              {mediaType === 'video' ? (
                <video
                  key={`vid-${currentIndex}`}
                  src={mediaUrl!}
                  loop
                  playsInline
                  onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <img src={mediaUrl!} className="max-w-full max-h-full object-contain" alt="" />
              )}
            </div>
            {currentSegment.text && (
              <div className="h-[18%] shrink-0 overflow-y-auto bg-neutral-950 px-8 py-4 border-t border-white/10">
                <ReactMarkdown components={mdComponents}>{currentSegment.text}</ReactMarkdown>
              </div>
            )}
          </div>
        )
      ) : (
        // ── Non-image / loading: full-bleed background + text overlay ────────
        <>
          <div className="absolute inset-0">
            {mediaUrl && mediaType === 'image' && (
              <img src={mediaUrl} className="w-full h-full object-contain" alt="" />
            )}
            {mediaUrl && mediaType === 'video' && (
              <video
                key={`vid-${currentIndex}`}
                src={mediaUrl}
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                className="w-full h-full object-contain"
              />
            )}
            {(!mediaUrl || mediaType === 'audio') && (
              <div className="w-full h-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black" />
            )}
          </div>

          {mediaUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          )}

          {mediaUrl && mediaType === 'audio' && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
              <audio
                key={`aud-${currentIndex}`}
                src={mediaUrl}
                autoPlay
                loop
                controls
                className="w-80 rounded-lg"
              />
            </div>
          )}

          {currentSegment.text && (
            <div className={
              !mediaUrl
                ? "absolute inset-x-0 top-16 bottom-16 flex items-center justify-center z-10 px-8"
                : mediaType === 'audio'
                ? "absolute bottom-44 left-8 right-8 max-h-[25vh] overflow-y-auto bg-black/60 backdrop-blur-sm rounded-xl p-6 z-10"
                : "absolute bottom-20 left-8 right-8 max-h-[30vh] overflow-y-auto bg-black/60 backdrop-blur-sm rounded-xl p-6 z-10"
            }>
              <div className={!mediaUrl ? "w-1/2 h-full overflow-y-auto" : undefined}>
                <ReactMarkdown components={mdComponents}>{currentSegment.text}</ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}

      {/* Top bar: fullscreen toggle only */}
      <div className="absolute top-0 right-0 flex items-center px-6 py-4 z-20 pointer-events-none">
        <button
          onClick={toggleFullscreen}
          className="text-neutral-300 hover:text-white transition-colors pointer-events-auto"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            </svg>
          )}
        </button>
      </div>

      {/* Navigation bar */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-20">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="hacker-button disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="text-neutral-300 text-sm tabular-nums select-none">
          {total === 0 ? '—' : `${currentIndex + 1} / ${total}`}
        </span>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex >= total - 1}
          className="hacker-button disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
