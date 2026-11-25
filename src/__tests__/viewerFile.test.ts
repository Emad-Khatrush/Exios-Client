import { toViewerFile } from '../components/FileViewer/viewerFile';

// 2026-11-25: the server stores light copies of a photo; the app shows them, the original is downloaded
describe('toViewerFile: the light copies of a photo', () => {
  it('uses the thumbnail for squares and the preview in the viewer, and keeps the original for download', () => {
    const f = toViewerFile({ path: 'https://x/a.jpg', fileType: 'image/jpeg', thumb: 'https://x/t.webp', preview: 'https://x/p.webp' });
    expect(f).toMatchObject({ url: 'https://x/a.jpg', thumb: 'https://x/t.webp', preview: 'https://x/p.webp', kind: 'image' });
  });
  it('an older photo without copies shows the original everywhere', () => {
    const f = toViewerFile({ path: 'https://x/a.jpg', fileType: 'image/jpeg' });
    expect(f).toMatchObject({ url: 'https://x/a.jpg', thumb: 'https://x/a.jpg', preview: 'https://x/a.jpg' });
  });
  it('a PDF never uses copies', () => {
    const f = toViewerFile({ path: 'https://x/a.pdf', fileType: 'application/pdf', thumb: 'https://x/t.webp' });
    expect(f.preview).toBe('https://x/a.pdf');
  });
});
