import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import api from '../../api';

type Tone = 'info' | 'warning' | 'success' | 'error';
type Post = { _id: string, title: string, message: string, type: Tone, publishedAt?: string | null, createdAt?: string, expiresAt?: string | null };

// The same words and colours as the announcements page
const TONES: Record<Tone, { label: string, icon: typeof Info }> = {
  error: { label: 'مهم', icon: OctagonAlert },
  warning: { label: 'تنبيه', icon: AlertTriangle },
  success: { label: 'خبر سار', icon: CheckCircle2 },
  info: { label: 'معلومة', icon: Info },
};

const dateOf = (p: Post) => new Date(p.publishedAt || p.createdAt || 0);
const DAY = 24 * 60 * 60 * 1000;
const ago = (d: Date) => {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / DAY);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days === 2) return 'منذ يومين';
  if (days <= 10) return `منذ ${days} أيام`;
  return d.toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long' });
};

// When the customer last opened the announcements page (written by that page)
const lastSeen = () => {
  try { return Number(localStorage.getItem('announcements:lastSeen')) || 0; } catch { return 0; }
};

/* The three newest announcements, as cards that lead to the full page. Nothing is shown when
   there are none, or while they load, so the home page never jumps for an empty block. */
const LatestPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [seen] = useState(lastSeen);

  useEffect(() => {
    api.get('posts').then((res: any) => {
      const now = Date.now();
      const list: Post[] = (res?.data?.results || [])
        .filter((p: Post) => p?.title && (!p.expiresAt || new Date(p.expiresAt).getTime() > now))
        .sort((a: Post, b: Post) => dateOf(b).getTime() - dateOf(a).getTime())
        .slice(0, 3);
      setPosts(list);
    }).catch(() => setPosts([]));
  }, []);

  if (!posts.length) return null;

  return (
    <section className="hm-posts" aria-labelledby="hm-posts-title">
      <div className="hm-posts__head">
        <h2 id="hm-posts-title" className="hm-title">آخر الإعلانات</h2>
        <Link to="/announcements">كل الإعلانات <ArrowLeft size={16} aria-hidden /></Link>
      </div>
      <ul className="hm-posts__list">
        {posts.map((p, i) => {
          const tone = TONES[p.type] ? p.type : 'info';
          const { label, icon: Icon } = TONES[tone];
          const d = dateOf(p);
          const isNew = seen > 0 && d.getTime() > seen;
          return (
            <li key={p._id} style={{ animationDelay: `${0.08 * i}s` }}>
              <Link to="/announcements" className="hm-post" data-tone={tone}>
                <span className="hm-post__meta">
                  <span className="hm-post__tone"><Icon size={14} aria-hidden />{label}</span>
                  {isNew && <span className="hm-post__new">جديد</span>}
                  <span className="hm-post__ago">{ago(d)}</span>
                </span>
                <b className="hm-post__title bidi-text" dir="auto">{p.title}</b>
                <span className="hm-post__text bidi-text" dir="auto">{p.message}</span>
                <span className="hm-post__more">اقرأ الإعلان <ArrowLeft size={14} aria-hidden /></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default LatestPosts;
