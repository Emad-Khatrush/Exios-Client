import { useMemo, useState } from 'react';
import { Download, FileText, Search, X } from 'lucide-react';
import TermsPdf from '../../../public/terms.pdf';
import { GROUPS, TermGroup, TERMS } from './terms';
import './terms.css';

// Arabic letters that read alike, so "اسعار" finds "أسعار" and "شحنه" finds "شحنة"
const fold = (s: string) => s
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/ى/g, 'ي')
  .toLowerCase();

const TermsAndPrivacy = () => {
  const [group, setGroup] = useState<TermGroup | 'all'>('all');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = fold(query.trim());
    return TERMS.filter((t) => (group === 'all' || t.group === group) && (!q || fold(t.text).includes(q) || String(t.n) === q));
  }, [group, query]);

  return (
    <div dir="rtl" lang="ar" className="tm-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-3xl">
        <header className="tm-head">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl">الشروط والسياسات</h1>
            <p className="mt-1 text-base leading-relaxed text-zinc-600">
              شروط وضوابط التزامات العميل مع شركة الاستقبال (إكسيوس) للخدمات والأعمال التجارية.
            </p>
          </div>
          <a className="tm-pdf" href={TermsPdf} target="_blank" rel="noopener noreferrer" download="Exios-terms.pdf">
            <Download size={17} aria-hidden /> نسخة PDF
          </a>
        </header>

        <p className="tm-agree">إنشاؤك لحساب في موقعنا يعني موافقتك على هذه الشروط.</p>

        <div className="tm-tools">
          <label className="tm-search">
            <Search size={18} aria-hidden />
            <input type="text" inputMode="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في الشروط، مثل: الوزن، الجمارك، التأمين" aria-label="بحث في الشروط" />
            {query && <button type="button" aria-label="مسح البحث" onClick={() => setQuery('')}><X size={16} /></button>}
          </label>
          <div className="tm-chips" role="group" aria-label="القسم">
            <button type="button" aria-pressed={group === 'all'} className={group === 'all' ? 'is-active' : ''} onClick={() => setGroup('all')}>الكل</button>
            {GROUPS.map((g) => (
              <button key={g.key} type="button" aria-pressed={group === g.key} className={group === g.key ? 'is-active' : ''} onClick={() => setGroup(g.key)}>{g.label}</button>
            ))}
          </div>
        </div>

        {shown.length ? (
          <ol className="tm-list">
            {shown.map((t) => (
              <li key={t.n} className="tm-item">
                <span className="tm-item__n">{t.n}</span>
                <div>
                  <span className="tm-item__group">{GROUPS.find((g) => g.key === t.group)?.label}</span>
                  <p>{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="tm-empty">
            <FileText size={30} aria-hidden />
            <p>لا يوجد بند يطابق «{query}».</p>
            <button type="button" onClick={() => { setQuery(''); setGroup('all'); }}>عرض كل الشروط</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsAndPrivacy;
