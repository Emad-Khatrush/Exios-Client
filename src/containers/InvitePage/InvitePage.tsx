import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Check, ChevronDown, ChevronLeft, Copy, Crown, Gift, HandCoins, RefreshCw, Repeat, ScrollText, Share2, Trophy, UserPlus, Users } from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { useCopy } from '../../utils/useCopy';
import { Friend, Referrals, SIGNUP_GIFT_POINTS, waitingText, friendStatusText, headline, nextStepText, pointsNum, pointsPhrase, shareMessage, usd } from './referralText';
import './invite.css';

const dayText = (d: string) => new Date(d).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });

/* «ادعُ أصدقاءك»: the customer's code and link, a WhatsApp button with a ready message, the ladder of
   extra rewards and every friend with where they stand. Rewards (spec 2026-11-20): the friend gets a
   welcome gift; the inviter a big reward once the friend has paid $50, then a share for a year. */
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
        <button type="button" className="iv-btn iv-btn--ghost" onClick={load}><RefreshCw size={16} aria-hidden /> إعادة المحاولة</button>
      </div>,
    );
  }
  if (!data) return page(<div className="iv-sk" aria-busy="true" />);
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
  const next = nextStepText(data.qualified, data.friendsPaidUsd, data.steps);
  const top = data.steps[data.steps.length - 1];
  // The step that makes an ambassador (the last one)
  const amb = data.steps.find((s) => s.ambassador);
  const progress = Math.min(data.qualified / top.friends, 1);
  // An ambassador earns the higher share from then on
  const sharePoints = data.ambassadorAt ? data.ambassadorSharePoints : data.sharePoints;

  return page(
    <>
      <header className="iv-hero">
        <span className="iv-hero__icon" aria-hidden><UserPlus size={26} /></span>
        {/* Each part isolated: the Latin name and the numbers no longer swap places with the Arabic */}
        {data.ambassadorAt && (
          <span className="iv-amb">
            <Crown size={16} aria-hidden />
            <span><bdi>{data.ambassadorTitle}</bdi></span>
            <span className="iv-amb__sep" aria-hidden />
            <span><bdi>{pointsPhrase(data.ambassadorSharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi></span>
          </span>
        )}
        <h1>{headline(data.firstPoints)}</h1>
        <p>صديقك يأخذ هدية {usd(data.welcomePoints)}، وأنت تكسب {usd(data.firstPoints)} عندما يصل مجموع ما يدفعه {data.qualifyUsd}$ ولو على عدة طلبيات، ثم <bdi>{pointsPhrase(sharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi> يدفعها لمدة {data.months} شهراً.</p>

        <div className="iv-code">
          <span>كود دعوتك</span>
          <b dir="ltr">{data.code}</b>
          <button type="button" onClick={() => copy('code', data.code)} aria-label="انسخ الكود">
            {copied === 'code' ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          </button>
        </div>

        <div className="iv-actions">
          <a className="iv-btn iv-btn--wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
            <TbBrandWhatsapp size={22} aria-hidden /> أرسل الدعوة على واتساب
          </a>
          <div className="iv-actions__row">
            <button type="button" className="iv-btn iv-btn--ghost" onClick={() => copy('link', link)}>
              {copied === 'link' ? <><Check size={17} aria-hidden /> نُسخ الرابط</> : <><Copy size={17} aria-hidden /> انسخ الرابط</>}
            </button>
            {canShare && <button type="button" className="iv-btn iv-btn--ghost" onClick={share}><Share2 size={17} aria-hidden /> مشاركة</button>}
          </div>
        </div>
      </header>

      <section className="iv-card" aria-labelledby="iv-how">
        <h2 id="iv-how">كيف تكسب؟</h2>
        <ol className="iv-how" dir="rtl">
          <li><span aria-hidden><Share2 size={20} /></span><div><b>أرسل رابطك لصديق</b><small>على واتساب، أو أعطه كودك ليكتبه عند التسجيل</small></div></li>
          <li><span aria-hidden><Gift size={20} /></span><div><b>صديقك يأخذ <bdi>{usd(data.welcomePoints)}</bdi> هدية</b><small>{pointsNum(data.welcomePoints)} نقطة لأول فاتورة شحن أو شراء</small></div></li>
          <li><span aria-hidden><HandCoins size={20} /></span><div><b>تكسب <bdi>{usd(data.firstPoints)}</bdi></b><small>عندما يصل مجموع ما يدفعه صديقك <bdi>{data.qualifyUsd}$</bdi></small></div></li>
          <li><span aria-hidden><Repeat size={20} /></span><div><b>ثم <bdi>{pointsPhrase(sharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi></b><small>من كل ما يدفعه صديقك لمدة سنة، وترفع عضويتك</small></div></li>
        </ol>
      </section>

      <section className="iv-card" aria-labelledby="iv-steps">
        <div className="iv-card__head">
          <h2 id="iv-steps"><Trophy size={19} aria-hidden /> مكافآت إضافية</h2>
          <span className="iv-pill">{data.qualified} {data.qualified === 1 ? 'صديق' : 'أصدقاء'}{data.friendsPaidUsd !== null && <> · <bdi dir="ltr">{pointsNum(data.friendsPaidUsd)}$</bdi></>}</span>
        </div>
        <div className="iv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={top.friends} aria-valuenow={Math.min(data.qualified, top.friends)}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <ul className="iv-steps">
          {data.steps.map((s) => (
            <li key={s.friends} className={s.reached ? 'is-on' : ''}>
              <span className="iv-steps__n">{s.reached ? <Check size={15} strokeWidth={3} aria-hidden /> : s.friends}</span>
              <span><b>{s.friends} أصدقاء</b><small>ومدفوعاتهم {pointsNum(s.usd)}$</small><small className="iv-steps__pts">+{pointsNum(s.points)} نقطة{s.title ? ` · لقب «${s.title}»` : ''}</small>{s.ambassador && <small className="iv-steps__amb">وحصتك تصير {data.ambassadorSharePoints} نقطة عن كل {data.sharePerUsd}$</small>}</span>
            </li>
          ))}
        </ul>
        {next && <p className="iv-next">{next}</p>}
      </section>

      {amb && (
        <section className={`iv-card iv-ambcard${data.ambassadorAt ? ' is-on' : ''}`} aria-labelledby="iv-amb-title">
          <div className="iv-ambcard__head">
            <span className="iv-ambcard__icon" aria-hidden><Crown size={26} /></span>
            <div>
              <h2 id="iv-amb-title">{data.ambassadorAt ? <>مبروك، أنت <bdi>{data.ambassadorTitle}</bdi></> : <>لقب «<bdi>{data.ambassadorTitle}</bdi>»</>}</h2>
              <p>{data.ambassadorAt
                ? <>حصلت عليه في {new Date(data.ambassadorAt).toLocaleDateString('ar-LY-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}. شكراً لأنك تنشر Exios.</>
                : 'أعلى درجة في الدعوات، لمن يجلب لنا عملاء حقيقيين.'}</p>
            </div>
          </div>
          {data.ambassadorAt ? (
            <>
              <h3>مميزاتك الآن</h3>
              <ul className="iv-list">
                <li><Repeat size={16} aria-hidden /><span>حصتك <b><bdi>{pointsPhrase(data.ambassadorSharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi></b> يدفعها أصدقاؤك، بدل <bdi>{pointsPhrase(data.sharePoints)}</bdi></span></li>
                <li><Gift size={16} aria-hidden /><span>حصلت على مكافأة <b><bdi>{pointsPhrase(amb.points)}</bdi></b> (<bdi dir="ltr">{usd(amb.points)}</bdi>)</span></li>
                <li><BadgeCheck size={16} aria-hidden /><span>شارة «<bdi>{data.ambassadorTitle}</bdi>» بجانب اسمك في التطبيق، ويراها موظفو المكتب</span></li>
              </ul>
            </>
          ) : (
          <>
          <h3>كيف تحصل عليه؟</h3>
          <ul className="iv-list">
            <li><Check size={16} aria-hidden /><span><b>{amb.friends} أصدقاء</b> وصل مجموع ما دفعه كل واحد منهم <bdi>{data.qualifyUsd}$</bdi></span></li>
            <li><Check size={16} aria-hidden /><span>ومجموع ما دفعه كل أصدقائك معاً <b><bdi>{pointsNum(amb.usd)}$</bdi></b></span></li>
          </ul>
          <h3>ماذا تستفيد؟</h3>
          <ul className="iv-list">
            <li><Repeat size={16} aria-hidden /><span>حصتك ترتفع من <bdi>{pointsPhrase(data.sharePoints)}</bdi> إلى <b><bdi>{pointsPhrase(data.ambassadorSharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi></b> يدفعها أصدقاؤك، من يوم حصولك على اللقب</span></li>
            <li><Gift size={16} aria-hidden /><span>مكافأة <b><bdi>{pointsPhrase(amb.points)}</bdi></b> (<bdi dir="ltr">{usd(amb.points)}</bdi>) مرة واحدة</span></li>
            <li><BadgeCheck size={16} aria-hidden /><span>شارة «<bdi>{data.ambassadorTitle}</bdi>» بجانب اسمك في التطبيق، ويراها موظفو المكتب</span></li>
          </ul>
          </>
          )}
        </section>
      )}

      <section className="iv-card" aria-labelledby="iv-friends">
        <div className="iv-card__head">
          <h2 id="iv-friends"><Users size={19} aria-hidden /> أصدقائي <Link to="/invite/history" className="iv-history-link">السجل الكامل</Link></h2>
          {(data.totalPoints > 0 || data.heldPoints > 0) && (
            <span className="iv-pills">
              {data.totalPoints > 0 && <span className="iv-pill iv-pill--gold">كسبت {pointsNum(data.totalPoints)} نقطة</span>}
              {/* Some may wait for a passport or the office's review, not only the 24 hours: «بعد 24 ساعة» only when none does */}
              {data.heldPoints > 0 && <span className="iv-pill iv-pill--wait">{pointsNum(data.heldPoints)} {data.friends.some((f: Friend) => f.heldPoints > 0 && f.waiting) ? 'نقطة معلّقة' : `بعد ${data.holdHours} ساعة`}</span>}
            </span>
          )}
        </div>
        {!data.friends.length ? (
          <p className="iv-empty">لم يسجّل أحد بدعوتك بعد. أرسل رابطك لأول صديق الآن.</p>
        ) : (
          <ul className="iv-friends">
            {data.friends.map((f: Friend, i: number) => {
              const status = friendStatusText(f, data.qualifyUsd);
              return (
                <li key={f.id} style={{ ['--iv-d' as any]: `${Math.min(i, 10) * 45}ms` }}>
                  <Link to={`/invite/history?friend=${f.id}`} className="iv-friends__link" aria-label={`ما كسبته من ${f.name}`}>
                  <span className="iv-friends__avatar" aria-hidden>{f.name.charAt(0)}</span>
                  <span className="iv-friends__main">
                    <b>{f.name}</b>
                    <small className={`is-${status.tone}`}>{status.text}</small>
                    {waitingText(f.waiting) && <small className="is-wait">{waitingText(f.waiting)}</small>}
                    <small>سجّل {dayText(f.joinedAt)}</small>
                  </span>
                  {(f.points > 0 || f.heldPoints > 0) && (
                    <span className="iv-friends__side">
                      {f.points > 0 && <em className="iv-friends__pts"><bdi dir="ltr">+{pointsNum(f.points)}</bdi></em>}
                      {f.heldPoints > 0 && <small className="iv-friends__held"><bdi dir="ltr">+{pointsNum(f.heldPoints)}</bdi> {f.waiting ? 'معلّقة' : `بعد ${data.holdHours} ساعة`}</small>}
                    </span>
                  )}
                  <ChevronLeft size={18} aria-hidden className="iv-friends__go" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <details className="iv-card iv-terms">
        <summary><ScrollText size={19} aria-hidden /> <span>الشروط والتفاصيل</span> <ChevronDown size={18} aria-hidden className="iv-terms__chev" /></summary>
        <ol>
          <li>صديقك يحصل على <bdi>{pointsNum(data.welcomePoints)}</bdi> نقطة (<bdi>{usd(data.welcomePoints)}</bdi>) عندما يسجّل برابطك أو يكتب كودك عند التسجيل، بدل هدية الحساب الجديد (<bdi>{SIGNUP_GIFT_POINTS}</bdi> نقطة)، ولا تجتمع الهديتان. تتفعّل مع أول شحنة له تصل لمخزننا أو أول فاتورة شراء خلال 90 يوماً من التسجيل، وإلا تسقط.</li>
          <li>إذا نسي صديقك الكود، يستطيع المكتب إضافته خلال 7 أيام من فتح حسابه فقط.</li>
          <li>تكسب <bdi>{pointsNum(data.firstPoints)}</bdi> نقطة (<bdi>{usd(data.firstPoints)}</bdi>) عندما يصل مجموع ما دفعه صديقك <bdi>{data.qualifyUsd}$</bdi>، ولو على عدة طلبيات.</li>
          <li>من تلك اللحظة ولمدة {data.months} شهراً تكسب <bdi>{pointsPhrase(data.sharePoints)}</bdi> عن كل <bdi dir="ltr">{data.sharePerUsd}$</bdi> يدفعها صديقك (<bdi>{pointsPhrase(data.ambassadorSharePoints)}</bdi> إذا كنت سفيراً). نقاط صديقك لا تنقص شيئاً.</li>
          <li>كل مكافأة من الدعوة تُضاف لرصيدك بعد {data.holdHours} ساعة من دفع صديقك. إذا عُدّلت طلبيته أو أُلغيت خلالها تُلغى المكافأة، وإذا أُلغيت بعد إضافتها تُسحب.</li>
          <li>تُعطى مكافآت صديقك بعد توثيق جوازه في المكتب. وقد تراجع الإدارة الدعوة قبل إعطاء مكافآتها، والمكافآت الإضافية تُعطى بعد موافقة المكتب.</li>
          <li>المكافآت الإضافية تحتاج الشرطين معاً: عدد الأصدقاء الذين وصلوا <bdi>{data.qualifyUsd}$</bdi>، ومجموع ما دفعه كل أصدقائك: {data.steps.map((s) => `${s.friends} أصدقاء و${pointsNum(s.usd)}$ = ${pointsNum(s.points)} نقطة`).join('، ')}. كل مكافأة مرة واحدة.</li>
          <li>يُحسب ما يدفعه صديقك من فواتير الشحن والشراء المدفوعة بالكامل (والشحن بعد استلام الطرد). الطلبيات الملغاة لا تُحسب، وحوالات Alipay تُحسب بنصف قيمتها.</li>
          <li>حصتك من أصدقائك فقط ترفع عضويتك، مثل نقاط شحنك. مكافأة <bdi>{data.qualifyUsd}$</bdi> والمكافآت الإضافية نقاط للاستعمال فقط ولا تُحسب في العضوية. صلاحية كل النقاط حسب مستوى عضويتك.</li>
          <li>تُستعمل النقاط عند الدفع في المكتب، حتى 20% من الفاتورة (100 نقطة = <bdi>1$</bdi>).</li>
          <li>لا تُقبل دعوة نفسك أو الحسابات المكررة. يحق للمكتب إلغاء أي دعوة مخالفة وخصم ما أُعطي منها.</li>
          <li>«ادعُ صديقك» برنامج تجريبي، ويحق للشركة تعديل مكافآته أو إيقافه أو إنهاؤه في أي وقت إذا رأت أنه لم يحقق الغرض منه. من تاريخ الإيقاف لا تُكسب مكافآت جديدة، وما لم يُضف لرصيدك بعد يسقط، وما أُضيف يُعامل حسب شروط النقاط.</li>
        </ol>
        <Link to="/points" className="iv-terms__link">نقاطي وسجلها</Link>
      </details>
    </>,
  );
};

export default InvitePage;
