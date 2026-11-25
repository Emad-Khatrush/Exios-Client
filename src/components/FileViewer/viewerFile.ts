// Reads a stored file ({ path, filename, fileType, thumb, preview, ... } or a URL) as the viewer shows
// it. Kept apart from the viewer (no styles, no icons) so tests can load it.
import { convertGoogleStorageUrl } from '../../utils/methods';

export type Kind = 'image' | 'pdf' | 'video' | 'audio' | 'sheet' | 'doc' | 'other';

const EXT: Record<string, Kind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image', svg: 'image', avif: 'image', heic: 'image',
  pdf: 'pdf', mp4: 'video', webm: 'video', mov: 'video', m4v: 'video', mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
  xls: 'sheet', xlsx: 'sheet', csv: 'sheet', doc: 'doc', docx: 'doc', txt: 'doc',
};

export const extOf = (value = '') => (value.split('?')[0].split('#')[0].match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();

export function kindOf(type = '', ext = ''): Kind {
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

// url: the original (downloads). thumb / preview: light copies the server makes of a photo (a small
// one for squares, a large one for the viewer); older photos have none and show the original.
export type ViewerFile = { url: string; name: string; kind: Kind; ext: string; size: string; thumb: string; preview: string };

// Accepts a URL or a stored file ({ path, filename, fileType, ... })
export function toViewerFile(file: any): ViewerFile {
  const raw = typeof file === 'string' ? { path: file } : file || {};
  const url = convertGoogleStorageUrl(raw.path || raw.url || '');
  const name = raw.filename || raw.name || decodeURIComponent(url.split('?')[0].split('/').pop() || 'ملف');
  const ext = extOf(name) || extOf(url);
  const kind = kindOf(raw.fileType || raw.mimetype || raw.type, ext);
  const preview = kind === 'image' && raw.preview ? convertGoogleStorageUrl(raw.preview) : '';
  const thumb = kind === 'image' && raw.thumb ? convertGoogleStorageUrl(raw.thumb) : '';
  return { url, name, ext, kind, size: sizeOf(raw.bytes || raw.size), thumb: thumb || preview || url, preview: preview || url };
}
