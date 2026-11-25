import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  ChevronLeft, ChevronRight, Download, File, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo,
  LucideIcon, RotateCw, X, ZoomIn, ZoomOut,
} from 'lucide-react';
import { convertGoogleStorageUrl } from '../../utils/methods';
import './FileViewer.scss';

// The same viewer as the admin panel: it reads each file's type (saved at upload, or the name's
// extension) and shows images, PDFs, video and audio in place; anything else gets a file card to
// open or download, never a broken image.
export type Kind = 'image' | 'pdf' | 'video' | 'audio' | 'sheet' | 'doc' | 'other';

const EXT: Record<string, Kind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image', svg: 'image', avif: 'image', heic: 'image',
  pdf: 'pdf', mp4: 'video', webm: 'video', mov: 'video', m4v: 'video', mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet', doc: 'doc', docx: 'doc', txt: 'doc',
};
export const KIND_ICONS: Record<Kind, LucideIcon> = {
  image: FileImage, pdf: FileText, video: FileVideo, audio: FileAudio, sheet: FileSpreadsheet, doc: FileText, other: File,
};
const KIND_LABEL: Record<Kind, string> = {
  image: 'صورة', pdf: 'ملف PDF', video: 'فيديو', audio: 'ملف صوتي', sheet: 'جدول بيانات', doc: 'مستند', other: 'ملف',
};

export type ViewerFile = { url: string; name: string; kind: Kind; ext: string; size: string };

const extOf = (value = '') => (value.split('?')[0].split('#')[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

function kindOf(type = '', ext = ''): Kind {
  const t = type.toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t === 'application/pdf') return 'pdf';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (/sheet|excel|csv/.test(t)) return 'sheet';
  if (/word|text\/plain/.test(t)) return 'doc';
  return EXT[ext] || 'other';
}

function sizeOf(bytes: any) {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// Accepts a URL or a stored file ({ path, filename, fileType, ... })
export function toViewerFile(file: any): ViewerFile {
  const raw = typeof file === 'string' ? { path: file } : file || {};
  const url = convertGoogleStorageUrl(raw.path || raw.url || '');
  const name = raw.filename || raw.name || decodeURIComponent(url.split('?')[0].split('/').pop() || 'ملف');
  const ext = extOf(name) || extOf(url);
  return { url, name, ext, kind: kindOf(raw.fileType || raw.mimetype || raw.type, ext), size: sizeOf(raw.bytes || raw.size) };
}

const save = (href: string, name?: string) => {
  const a = Object.assign(document.createElement('a'), { href, rel: 'noopener', ...(name && { download: name }) });
  document.body.appendChild(a); a.click(); a.remove();
};

// The admin panel asks the server for a signed "attachment" link; that endpoint is for staff only, so
// here the file is read directly when the storage allows it, and otherwise opened in a new tab.
async function download(file: ViewerFile) {
  try {
    const blob = await (await fetch(file.url)).blob();
    const href = URL.createObjectURL(blob);
    save(href, file.name);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    window.open(file.url, '_blank', 'noopener');
  }
}

function FileCard({ file, note }: { file: ViewerFile; note?: string }) {
  const Icon = KIND_ICONS[file.kind];
  return (
    <div className="fv-card">
      <span className={`fv-card__icon is-${file.kind}`}><Icon size={34} /></span>
      <div className="fv-card__name" dir="auto">{file.name}</div>
      <div className="fv-card__meta">{[file.ext.toUpperCase() || KIND_LABEL[file.kind], file.size].filter(Boolean).join(' · ')}</div>
      {note && <div className="fv-card__note">{note}</div>}
      <div className="fv-card__actions">
        <button type="button" className="fv-btn fv-btn--primary" onClick={() => download(file)}><Download size={16} /> تحميل</button>
      </div>
    </div>
  );
}

// An image is shown whole by default ("fit"); "width" fills the width and scrolls down for the rest.
// On a phone the fingers do the rest: pinch or double-tap to zoom, drag to pan, swipe to the next
// file, pull down to close.
type ImageView = { mode: 'fit' | 'width'; turn: number };
type Zoom = { s: number; x: number; y: number };
const NO_ZOOM: Zoom = { s: 1, x: 0, y: 0 };
const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;

type Point = { x: number; y: number };
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Keeps a zoomed image from being dragged away from the stage
const clampPan = (z: Zoom, rect: DOMRect): Zoom => {
  const s = Math.min(MAX_ZOOM, Math.max(1, z.s));
  const mx = (rect.width * (s - 1)) / 2;
  const my = (rect.height * (s - 1)) / 2;
  return { s, x: Math.min(mx, Math.max(-mx, z.x)), y: Math.min(my, Math.max(-my, z.y)) };
};

// Asks the browser to fetch this one before anything else on the page (React 18 has no typed prop for it)
const FIRST = { fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>;
const LAST = { fetchpriority: 'low' } as React.ImgHTMLAttributes<HTMLImageElement>;

function Stage({ file, view, zoom, onToggle, onSettled }: { file: ViewerFile; view: ImageView; zoom: Zoom; onToggle: () => void; onSettled: (url: string) => void }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ratio, setRatio] = useState(1);
  useEffect(() => { setState('loading'); setRatio(1); }, [file.url]);
  // Only an image keeps the others waiting; anything else lets them load at once
  useEffect(() => { if (file.kind !== 'image' || !file.url || state !== 'loading') onSettled(file.url); }, [file.kind, file.url, state, onSettled]);

  if (!file.url) return <FileCard file={file} note="لا يوجد رابط لهذا الملف." />;
  if (file.kind === 'image') {
    if (state === 'error') return <FileCard file={file} note="تعذّر عرض الصورة هنا. حمّلها لمشاهدتها." />;
    const sideways = view.turn % 180 !== 0;
    const style = {
      '--fv-turn': `${view.turn}deg`, '--fv-r': ratio, '--fv-vr': sideways ? 1 / ratio : ratio,
      '--fv-s': zoom.s, '--fv-x': `${zoom.x}px`, '--fv-y': `${zoom.y}px`,
    } as React.CSSProperties;
    return (
      <div className={`fv-image is-${view.mode} ${sideways ? 'is-sideways' : ''} ${zoom.s > 1 ? 'is-zoomed' : ''}`} onClick={() => state === 'ready' && onToggle()}
        title={view.mode === 'fit' ? 'انقر لملء العرض والنزول بالتمرير' : 'انقر لعرض الصورة كاملة'}>
        {state === 'loading' && <div className="fv-skeleton" />}
        {/* The box takes the shape the image has on screen (turned or not), so the page scrolls over all of it */}
        <div className="fv-box" style={style}>
          <img src={file.url} alt={file.name} className={state === 'ready' ? 'is-ready' : ''} draggable={false} decoding="async" {...FIRST}
            onLoad={(e) => { const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight); setState('ready'); }}
            onError={() => setState('error')} />
        </div>
      </div>
    );
  }
  if (file.kind === 'pdf') {
    return (
      <div className="fv-frame">
        {state === 'loading' && <div className="fv-skeleton fv-skeleton--page" />}
        <iframe title={file.name} src={`${file.url}#view=FitH`} onLoad={() => setState('ready')} className={state === 'ready' ? 'is-ready' : ''} />
      </div>
    );
  }
  if (file.kind === 'video') {
    if (state === 'error') return <FileCard file={file} note="المتصفح لا يعرض هذا الفيديو. حمّله لمشاهدته." />;
    return <video className="fv-media" src={file.url} controls playsInline onError={() => setState('error')} />;
  }
  if (file.kind === 'audio') {
    return <div className="fv-audio"><FileCard file={file} /><audio src={file.url} controls /></div>;
  }
  return <FileCard file={file} note="لا يمكن معاينة هذا النوع هنا. حمّله لمشاهدته." />;
}

type Props = { open: boolean; files?: any[]; onClose: () => void; startIndex?: number; title?: string };

// What a finger gesture has done so far; a ref, so finger moves don't re-render until something changes
type Gesture = {
  pointers: Map<number, Point>
  start: Point & { t: number }
  axis: '' | 'x' | 'y' | 'pan'
  zoom0: Zoom
  pinch: { d: number; mid: Point; zoom: Zoom } | null
  lastTap: (Point & { t: number }) | null
};

export default function FileViewer({ open, files, onClose, startIndex = 0 }: Props) {
  const items = useMemo(() => (files || []).filter(Boolean).map(toViewerFile), [files]);
  const [index, setIndex] = useState(startIndex);
  useEffect(() => { if (open) setIndex(Math.min(startIndex, Math.max(items.length - 1, 0))); }, [open, startIndex, items.length]);
  const phone = useMediaQuery('(max-width: 640px)');
  const touch = useMediaQuery('(pointer: coarse)');

  const count = items.length;
  // Which side the new slide comes in from: in Arabic the next file is to the left
  const [enter, setEnter] = useState<'' | 'next' | 'prev'>('');
  const go = useCallback((step: number) => {
    setEnter(step > 0 ? 'next' : 'prev');
    setIndex(i => (count ? (i + step + count) % count : 0));
  }, [count]);
  const pick = (i: number) => { setEnter(i > index ? 'next' : 'prev'); setIndex(i); };

  // Arrows follow the reading direction: in Arabic the next file is to the left
  useEffect(() => {
    if (!open || count < 2) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, count, go]);

  const file = items[index];
  const [view, setView] = useState<ImageView>({ mode: 'fit', turn: 0 });
  const [zoom, setZoomState] = useState<Zoom>(NO_ZOOM);
  const zoomRef = useRef<Zoom>(NO_ZOOM);
  const setZoom = (z: Zoom) => { zoomRef.current = z; setZoomState(z); };
  useEffect(() => { setView({ mode: 'fit', turn: 0 }); setZoom(NO_ZOOM); }, [file?.url]);
  const toggleView = () => setView(v => ({ ...v, mode: v.mode === 'fit' ? 'width' : 'fit' }));
  const BadgeIcon = file ? KIND_ICONS[file.kind] : File;

  // The photos are stored at full camera size, so the one on screen loads alone first: the strip
  // below and the neighbours used to load with it and share the phone's connection with it.
  // Once it has arrived (or after a few seconds anyway) the rest follow, and the strip stays.
  const [settledUrl, setSettledUrl] = useState('');
  const settled = !!file && settledUrl === file.url;
  const [stripOn, setStripOn] = useState(false);
  const onSettled = useCallback((url: string) => setSettledUrl(url), []);
  useEffect(() => { if (!open) setStripOn(false); }, [open]);
  useEffect(() => {
    if (!open || stripOn) return undefined;
    if (settled) { setStripOn(true); return undefined; }
    const t = window.setTimeout(() => setStripOn(true), 3000);
    return () => window.clearTimeout(t);
  }, [open, settled, stripOn]);

  // The neighbours load ahead, so a swipe lands on a ready image
  useEffect(() => {
    if (!open || count < 2 || !settled) return;
    [index + 1, index - 1].forEach((i) => {
      const f = items[(i + count) % count];
      if (f?.kind === 'image' && f.url) new Image().src = f.url;
    });
  }, [open, index, count, items, settled]);

  // The current thumbnail stays in view as the files change
  const stripRef = useRef<HTMLElement>(null);
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  /* Finger gestures on an image shown whole. A mouse keeps click-to-fill and the arrows. */
  const stageRef = useRef<HTMLElement>(null);
  const lastPointer = useRef('mouse');
  const g = useRef<Gesture>({ pointers: new Map(), start: { x: 0, y: 0, t: 0 }, axis: '', zoom0: NO_ZOOM, pinch: null, lastTap: null });
  const [drag, setDrag] = useState<Point | null>(null);
  const [gesturing, setGesturing] = useState(false);
  const gestures = file?.kind === 'image' && view.mode === 'fit';

  const centre = () => {
    const rect = stageRef.current!.getBoundingClientRect();
    return { rect, c: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } };
  };

  // Zoom in on a point (the middle when none), or back out
  const zoomAt = (p: Point | null) => {
    if (zoomRef.current.s > 1) { setZoom(NO_ZOOM); return; }
    const { rect, c } = centre();
    const at = p || c;
    setZoom(clampPan({ s: TAP_ZOOM, x: (c.x - at.x) * (TAP_ZOOM - 1), y: (c.y - at.y) * (TAP_ZOOM - 1) }, rect));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    lastPointer.current = e.pointerType;
    if (!gestures || e.pointerType === 'mouse' || (e.target as Element).closest('button')) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    const st = g.current;
    const p = { x: e.clientX, y: e.clientY };
    st.pointers.set(e.pointerId, p);
    if (st.pointers.size === 1) {
      st.start = { ...p, t: Date.now() }; st.axis = ''; st.zoom0 = zoomRef.current;
    } else if (st.pointers.size === 2) {
      const [a, b] = Array.from(st.pointers.values());
      st.pinch = { d: dist(a, b) || 1, mid: mid(a, b), zoom: zoomRef.current };
      setDrag(null);
    }
    setGesturing(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = g.current;
    if (!st.pointers.has(e.pointerId)) return;
    const p = { x: e.clientX, y: e.clientY };
    st.pointers.set(e.pointerId, p);
    const { rect, c } = centre();

    // Two fingers: zoom around the point between them, and follow them as they move
    if (st.pinch && st.pointers.size >= 2) {
      const [a, b] = Array.from(st.pointers.values());
      const z0 = st.pinch.zoom;
      const s = Math.min(MAX_ZOOM, Math.max(1, (z0.s * dist(a, b)) / st.pinch.d));
      const m = mid(a, b);
      const q = { x: (st.pinch.mid.x - c.x - z0.x) / z0.s, y: (st.pinch.mid.y - c.y - z0.y) / z0.s };
      setZoom(clampPan({ s, x: m.x - c.x - q.x * s, y: m.y - c.y - q.y * s }, rect));
      return;
    }

    const dx = p.x - st.start.x;
    const dy = p.y - st.start.y;
    // Zoomed in: one finger moves around the image
    if (zoomRef.current.s > 1 || st.axis === 'pan') {
      st.axis = 'pan';
      setZoom(clampPan({ ...zoomRef.current, x: st.zoom0.x + dx, y: st.zoom0.y + dy }, rect));
      return;
    }
    if (!st.axis && Math.hypot(dx, dy) > 8) st.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (st.axis === 'x' && count > 1) setDrag({ x: dx, y: 0 });
    if (st.axis === 'y') setDrag({ x: 0, y: Math.max(0, dy) });
  };

  const endGesture = (e: React.PointerEvent, cancelled = false) => {
    const st = g.current;
    const p = st.pointers.get(e.pointerId);
    if (!p) return;
    st.pointers.delete(e.pointerId);

    if (st.pinch) {
      if (st.pointers.size < 2) st.pinch = null;
      // One finger still down after a pinch: it pans, it never swipes
      if (st.pointers.size === 1) {
        const [rest] = Array.from(st.pointers.values());
        st.start = { ...rest, t: Date.now() }; st.zoom0 = zoomRef.current; st.axis = 'pan';
      }
      if (zoomRef.current.s < 1.05) setZoom(NO_ZOOM);
      if (!st.pointers.size) setGesturing(false);
      return;
    }
    if (st.pointers.size) return;

    const dx = p.x - st.start.x;
    const dy = p.y - st.start.y;
    const dt = Math.max(1, Date.now() - st.start.t);
    setDrag(null);
    setGesturing(false);
    if (cancelled) return;

    if (st.axis === 'x' && count > 1 && (Math.abs(dx) > 70 || Math.abs(dx) / dt > 0.45)) go(dx > 0 ? 1 : -1);
    else if (st.axis === 'y' && (dy > 120 || (dy > 40 && dy / dt > 0.5))) onClose();
    else if (!st.axis && dt < 300) {
      // Two quick taps in the same place zoom in there, or back out
      const now = Date.now();
      if (st.lastTap && now - st.lastTap.t < 320 && dist(st.lastTap, p) < 30) { zoomAt(p); st.lastTap = null; }
      else st.lastTap = { ...p, t: now };
    }
  };

  const zoomed = zoom.s > 1;
  const slideStyle = drag ? {
    transform: `translate(${drag.x}px, ${drag.y}px)${drag.y ? ` scale(${Math.max(0.85, 1 - drag.y / 1200)})` : ''}`,
    opacity: drag.y ? Math.max(0.35, 1 - drag.y / 450) : undefined,
  } : undefined;

  return (
    <Dialog open={open && !!count} onClose={onClose} maxWidth="lg" fullWidth fullScreen={phone} PaperProps={{ className: 'fv' }}>
      {file && (
        <div className="fv__shell" dir="rtl">
          <header className="fv__bar">
            <div className="fv__title">
              <span className={`fv__badge is-${file.kind}`}><BadgeIcon size={18} /></span>
              <div className="fv__names">
                <div className="fv__name" dir="auto" title={file.name}>{file.name}</div>
                <div className="fv__sub">
                  {KIND_LABEL[file.kind]}
                  {count > 1 && <span className="fv__sub-count"> <bdi>{index + 1}</bdi> من <bdi>{count}</bdi></span>}
                  {file.size && <> · <bdi>{file.size}</bdi></>}
                </div>
              </div>
            </div>
            <div className="fv__tools">
              {count > 1 && <bdi className="fv__count">{index + 1} / {count}</bdi>}
              {file.kind === 'image' && <>
                {touch ? (
                  <button type="button" className="fv__icon" onClick={() => zoomAt(null)} aria-label={zoomed ? 'تصغير' : 'تكبير'} title={zoomed ? 'تصغير' : 'تكبير'}>
                    {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                  </button>
                ) : (
                  <button type="button" className="fv__icon" onClick={toggleView} title={view.mode === 'fit' ? 'ملء العرض (النزول بالتمرير)' : 'عرض الصورة كاملة'} aria-label={view.mode === 'fit' ? 'ملء العرض' : 'عرض الصورة كاملة'}>
                    {view.mode === 'fit' ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
                  </button>
                )}
                <button type="button" className="fv__icon" onClick={() => { setZoom(NO_ZOOM); setView(v => ({ ...v, turn: (v.turn + 90) % 360 })); }} title="تدوير" aria-label="تدوير">
                  <RotateCw size={20} />
                </button>
              </>}
              <button type="button" className="fv__icon" onClick={() => download(file)} title="تحميل" aria-label="تحميل"><Download size={20} /></button>
              <button type="button" className="fv__icon fv__close" onClick={onClose} title="إغلاق" aria-label="إغلاق"><X size={22} /></button>
            </div>
          </header>

          <main
            ref={stageRef}
            className={`fv__stage ${gestures ? 'has-gestures' : ''} ${gesturing ? 'is-gesturing' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endGesture(e)}
            onPointerCancel={(e) => endGesture(e, true)}
          >
            <div className={`fv__slide ${enter ? `is-from-${enter}` : ''}`} key={`${index}:${file.url}`} style={slideStyle}>
              <Stage file={file} view={view} zoom={zoom} onToggle={() => lastPointer.current === 'mouse' && toggleView()} onSettled={onSettled} />
            </div>
            {count > 1 && !zoomed && <>
              <button type="button" className="fv__nav fv__nav--prev" aria-label="السابق" onClick={() => go(-1)}><ChevronRight size={24} /></button>
              <button type="button" className="fv__nav fv__nav--next" aria-label="التالي" onClick={() => go(1)}><ChevronLeft size={24} /></button>
            </>}
          </main>

          {count > 1 && (
            <nav className="fv__strip" aria-label="الملفات" ref={stripRef}>
              {items.map((item, i) => {
                const Icon = KIND_ICONS[item.kind];
                return (
                  <button type="button" key={`${i}:${item.url}`} className={`fv__thumb ${i === index ? 'is-active' : ''}`} onClick={() => pick(i)} title={item.name} aria-current={i === index ? 'true' : undefined}>
                    {item.kind === 'image'
                      ? stripOn && <img src={item.url} alt="" loading="lazy" decoding="async" {...LAST} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                      : <span className={`fv__thumb-icon is-${item.kind}`}><Icon size={20} /><em>{item.ext || 'file'}</em></span>}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      )}
    </Dialog>
  );
}
