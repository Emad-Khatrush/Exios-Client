import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Check, ChevronDown, ChevronLeft, Copy, RefreshCw, ScrollText, Share2 } from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { useCopy } from '../../utils/useCopy';
import { Friend, Referrals, SIGNUP_GIFT_POINTS, Step, waitingText, friendStatusText, nextStepText, pointsNum, shareMessage, usd } from './referralText';
import './invite.css';

const dayText = (d: string) => new Date(d).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long' });

// The bars of the barcode under the code: drawn from the code itself, so each customer's is their own
const barsOf = (code: string) => Array.from(`${code}EXIOS${code}`).flatMap((c, i) => {
  const v = c.charCodeAt(0) + i * 7;
  return [1 + (v % 3), 1 + ((v >> 2) % 2)];
});

/* «ادعُ صديقك», designed as what Exios ships: the invite is a shipping label from the customer to a
   friend (what each side gets, the code as its tracking number), sent on WhatsApp. Below it the
   customer's earnings and friends, how an invite travels (a tracking line), and one route of extra
   rewards ending at «سفير Exios». Rules: spec 2026-11-20 in Exios-Api. */
const InvitePage = () => {
  const [data, setData] = useState<Referrals | null>(null);
  const [failed, setFailed] = useState(false);
  const { copied, copy } = useCopy();

  const load = () => {
    setFailed(false);
    api.getReferrals()
      .then((res: any) => (res?.data && (res.data.off || res.data.code) ? setData(res.data) : setFailed(true)))
      .catch(() => setFailed(true));
  };
  useEffect(() => { load(); }, []);

  const page = (children: any) => (
    <div dir="rtl" lang="ar" className="iv-page w-full px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  );

  if (failed) {
    return page(
      <div className="iv-state" role="alert">
        <b>تعذّر تحميل صفحة الدعوة</b>
        <p>تحقق من اتصالك ثم أعد المحاولة.</p>
        <button type="button" className="iv-btn iv-btn--ghost" onClick={load}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
      </div>,
    );
  }
  if (!data) return page(<div className="iv-sk" aria-busy="true" aria-label="جارٍ التحميل" />);
  if (data.off) {
    return page(
      <div className="iv-state">
        <b>الدعوات غير متاحة لحسابك</b>
        <p>للاستفسار تواصل مع المكتب.</p>
        <Link to="/contact-us" className="iv-btn iv-btn--ghost">تواصل معنا</Link>
      </div>,
    );
  }

  const link = `${window.location.origin}${data.path}`;
  const message = shareMessage(link, data.welcomePoints);
  const canShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
  const share = () => { (navigator as any).share({ title: 'Exios', text: message }).catch(() => undefined); };
  const sharePoints = data.ambassadorAt ? data.ambassadorSharePoints : data.sharePoints;
  const hasFriends = data.friends.length > 0;
  const nextStep = data.steps.find((s) => !s.reached);
  const next = nextStepText(data.qualified, data.friendsPaidUsd, data.steps);

  const label = (
    <section className="ivl" aria-label="بطاقة دعوتك">
      <div className="ivl__band">
        <b>Exios</b>
        <span>بطاقة دعوة</span>
        {data.ambassadorAt && <span className="ivl__amb"><Award size={14} aria-hidden /> {data.ambassadorTitle}</span>}
      </div>
      <div className="ivl__parties">
        <div>
          <small>إلى صديقك</small>
          <b><bdi>{usd(data.welcomePoints)}</bdi> هدية</b>
          <span>لأول فاتورة شحن أو شراء</span>
        </div>
        <div>
          <small>لك أنت</small>
          <b><bdi>{usd(data.firstPoints)}</bdi> عن كل صديق</b>
          <span>ثم {sharePoints} نقاط عن كل <bdi>{data.sharePerUsd}$</bdi> يدفعها لمدة سنة</span>
        </div>
      </div>
      <div className="ivl__tear" aria-hidden />
      <div className="ivl__code">
        <small>كود الدعوة</small>
        <div className="ivl__code-row">
          <b dir="ltr">{data.code}</b>
          <button type="button" onClick={() => copy('code', data.code)} aria-label="انسخ الكود">
            {copied === 'code' ? <><Check size={16} aria-hidden /> نُسخ</> : <><Copy size={16} aria-hidden /> نسخ</>}
          </button>
        </div>
        <div className="ivl__bars" aria-hidden>
          {barsOf(data.code).map((w, i) => <span key={i} style={{ width: `${w * 2}px`, opacity: i % 2 ? 0 : 1 }} />)}
        </div>
      </div>
    </section>
  );

  const sendRow = (
    <div className="iv-send">
      <a className="iv-btn iv-btn--wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        <TbBrandWhatsapp size={22} aria-hidden /> أرسل الدعوة على واتساب
      </a>
      <div className="iv-send__row">
        <button type="button" className="iv-btn iv-btn--ghost" onClick={() => copy('link', link)}>
          {copied === 'link' ? <><Check size={17} aria-hidden /> نُسخ الرابط</> : <><Copy size={17} aria-hidden /> نسخ الرابط</>}
        </button>
        {canShare && <button type="button" className="iv-btn iv-btn--ghost" onClick={share}><Share2 size={17} aria-hidden /> مشاركة</button>}
      </div>
    </div>
  );

  const earnings = hasFriends && (
    <Link to="/invite/history" className="iv-earn">
      <span className="iv-earn__main">
        <small>كسبت من أصدقائك</small>
        <b>{pointsNum(data.totalPoints)} <span>نقطة</span></b>
      </span>
      {data.heldPoints > 0 && (
        <span className="iv-earn__held">
          <small>تنتظر</small>
          <b>{pointsNum(data.heldPoints)}</b>
        </span>
      )}
      <span className="iv-earn__go">السجل <ChevronLeft size={16} aria-hidden /></span>
    </Link>
  );

  const friends = (
    <section className="iv-sec" aria-labelledby="iv-friends">
      <div className="iv-sec__head">
        <h2 id="iv-friends">أصدقائي {hasFriends && <span className="iv-count">{data.friends.length}</span>}</h2>
        {hasFriends && <Link to="/invite/history" className="iv-sec__link">السجل الكامل</Link>}
      </div>
      {!hasFriends ? (
        <p className="iv-empty">لم يسجّل أحد بدعوتك بعد. أرسل رابطك لأول صديق، وستراه هنا فور تسجيله.</p>
      ) : (
        <ul className="iv-friends">
          {data.friends.map((f: Friend) => {
            const status = friendStatusText(f, data.qualifyUsd);
            const toGo = f.status === 'joined' ? Math.min(f.paidUsd / data.qualifyUsd, 1) : null;
            const wait = waitingText(f.waiting);
            return (
              <li key={f.id}>
                <Link to={`/invite/history?friend=${f.id}`} className="iv-friend" aria-label={`ما كسبته من ${f.name}`}>
                  <span className="iv-friend__avatar" aria-hidden>{f.name.charAt(0)}</span>
                  <span className="iv-friend__main">
                    <b>{f.name}</b>
                    <small className={`is-${status.tone}`}>{status.text}</small>
                    {toGo !== null && (
                      <span className="iv-friend__track" role="progressbar" aria-label={`دفع ${f.paidUsd}$ من ${data.qualifyUsd}$`}
                        aria-valuemin={0} aria-valuemax={data.qualifyUsd} aria-valuenow={Math.min(f.paidUsd, data.qualifyUsd)}>
                        <span style={{ width: `${Math.max(toGo * 100, 3)}%` }} />
                      </span>
                    )}
                    {wait && <small className="is-wait">{wait}</small>}
                  </span>
                  <span className="iv-friend__side">
                    {f.points > 0 && <b><bdi dir="ltr">+{pointsNum(f.points)}</bdi></b>}
                    {f.heldPoints > 0 && <small><bdi dir="ltr">+{pointsNum(f.heldPoints)}</bdi> تنتظر</small>}
                    {!f.points && !f.heldPoints && <small>منذ {dayText(f.joinedAt)}</small>}
                  </span>
                  <ChevronLeft size={18} aria-hidden className="iv-friend__go" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  // How an invite travels, as a shipment's tracking line: it really is a sequence
  const how = (
    <section className="iv-sec" aria-labelledby="iv-how">
      <div className="iv-sec__head"><h2 id="iv-how">كيف تصل مكافأتك؟</h2></div>
      <ol className="iv-track">
        <li><b>ترسل رابطك لصديق</b><span>على واتساب، أو يكتب كودك عند التسجيل</span></li>
        <li><b>يسجّل ويأخذ <bdi>{usd(data.welcomePoints)}</bdi> هدية</b><span>{pointsNum(data.welcomePoints)} نقطة في حسابه فوراً</span></li>
        <li><b>يصل مجموع ما يدفعه <bdi>{data.qualifyUsd}$</bdi></b><span>تأخذ <bdi>{usd(data.firstPoints)}</bdi>، ولو دفعها على عدة طلبيات</span></li>
        <li><b>كل <bdi>{data.sharePerUsd}$</bdi> يدفعها بعدها</b><span>{sharePoints} نقاط لك لمدة سنة، وترفع عضويتك</span></li>
      </ol>
    </section>
  );

  // The extra rewards as one route; the last stop is the ambassador, with what it gives
  const stop = (s: Step) => {
    const friendsPct = Math.min(data.qualified / s.friends, 1);
    const usdPct = Math.min(data.friendsPaidUsd / s.usd, 1);
    const isNext = nextStep?.friends === s.friends;
    return (
      <li key={s.friends} className={`iv-stop${s.reached ? ' is-done' : ''}${isNext ? ' is-next' : ''}${s.ambassador ? ' is-amb' : ''}`}>
        <span className="iv-stop__dot" aria-hidden>{s.reached ? <Check size={14} strokeWidth={3} /> : s.ambassador ? <Award size={14} /> : null}</span>
        <div className="iv-stop__body">
          <div className="iv-stop__title">
            <b>{s.ambassador ? `«${s.title}»` : `${s.friends} أصدقاء`}</b>
            <span className="iv-stop__prize"><bdi dir="ltr">+{pointsNum(s.points)}</bdi> نقطة</span>
          </div>
          {!s.reached && (
            <div className="iv-stop__needs">
              <span><i style={{ width: `${friendsPct * 100}%` }} /></span>
              <small>{Math.min(data.qualified, s.friends)} من {s.friends} أصدقاء وصلوا <bdi>{data.qualifyUsd}$</bdi></small>
              <span><i style={{ width: `${usdPct * 100}%` }} /></span>
              <small><bdi dir="ltr">{pointsNum(Math.min(data.friendsPaidUsd, s.usd))}$</bdi> من <bdi dir="ltr">{pointsNum(s.usd)}$</bdi> دفعها أصدقاؤك</small>
            </div>
          )}
          {s.ambassador && (
            <ul className="iv-stop__perks">
              <li>حصتك ترتفع إلى {data.ambassadorSharePoints} نقطة عن كل <bdi>{data.sharePerUsd}$</bdi></li>
              <li>شارة «{s.title}» بجانب اسمك</li>
            </ul>
          )}
        </div>
      </li>
    );
  };
  const route = (
    <section className="iv-sec" aria-labelledby="iv-route">
      <div className="iv-sec__head"><h2 id="iv-route">مكافآت إضافية</h2></div>
      {data.ambassadorAt
        ? <p className="iv-route__lead">أنت سفير Exios: تكسب {data.ambassadorSharePoints} نقطة عن كل <bdi>{data.sharePerUsd}$</bdi> يدفعها أصدقاؤك.</p>
        : next && <p className="iv-route__lead">{next}</p>}
      <ol className="iv-route">{data.steps.map(stop)}</ol>
      <p className="iv-route__note">تُعطى بعد موافقة المكتب، وتُحسب فيها الأصدقاء بجوازات موثّقة.</p>
    </section>
  );

  const terms = (
    <details className="iv-terms">
      <summary><ScrollText size={18} aria-hidden /> <span>الشروط والتفاصيل</span> <ChevronDown size={18} aria-hidden className="iv-terms__chev" /></summary>
      <ol>
        <li>صديقك يحصل على <bdi>{pointsNum(data.welcomePoints)}</bdi> نقطة (<bdi>{usd(data.welcomePoints)}</bdi>) عندما يسجّل برابطك أو يكتب كودك عند التسجيل، بدل هدية الحساب الجديد (<bdi>{SIGNUP_GIFT_POINTS}</bdi> نقطة)، ولا تجتمع الهديتان.</li>
        <li>إذا نسي صديقك الكود، يستطيع المكتب إضافته خلال 7 أيام من فتح حسابه فقط.</li>
        <li>تكسب <bdi>{pointsNum(data.firstPoints)}</bdi> نقطة (<bdi>{usd(data.firstPoints)}</bdi>) عندما يصل مجموع ما دفعه صديقك <bdi>{data.qualifyUsd}$</bdi>، ولو على عدة طلبيات.</li>
        <li>من تلك اللحظة ولمدة {data.months} شهراً تكسب {data.sharePoints} نقاط عن كل <bdi>{data.sharePerUsd}$</bdi> يدفعها صديقك ({data.ambassadorSharePoints} نقطة إذا كنت سفيراً). نقاط صديقك لا تنقص شيئاً.</li>
        <li>كل مكافأة من الدعوة تُضاف لرصيدك بعد {data.holdHours} ساعة من دفع صديقك. إذا عُدّلت طلبيته أو أُلغيت خلالها تُلغى المكافأة، وإذا أُلغيت بعد إضافتها تُسحب.</li>
        <li>تُعطى مكافآت صديقك بعد توثيق جوازه في المكتب. وقد تراجع الإدارة الدعوة قبل إعطاء مكافآتها، والمكافآت الإضافية تُعطى بعد موافقة المكتب.</li>
        <li>المكافآت الإضافية تحتاج الشرطين معاً: عدد الأصدقاء الذين وصلوا <bdi>{data.qualifyUsd}$</bdi>، ومجموع ما دفعه كل أصدقائك: {data.steps.map((s) => `${s.friends} أصدقاء و${pointsNum(s.usd)}$ = ${pointsNum(s.points)} نقطة`).join('، ')}. كل مكافأة مرة واحدة.</li>
        <li>يُحسب ما يدفعه صديقك من فواتير الشحن والشراء المدفوعة بالكامل (والشحن بعد استلام الطرد). الطلبيات الملغاة لا تُحسب، وحوالات Alipay تُحسب بنصف قيمتها.</li>
        <li>حصتك من أصدقائك فقط ترفع عضويتك، مثل نقاط شحنك. مكافأة <bdi>{data.qualifyUsd}$</bdi> والمكافآت الإضافية نقاط للاستعمال فقط ولا تُحسب في العضوية. صلاحية كل النقاط حسب مستوى عضويتك.</li>
        <li>تُستعمل النقاط عند الدفع في المكتب، حتى 20% من الفاتورة (100 نقطة = <bdi>1$</bdi>).</li>
        <li>لا تُقبل دعوة نفسك أو الحسابات المكررة. يحق للمكتب إلغاء أي دعوة مخالفة وخصم ما أُعطي منها.</li>
      </ol>
      <Link to="/points" className="iv-terms__link">نقاطي وسجلها</Link>
    </details>
  );

  return page(
    <>
      <h1 className="iv-title">ادعُ صديقك</h1>
      {label}
      {sendRow}
      {/* Someone with friends sees what they earned first; someone new, how it works */}
      {hasFriends ? <>{earnings}{friends}{route}{how}</> : <>{how}{friends}{route}</>}
      {terms}
    </>,
  );
};

export default InvitePage;
