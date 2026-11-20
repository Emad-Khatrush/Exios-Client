import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CalendarClock, Check, ChevronDown, Gift, Lock, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import api from '../../api';
import { dateText } from '../ClientOrders/orderUtils';
import LevelEmblem from './LevelEmblem';
import { LoyaltyLevel, LoyaltyTier } from './loyaltyTypes';
import { pointsText } from './pointsFormat';

// "×1.25" without trailing zeros
const timesText = (m: number) => `×${Number(m || 1).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// The customer's level: its emblem and name in the level's colour, then one line from 0 to the next
// level with where the level is secured for another year (70% of its points), and under it until
// when the membership runs and what happens then (kept, renewed or lowered), and what the next
// level brings
// offer: a running points offer higher than the level (what this customer earns now, and on what)
export const LevelCard = ({ level, tiers, offer }: { level: LoyaltyLevel, tiers: LoyaltyTier[], offer?: { pct: number, cover: string } }) => {
  const next = level.next;
  const nextTier = next ? tiers.find((t) => t.key === next.key) : undefined;
  return (
    <section className="pt-level" style={{ ['--lv' as any]: level.color, ['--nx' as any]: nextTier?.color || level.color }} aria-label="عضويتك">
      <div className="pt-level__top">
        <span className="pt-level__label">عضويتك</span>
        {offer ? (
          <span className="pt-level__times is-offer" title={`على ${offer.cover}`}>
            نقاطك <s><bdi dir="ltr">{timesText(level.multiplier)}</bdi></s> ← 🔥 <bdi dir="ltr">{timesText(offer.pct / 100)}</bdi> الآن مع العرض
          </span>
        ) : (
          <span className="pt-level__times" title="نقاطك تُضاعف بهذه النسبة">نقاطك <bdi dir="ltr">{timesText(level.multiplier)}</bdi></span>
        )}
      </div>
      {offer && <p className="pt-level__offer">العرض على {offer.cover}، وباقي طلبياتك بعضويتك.</p>}
      <div className="pt-level__id">
        <LevelEmblem levelKey={level.level} rank={level.rank} size={72} className="pt-level__emblem" />
        <p className="pt-level__name">{level.name}</p>
      </div>
      <LevelLine level={level} tiers={tiers} />
      <Membership level={level} tiers={tiers} />
      {next && <NextGains level={level} next={next} nextTier={nextTier} />}
    </section>
  );
};

// Where a mark sits on the line, as a share of it (0 to 100)
const at = (value: number, end: number) => Math.min(100, Math.max(0, (value / Math.max(end, 1)) * 100));
// A label near either end of the line is anchored to that end, so it never leaves the card. `room`:
// how close to an end a label may be centred (a long label needs more, a short one less)
const edge = (pct: number, room = 14) => (pct < room ? ' is-start' : pct > 100 - room ? ' is-end' : '');

// One line from 0 to the next level (to this level at the top): the points of the last 12 months
// fill it, a shield marks where this level is secured for another year, this level's own stamp
// where it starts, and the next level's stamp waits at the end
const LevelLine = ({ level, tiers }: { level: LoyaltyLevel, tiers: LoyaltyTier[] }) => {
  const tier = tiers[level.rank];
  const next = level.next;
  const end = next ? next.min : Math.max(tier?.min || 0, level.points, 1);
  const you = at(level.points, end);
  const keep = level.keep;
  const keepAt = keep ? at(keep.min, end) : null;
  const startAt = level.rank > 0 && tier ? at(tier.min, end) : null;
  const kept = !!keep && level.points >= keep.min;
  return (
    <div className="pt-line">
      <div className="pt-line__row">
        <div className="pt-line__rail" role="progressbar" aria-valuemin={0} aria-valuemax={end} aria-valuenow={level.points}
          aria-label={`${pointsText(level.points)} نقطة في آخر 12 شهراً${keep ? `، ضمان المستوى عند ${pointsText(keep.min)}` : ''}${next ? `، ${next.name} عند ${pointsText(next.min)}` : ''}`}>
          <div className="pt-line__track" aria-hidden><span className="pt-line__fill" style={{ ['--to' as any]: `${you}%` }} /></div>
          {keepAt !== null && keep && (
            <span className={`pt-line__pin is-keep${kept ? ' is-done' : ''}${edge(keepAt, 34)}`} style={{ ['--at' as any]: `${keepAt}%` }} aria-hidden>
              <span className="pt-line__flag">
                {kept ? <Check size={13} strokeWidth={3} /> : <ShieldCheck size={13} />}
                ضمان عضويتك <bdi dir="ltr" className="pt-num">{pointsText(keep.min)}</bdi> نقطة
              </span>
              <span className="pt-line__tick" />
            </span>
          )}
          {startAt !== null && tier && (
            <span className={`pt-line__pin is-level${edge(startAt)}`} style={{ ['--at' as any]: `${startAt}%` }} aria-hidden>
              <span className="pt-line__tick" />
              <span className="pt-line__under"><LevelEmblem levelKey={tier.key} rank={tier.rank} size={18} />{tier.name}</span>
            </span>
          )}
          <span className="pt-line__you" style={{ ['--at' as any]: `${you}%` }} aria-hidden />
        </div>
        {next && (
          <span className="pt-next__goal pt-line__goal" title={`${next.name}: ${pointsText(next.min)} نقطة`}>
            <LevelEmblem levelKey={next.key} rank={level.rank + 1} size={44} />
          </span>
        )}
      </div>
      <p className="pt-line__legend">
        <span>نقاطك في آخر 12 شهراً: <b><bdi dir="ltr" className="pt-num">{pointsText(level.points)}</bdi></b></span>
        {next && <span>{next.name} عند <bdi dir="ltr" className="pt-num">{pointsText(next.min)}</bdi></span>}
      </p>
    </div>
  );
};

// Until when the membership runs, and what happens then: secured for another year, or lowered one
// level unless the shield is reached; and how far the next level is
const Membership = ({ level, tiers }: { level: LoyaltyLevel, tiers: LoyaltyTier[] }) => {
  const keep = level.keep;
  const below = level.rank > 0 ? tiers[level.rank - 1] : undefined;
  const until = level.reviewAt ? dateText(level.reviewAt) : '';
  const kept = !!keep && keep.remaining === 0;
  // The last 30 days before the review: the warning is stronger
  const soon = !!level.review;
  return (
    <div className="pt-member">
      {level.byOffice && (
        <p className="pt-member__row pt-member__office">
          <BadgeCheck size={17} aria-hidden />
          <span>رُفعت عضويتك إلى <b>{level.name}</b> من المكتب، لذلك نقاطك الآن أقل من حدّ المستوى.{keep && keep.remaining > 0 ? <> لتبقى فيه، اكسب ما ينقص قبل موعد المراجعة.</> : null}</span>
        </p>
      )}
      {keep && until && (
        <p className="pt-member__row">
          <CalendarClock size={17} aria-hidden />
          <span>عضويتك في <b>{level.name}</b> سارية حتى <b>{until}</b></span>
        </p>
      )}
      {keep && (kept ? (
        <p className="pt-member__state is-ok">
          <ShieldCheck size={18} aria-hidden />
          <span>ضمنت <b>{level.name}</b>{until ? <> لسنة أخرى بعد {until}</> : null}. استمر في طلبياتك لتصل للمستوى التالي.</span>
        </p>
      ) : (
        <p className={`pt-member__state${soon ? ' is-urgent' : ''}`}>
          <TriangleAlert size={18} aria-hidden />
          <span>
            اكسب <b><bdi dir="ltr" className="pt-num">{pointsText(keep.remaining)}</bdi></b> نقطة{until ? <> قبل {until}</> : null} لتضمن <b>{level.name}</b> لسنة أخرى.
            {below && <> إن لم تصلها، تنزل عضويتك إلى <b>{below.name}</b>.</>}
          </span>
        </p>
      ))}
      {level.next ? (
        <p className="pt-level__next">
          باقي <bdi dir="ltr" className="pt-num">{pointsText(level.next.remaining)}</bdi> نقطة وتصير <b className="pt-next__name">{level.next.name}</b>
        </p>
      ) : (
        <p className="pt-level__next pt-level__top-note">وصلت أعلى مستوى. شكراً لثقتك بنا.</p>
      )}
    </div>
  );
};

// What the next level brings: its perks this level does not have
const NextGains = ({ level, next, nextTier }: { level: LoyaltyLevel, next: NonNullable<LoyaltyLevel['next']>, nextTier?: LoyaltyTier }) => {
  const gains = nextTier ? nextTier.perks.filter((perk) => !level.perks.includes(perk)) : [];
  if (!gains.length) return null;
  return (
    <div className="pt-next pt-next__gains">
      <p className="pt-next__title"><Sparkles size={16} aria-hidden /> في {next.name} تحصل على</p>
      <ul>
        {gains.map((perk, i) => (
          <li key={perk} style={{ ['--i' as any]: i }}><span className="pt-next__tick" aria-hidden><Check size={12} strokeWidth={3} /></span>{perk}</li>
        ))}
      </ul>
    </div>
  );
};

// Every level as a stop on a route, from the first up: stops passed are filled, the customer's is
// open with its perks, the next ones are locked with what they bring
export const LevelRoute = ({ tiers, level }: { tiers: LoyaltyTier[], level: LoyaltyLevel }) => {
  const [open, setOpen] = useState<string>(level.level);
  return (
    <section className="pt-card" aria-labelledby="pt-levels">
      <h2 id="pt-levels">المستويات</h2>
      <p className="pt-levels__intro">كل نقطة تكسبها من طلبياتك تقرّبك من المستوى التالي. كل مستوى يحسب ما كسبته في آخر 12 شهراً.</p>
      <ol className="pt-route">
        {tiers.map((tier) => {
          const state = tier.rank < level.rank ? 'passed' : tier.rank === level.rank ? 'current' : 'ahead';
          const isOpen = open === tier.key;
          return (
            <li key={tier.key} className={`pt-stop is-${state}`} style={{ ['--lv' as any]: tier.color }}>
              <span className="pt-stop__dot" aria-hidden>
                <LevelEmblem levelKey={tier.key} rank={tier.rank} size={34} locked={state === 'ahead'} />
                {state === 'ahead' && <span className="pt-stop__lock"><Lock size={9} strokeWidth={3} /></span>}
              </span>
              <button type="button" className="pt-stop__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : tier.key)}>
                <span className="pt-stop__name">
                  {tier.name}
                  {state === 'current' && <span className="pt-stop__you">أنت هنا</span>}
                </span>
                <span className="pt-stop__min">
                  {tier.min > 0 ? <><bdi dir="ltr" className="pt-num">{pointsText(tier.min)}</bdi> نقطة</> : 'البداية'}
                </span>
                <ChevronDown size={18} aria-hidden className="pt-stop__chev" />
              </button>
              {isOpen && (
                <ul className="pt-stop__perks">
                  {tier.perks.map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

// Shown once when the customer reached a new level: its name, gift and first perks. Closing it
// tells the server the level was celebrated.
export const LevelCelebration = ({ level, tier, onClose }: { level: LoyaltyLevel, tier?: LoyaltyTier, onClose: () => void }) => {
  const button = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => { button.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const close = () => {
    if (closing) return;
    setClosing(true);
    api.markLevelSeen().catch(() => undefined).finally(onClose);
  };
  return (
    <div className="pt-celebrate" role="dialog" aria-modal="true" aria-labelledby="pt-celebrate-title" onClick={close}>
      <div className="pt-celebrate__card" style={{ ['--lv' as any]: level.color }} onClick={(e) => e.stopPropagation()}>
        <span className="pt-celebrate__icon" aria-hidden>
          <span className="pt-celebrate__rays" />
          <LevelEmblem levelKey={level.level} rank={level.rank} size={112} />
        </span>
        <p className="pt-celebrate__kicker">مبروك! صرت</p>
        <h2 id="pt-celebrate-title" className="pt-celebrate__name">{level.name}</h2>
        {tier && tier.upgradeGift > 0 && (
          <p className="pt-celebrate__gift"><Gift size={18} aria-hidden /> أضفنا لك <bdi dir="ltr" className="pt-num">{pointsText(tier.upgradeGift)}</bdi> نقطة هدية</p>
        )}
        <ul className="pt-celebrate__perks">
          {level.perks.slice(0, 4).map((perk) => <li key={perk}><Check size={15} aria-hidden /> {perk}</li>)}
        </ul>
        <button ref={button} type="button" className="pt-btn" onClick={close} disabled={closing}>رائع</button>
      </div>
    </div>
  );
};
