import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Check, Copy, Gift, HandCoins, RefreshCw, Repeat, Share2, Trophy, UserPlus, Users } from 'lucide-react';
import { TbBrandWhatsapp } from 'react-icons/tb';
import api from '../../api';
import { useCopy } from '../../utils/useCopy';
import { Friend, Referrals, friendStatusText, headline, nextStepText, pointsNum, shareMessage, usd } from './referralText';
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
  const progress = Math.min(data.qualified / top.friends, 1);
  // An ambassador earns the higher share from then on
  const sharePoints = data.ambassadorAt ? data.ambassadorSharePoints : data.sharePoints;

  return page(
    <>
      <header className="iv-hero">
        <span className="iv-hero__icon" aria-hidden><UserPlus size={26} /></span>
        {data.ambassadorAt && <span className="iv-amb"><Award size={16} aria-hidden /> {data.ambassadorTitle} · {data.ambassadorSharePoints} نقطة عن كل {data.sharePerUsd}$</span>}
        <h1>{headline(data.firstPoints)}</h1>
        <p>صديقك يأخذ هدية {usd(data.welcomePoints)}، وأنت تكسب {usd(data.firstPoints)} عندما يصل مجموع ما يدفعه {data.qualifyUsd}$ ولو على عدة طلبيات، ثم {sharePoints} نقاط عن كل {data.sharePerUsd}$ يدفعها لمدة {data.months} شهراً.</p>

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
        <ol className="iv-how">
          <li><span aria-hidden><Share2 size={20} /></span><div><b>أرسل رابطك لصديق</b><small>على واتساب، أو أعطه كودك ليكتبه عند التسجيل</small></div></li>
          <li><span aria-hidden><Gift size={20} /></span><div><b>صديقك يأخذ {usd(data.welcomePoints)} هدية</b><small>{pointsNum(data.welcomePoints)} نقطة لأول فاتورة شحن أو شراء</small></div></li>
          <li><span aria-hidden><HandCoins size={20} /></span><div><b>تكسب {usd(data.firstPoints)}</b><small>عندما يصل مجموع ما يدفعه صديقك {data.qualifyUsd}$</small></div></li>
          <li><span aria-hidden><Repeat size={20} /></span><div><b>ثم {sharePoints} نقاط عن كل {data.sharePerUsd}$</b><small>من كل ما يدفعه صديقك لمدة سنة، وترفع عضويتك</small></div></li>
        </ol>
      </section>

      <section className="iv-card" aria-labelledby="iv-steps">
        <div className="iv-card__head">
          <h2 id="iv-steps"><Trophy size={19} aria-hidden /> مكافآت إضافية</h2>
          <span className="iv-pill">{data.qualified} {data.qualified === 1 ? 'صديق' : 'أصدقاء'} · <bdi dir="ltr">{pointsNum(data.friendsPaidUsd)}$</bdi></span>
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

      <section className="iv-card" aria-labelledby="iv-friends">
        <div className="iv-card__head">
          <h2 id="iv-friends"><Users size={19} aria-hidden /> أصدقائي</h2>
          {data.totalPoints > 0 && <span className="iv-pill iv-pill--gold">كسبت {pointsNum(data.totalPoints)} نقطة</span>}
        </div>
        {!data.friends.length ? (
          <p className="iv-empty">لم يسجّل أحد بدعوتك بعد. أرسل رابطك لأول صديق الآن.</p>
        ) : (
          <ul className="iv-friends">
            {data.friends.map((f: Friend) => {
              const status = friendStatusText(f, data.qualifyUsd);
              return (
                <li key={f.id}>
                  <span className="iv-friends__avatar" aria-hidden>{f.name.charAt(0)}</span>
                  <span className="iv-friends__main">
                    <b>{f.name}</b>
                    <small className={`is-${status.tone}`}>{status.text}</small>
                    <small>سجّل {dayText(f.joinedAt)}</small>
                  </span>
                  {f.points > 0 && <em className="iv-friends__pts"><bdi dir="ltr">+{pointsNum(f.points)}</bdi></em>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="iv-fine">تُحسب المكافأة من طلبيات صديقك المدفوعة فعلاً. لا تُقبل دعوة نفسك أو حسابات مكررة، ويحق للمكتب إلغاء أي دعوة مخالفة. <Link to="/points">نقاطي</Link></p>
    </>,
  );
};

export default InvitePage;
