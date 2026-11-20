import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, CircleCheck, CircleX, Clock3, HandCoins, Package, RefreshCw, Repeat } from 'lucide-react';
import api from '../../api';
import { HistoryItem, HistoryResponse, friendStatusText, historyNoteText, kindText, pointsNum, waitingText } from './referralText';
import './invite.css';

const FILTERS: { value: string, label: string }[] = [
  { value: '', label: 'الكل' }, { value: 'granted', label: 'أُضيفت' }, { value: 'pending', label: 'تنتظر' }, { value: 'canceled', label: 'أُلغيت' },
];
const dayText = (d: string) => new Date(d).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const KIND_ICON = { first: HandCoins, share: Repeat, step: Award };
const STATE_ICON = { granted: CircleCheck, pending: Clock3, canceled: CircleX };

/* «سجل مكافآت الدعوة»: every reward from the customer's friends, or one friend's (?friend=id) with a
   summary of that friend: what they paid, how many orders, and what each order brought. */
const InviteHistory = () => {
  const [params, setParams] = useSearchParams();
  const friendId = params.get('friend') || '';
  const status = params.get('status') || '';
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = (p: number) => {
    setFailed(false);
    setLoading(true);
    api.getReferralHistory({ friend: friendId || undefined, status: status || undefined, page: p })
      .then((res: any) => {
        if (!res?.data || (!res.data.off && !Array.isArray(res.data.items))) { setFailed(true); return; }
        setData(res.data);
        setItems((list) => (p === 1 ? res.data.items || [] : [...list, ...(res.data.items || [])]));
        setPage(p);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => { setItems([]); load(1); }, [friendId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('status', value); else next.delete('status');
    setParams(next, { replace: true });
  };

  const friend = data?.friend || null;
  const friendState = friend ? friendStatusText({ ...friend, points: 0, heldPoints: 0 }, data?.qualifyUsd || 200) : null;

  return (
    <div dir="rtl" lang="ar" className="iv-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/invite" className="ih-back"><ArrowRight size={17} aria-hidden /> ادعُ صديقك</Link>
        <header className="ih-head">
          <h1>{friend ? `ما كسبته من ${friend.name}` : 'سجل مكافآت الدعوة'}</h1>
          {friend && <Link to="/invite/history" className="ih-all">كل الأصدقاء</Link>}
        </header>

        {data?.off && <div className="iv-state"><b>الدعوات غير متاحة لحسابك</b></div>}
        {failed && (
          <div className="iv-state" role="alert">
            <b>تعذّر تحميل السجل</b>
            <button type="button" className="iv-btn iv-btn--ghost" onClick={() => load(1)}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
          </div>
        )}

        {friend && friendState && (
          <section className="iv-card ih-friend" aria-label="ملخص الصديق">
            <div className="ih-friend__top">
              <span className="iv-friends__avatar" aria-hidden>{friend.name.charAt(0)}</span>
              <div>
                <b>{friend.name}</b>
                <small className={`is-${friendState.tone}`}>{friendState.text}</small>
                {waitingText(friend.waiting) && <small className="is-wait">{waitingText(friend.waiting)}</small>}
              </div>
            </div>
            <dl className="ih-stats">
              <div><dt>دفع</dt><dd><bdi dir="ltr">{pointsNum(friend.paidUsd)}$</bdi></dd></div>
              <div><dt>طلبيات كسبت منها</dt><dd>{friend.orders}</dd></div>
              <div><dt>سجّل</dt><dd>{dayText(friend.joinedAt)}</dd></div>
            </dl>
          </section>
        )}

        {data && !data.off && (
          <dl className="ih-totals" aria-label="المجموع">
            <div className="is-granted"><dt>أُضيفت لرصيدك</dt><dd>{pointsNum(data.totals.granted)}</dd></div>
            <div className="is-pending"><dt>تنتظر</dt><dd>{pointsNum(data.totals.pending)}</dd></div>
            <div className="is-canceled"><dt>أُلغيت</dt><dd>{pointsNum(data.totals.canceled)}</dd></div>
          </dl>
        )}

        {data && !data.off && (
          <div className="ih-filters" role="tablist" aria-label="تصفية السجل">
            {FILTERS.map((f) => (
              <button key={f.value} type="button" role="tab" aria-selected={status === f.value} className={status === f.value ? 'is-on' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>
            ))}
          </div>
        )}

        {!data && !failed && <div className="iv-sk" aria-busy="true" />}
        {data && !data.off && !items.length && !loading && (
          <p className="iv-empty">{status ? 'لا توجد مكافآت هنا.' : friend ? 'لم تكسب من هذا الصديق بعد. تبدأ مكافآتك عندما يدفع.' : 'لا توجد مكافآت بعد. ادعُ أول صديق الآن.'}</p>
        )}

        {!!items.length && (
          <ul className="ih-list">
            {items.map((i, n) => {
              const KindIcon = KIND_ICON[i.kind];
              const StateIcon = STATE_ICON[i.state];
              return (
                <li key={i.id} className={`ih-item is-${i.state}`} style={{ ['--iv-d' as any]: `${Math.min(Math.max(n - (page - 1) * 30, 0), 10) * 45}ms` }}>
                  <span className="ih-item__icon" aria-hidden><KindIcon size={19} /></span>
                  <div className="ih-item__main">
                    <b>{kindText(i)}</b>
                    {!friend && i.friend && <Link to={`/invite/history?friend=${i.friend.id}`} className="ih-item__friend">{i.friend.name}</Link>}
                    {i.orderNumber && (
                      <small><Package size={13} aria-hidden /> طلبية <bdi dir="ltr">{i.orderNumber}</bdi>{i.paidUsd ? <> · دفع <bdi dir="ltr">{pointsNum(i.paidUsd)}$</bdi></> : null}</small>
                    )}
                    <small className={`ih-item__state is-${i.state}`}><StateIcon size={13} aria-hidden /> {historyNoteText(i, data?.holdHours || 24)}</small>
                  </div>
                  <span className="ih-item__pts"><bdi dir="ltr">{i.state === 'canceled' ? '' : '+'}{pointsNum(i.points)}</bdi><small>{dayText(i.at)}</small></span>
                </li>
              );
            })}
          </ul>
        )}

        {data && !data.off && page < data.pages && (
          <button type="button" className="iv-btn iv-btn--ghost ih-more" onClick={() => load(page + 1)} disabled={loading}>عرض المزيد</button>
        )}
      </div>
    </div>
  );
};

export default InviteHistory;
