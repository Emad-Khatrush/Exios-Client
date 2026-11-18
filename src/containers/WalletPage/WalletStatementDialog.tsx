import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, IconButton, useMediaQuery } from '@mui/material';
import { FileSpreadsheet, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { User } from '../../models';
import { WalletCurrency, WalletMovement } from './walletTypes';
import { amountText, dayKey } from './walletFormat';
import logo from '../../../public/images/exios-logo.png';
import './statement.scss';

// The customer's account statement: the same document as the admin's
// (exios-admin/src/containers/UserDetails/StatementDocument.tsx): the company header, the customer,
// the period, the balance, then date / description / debit / credit / balance, the opening balance
// first and the totals last. Printed (or saved as PDF from the print window) or downloaded as Excel.
// Keep the two the same.

type Props = {
  open: boolean
  onClose: () => void
  account: User
  currency: WalletCurrency
  // Oldest first, each with the balance after it
  rows: WalletMovement[]
}

const dateText = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};
// A balance with its sign: below zero is what the customer owes
const balanceText = (value: number) => `${value < 0 ? '-' : ''}${amountText(value)}`;
const signedOf = (row: WalletMovement) => (row.direction === 'out' ? -1 : 1) * row.amount;
const round2 = (value: number) => Math.round(value * 100) / 100;
const fileName = (text: string) => text.replace(/[\\/:*?"<>|]+/g, '-').trim();

// The rows of a period and its opening balance (what the wallet held before its first day)
function periodOf(rows: WalletMovement[], from: string, to: string) {
  const before = from ? rows.filter((row) => dayKey(row.at) < from) : [];
  const inside = rows.filter((row) => (!from || dayKey(row.at) >= from) && (!to || dayKey(row.at) <= to));
  const opening = before.length ? before[before.length - 1].balance : rows.length ? round2(rows[0].balance - signedOf(rows[0])) : 0;
  return { rows: inside, opening };
}
function snapshotOf(rows: WalletMovement[], emptyOpening: number) {
  const opening = rows.length ? round2(rows[0].balance - signedOf(rows[0])) : emptyOpening;
  return {
    rows,
    opening,
    closing: rows.length ? rows[rows.length - 1].balance : opening,
    incoming: round2(rows.filter((r) => r.direction === 'in').reduce((sum, r) => sum + r.amount, 0)),
    outgoing: round2(rows.filter((r) => r.direction === 'out').reduce((sum, r) => sum + r.amount, 0)),
  };
}

const today = () => dayKey(new Date());
const QUICK: [string, string][] = [['', 'كل الفترة'], ['month', 'هذا الشهر'], ['30', 'آخر 30 يوماً'], ['year', 'هذه السنة']];
const quickFrom = (value: string) => {
  const now = new Date();
  if (value === 'month') return dayKey(new Date(now.getFullYear(), now.getMonth(), 1));
  if (value === 'year') return dayKey(new Date(now.getFullYear(), 0, 1));
  if (value === '30') return dayKey(new Date(now.getTime() - 29 * 86400000));
  return '';
};

const WalletStatementDialog = ({ open, onClose, account, currency, rows }: Props) => {
  const [scope, setScope] = useState<'period' | 'last15'>('period');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paper = useRef<HTMLDivElement>(null);
  const mobile = useMediaQuery('(max-width:700px)');
  useEffect(() => { if (open) { setScope('period'); setFrom(''); setTo(''); setError(''); } }, [open]);

  const period = useMemo(() => periodOf(rows, from, to), [rows, from, to]);
  const snap = useMemo(() => snapshotOf(scope === 'last15' ? period.rows.slice(-15) : period.rows, period.opening), [period, scope]);
  const invalid = !!from && !!to && from > to;
  const disabled = busy || invalid || !snap.rows.length;
  const name = [account?.firstName, account?.lastName].filter(Boolean).join(' ') || 'العميل';
  const first = snap.rows[0]?.at;
  const last = snap.rows[snap.rows.length - 1]?.at;
  const shownFrom = scope === 'last15' ? first : from || first;
  const shownTo = scope === 'last15' ? last : to || last;
  const title = fileName(`كشف حساب-${account?.customerId || name}-${currency}`);

  const print = useReactToPrint({
    contentRef: paper,
    documentTitle: title,
    pageStyle: '@page { size: A4 portrait; margin: 12mm; } html, body { margin: 0 !important; padding: 0 !important; background: white !important; }',
    onBeforePrint: () => { setBusy(true); setError(''); return Promise.resolve(); },
    onAfterPrint: () => setBusy(false),
    onPrintError: () => { setBusy(false); setError('تعذّر فتح نافذة الطباعة. جرّب متصفحاً آخر.'); },
  });

  const excel = async () => {
    if (disabled) return;
    setBusy(true);
    setError('');
    try {
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.aoa_to_sheet([
        ['شركة إكسيوس للشحن - كشف حساب العميل'], ['العميل', name, 'كود العميل', account?.customerId || ''],
        ['العملة', currency, 'من', dateText(shownFrom), 'إلى', dateText(shownTo)],
        ['الرصيد', snap.closing], [],
        ['التاريخ', 'البيان', 'مدين', 'دائن', 'الرصيد'],
        ['', 'الرصيد قبل أول حركة في هذا الكشف', 0, 0, snap.opening],
        ...snap.rows.map((row) => [dateText(row.at), row.description, row.direction === 'out' ? row.amount : 0, row.direction === 'out' ? 0 : row.amount, row.balance]),
      ]);
      sheet['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
      const book = XLSX.utils.book_new();
      book.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(book, sheet, 'كشف الحساب');
      XLSX.writeFile(book, `${title}.xlsx`);
    } catch {
      setError('تعذّر تحميل ملف Excel. أعد المحاولة.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} fullScreen={mobile} fullWidth maxWidth="lg" onClose={() => { if (!busy) onClose(); }}
      className="statement-preview" aria-labelledby="wl-statement-title" PaperProps={{ dir: 'rtl' }}>
      <header className="statement-preview__toolbar">
        <div><h2 id="wl-statement-title">كشف الحساب</h2><p>اختر الفترة، ثم اطبعه أو احفظه PDF أو حمّله Excel.</p></div>
        <IconButton aria-label="إغلاق" disabled={busy} onClick={onClose}><X size={20} /></IconButton>
      </header>
      <div className="statement-preview__options">
        <label>من تاريخ<input type="date" value={from} max={to || today()} disabled={busy} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>إلى تاريخ<input type="date" value={to} min={from || undefined} max={today()} disabled={busy} onChange={(e) => setTo(e.target.value)} /></label>
        <label>الحركات
          <select value={scope} disabled={busy} onChange={(e) => setScope(e.target.value as 'period' | 'last15')}>
            <option value="period">كل حركات الفترة ({period.rows.length})</option>
            <option value="last15">آخر 15 حركة</option>
          </select>
        </label>
        <div className="statement-preview__quick">
          {QUICK.map(([value, label]) => (
            <button key={value} type="button" disabled={busy} onClick={() => { setScope('period'); setFrom(quickFrom(value)); setTo(value ? today() : ''); }}>{label}</button>
          ))}
        </div>
      </div>
      {invalid && <p className="statement-preview__error" role="alert">تاريخ البداية يجب أن يسبق تاريخ النهاية.</p>}
      {!invalid && !snap.rows.length && <p className="statement-preview__error" role="status">لا توجد حركات في هذه الفترة. اختر فترة أخرى.</p>}
      {error && <p className="statement-preview__error" role="alert">{error}</p>}

      <div className="statement-preview__canvas">
        <div className="statement-paper" ref={paper} dir="rtl">
          <header className="statement-paper__brand">
            <div><img src={logo} alt="Exios" /><p>شركة إكسيوس للشحن</p></div>
            <div>
              <h1>كشف حساب عميل</h1>
              <span>{currency === 'LYD' ? 'دينار ليبي' : 'دولار أمريكي'} · <bdi>{currency}</bdi></span>
              <small>تاريخ الإصدار: <bdi>{dateText(new Date())}</bdi></small>
            </div>
          </header>
          <section className="statement-paper__identity">
            <div><span>اسم العميل</span><strong dir="auto">{name}</strong><small>كود العميل: <bdi>{account?.customerId || '—'}</bdi></small></div>
            <div>
              <span>فترة الكشف</span>
              <strong><bdi>{dateText(shownFrom)}</bdi> - <bdi>{dateText(shownTo)}</bdi></strong>
              <small>{snap.rows.length} حركة · {scope === 'last15' ? 'آخر 15 حركة' : 'كل حركات الفترة'}</small>
            </div>
          </section>
          <div className={`statement-paper__balance${snap.closing < 0 ? ' is-owed' : ''}`}><span>{snap.closing < 0 ? 'الصافي المستحق عليك' : 'الصافي'} · {currency}</span><strong><bdi>{balanceText(snap.closing)}</bdi></strong></div>
          <div className="statement-paper__table-wrap">
            <table>
              <caption>حركات المحفظة والمبالغ المتبقية عليك من طلبياتك، كل المبالغ بعملة {currency}</caption>
              <colgroup><col style={{ width: '16%' }} /><col style={{ width: '42%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} /><col style={{ width: '14%' }} /></colgroup>
              <thead><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
              <tbody>
                <tr className="statement-paper__opening"><td colSpan={4}>الرصيد قبل أول حركة في هذا الكشف</td><td><bdi>{balanceText(snap.opening)}</bdi></td></tr>
                {snap.rows.map((row) => (
                  <tr key={row.id}>
                    <td><bdi>{dateText(row.at)}</bdi></td>
                    <td className="statement-paper__description"><p dir="auto">{row.description}</p></td>
                    <td><bdi>{row.direction === 'out' ? amountText(row.amount) : '—'}</bdi></td>
                    <td><bdi>{row.direction === 'out' ? '—' : amountText(row.amount)}</bdi></td>
                    <td className={row.balance < 0 ? 'is-owed' : undefined}><bdi>{balanceText(row.balance)}</bdi></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2}>الإجمالي / رصيد نهاية الكشف</th>
                  <td><bdi>{amountText(snap.outgoing)}</bdi></td>
                  <td><bdi>{amountText(snap.incoming)}</bdi></td>
                  <td className={snap.closing < 0 ? 'is-owed' : undefined}><bdi>{balanceText(snap.closing)}</bdi></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <footer className="statement-paper__footer"><p>يوضح هذا الكشف حركة محفظتك والمبالغ المتبقية عليك من طلبياتك خلال الفترة المحددة. الرصيد بالسالب مبلغ متبقٍ عليك.</p><span>إكسيوس · شكراً لتعاملكم معنا</span></footer>
        </div>
      </div>

      <footer className="statement-preview__actions">
        <p>لحفظه PDF: اختر «حفظ بتنسيق PDF» أو «مشاركة» من نافذة الطباعة.</p>
        <div>
          <button type="button" disabled={disabled} onClick={() => void excel()}><FileSpreadsheet size={16} />{busy ? 'جارٍ التحميل…' : 'تحميل Excel'}</button>
          <button type="button" className="is-primary" disabled={disabled} onClick={() => print()}><Printer size={16} />طباعة / حفظ PDF</button>
        </div>
      </footer>
    </Dialog>
  );
};

export default WalletStatementDialog;
