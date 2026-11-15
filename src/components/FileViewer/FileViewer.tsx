import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
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

// An image is shown whole by default ("fit"); "width" fills the width and scrolls down for the rest
type ImageView = { mode: 'fit' | 'width'; turn: number };

function Stage({ file, view, onToggle }: { file: ViewerFile; view: ImageView; onToggle: () => void }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [ratio, setRatio] = useState(1);
  useEffect(() => { setState('loading'); setRatio(1); }, [file.url]);

  if (!file.url) return <FileCard file={file} note="لا يوجد رابط لهذا الملف." />;
  if (file.kind === 'image') {
    if (state === 'error') return <FileCard file={file} note="تعذّر عرض الصورة هنا. حمّلها لمشاهدتها." />;
    const sideways = view.turn % 180 !== 0;
    return (
      <div className={`fv-image is-${view.mode} ${sideways ? 'is-sideways' : ''}`} onClick={() => state === 'ready' && onToggle()}
        title={view.mode === 'fit' ? 'انقر لملء العرض والنزول بالتمرير' : 'انقر لعرض الصورة كاملة'}>
        {state === 'loading' && <div className="fv-skeleton" />}
        {/* The box takes the shape the image has on screen (turned or not), so the page scrolls over all of it */}
        <div className="fv-box" style={{ '--fv-turn': `${view.turn}deg`, '--fv-r': ratio, '--fv-vr': sideways ? 1 / ratio : ratio } as React.CSSProperties}>
          <img src={file.url} alt={file.name} className={state === 'ready' ? 'is-ready' : ''}
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

export default function FileViewer({ open, files, onClose, startIndex = 0 }: Props) {
  const items = useMemo(() => (files || []).filter(Boolean).map(toViewerFile), [files]);
  const [index, setIndex] = useState(startIndex);
  useEffect(() => { if (open) setIndex(Math.min(startIndex, Math.max(items.length - 1, 0))); }, [open, startIndex, items.length]);

  const count = items.length;
  const go = useCallback((step: number) => setIndex(i => (count ? (i + step + count) % count : 0)), [count]);

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
  useEffect(() => setView({ mode: 'fit', turn: 0 }), [file?.url]);
  const toggleView = () => setView(v => ({ ...v, mode: v.mode === 'fit' ? 'width' : 'fit' }));
  const BadgeIcon = file ? KIND_ICONS[file.kind] : File;

  return (
    <Dialog open={open && !!count} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ className: 'fv' }}>
      {file && (
        <div className="fv__shell" dir="rtl">
          <header className="fv__bar">
            <div className="fv__title">
              <span className={`fv__badge is-${file.kind}`}><BadgeIcon size={18} /></span>
              <div className="fv__names">
                <div className="fv__name" dir="auto" title={file.name}>{file.name}</div>
                <div className="fv__sub">{KIND_LABEL[file.kind]}{file.size && <> · <bdi>{file.size}</bdi></>}</div>
              </div>
            </div>
            <div className="fv__tools">
              {count > 1 && <bdi className="fv__count">{index + 1} / {count}</bdi>}
              {file.kind === 'image' && <>
                <button type="button" className="fv__icon" onClick={toggleView} title={view.mode === 'fit' ? 'ملء العرض (النزول بالتمرير)' : 'عرض الصورة كاملة'} aria-label={view.mode === 'fit' ? 'ملء العرض' : 'عرض الصورة كاملة'}>
                  {view.mode === 'fit' ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
                </button>
                <button type="button" className="fv__icon" onClick={() => setView(v => ({ ...v, turn: (v.turn + 90) % 360 }))} title="تدوير" aria-label="تدوير">
                  <RotateCw size={20} />
                </button>
              </>}
              <button type="button" className="fv__icon" onClick={() => download(file)} title="تحميل" aria-label="تحميل"><Download size={20} /></button>
              <button type="button" className="fv__icon" onClick={onClose} title="إغلاق" aria-label="إغلاق"><X size={21} /></button>
            </div>
          </header>

          <main className="fv__stage">
            <div className="fv__slide" key={`${index}:${file.url}`}><Stage file={file} view={view} onToggle={toggleView} /></div>
            {count > 1 && <>
              <button type="button" className="fv__nav fv__nav--prev" aria-label="السابق" onClick={() => go(-1)}><ChevronRight size={24} /></button>
              <button type="button" className="fv__nav fv__nav--next" aria-label="التالي" onClick={() => go(1)}><ChevronLeft size={24} /></button>
            </>}
          </main>

          {count > 1 && (
            <nav className="fv__strip" aria-label="الملفات">
              {items.map((item, i) => {
                const Icon = KIND_ICONS[item.kind];
                return (
                  <button type="button" key={`${i}:${item.url}`} className={`fv__thumb ${i === index ? 'is-active' : ''}`} onClick={() => setIndex(i)} title={item.name}>
                    {item.kind === 'image'
                      ? <img src={item.url} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
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
