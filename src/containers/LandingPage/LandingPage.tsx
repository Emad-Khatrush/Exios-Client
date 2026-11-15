import { useEffect, useRef, useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  TbArrowLeft,
  TbBrandFacebook,
  TbBrandTiktok,
  TbBoxMultiple,
  TbBrandWhatsapp,
  TbBuildingBank,
  TbCash,
  TbContainer,
  TbFileInvoice,
  TbHeadset,
  TbMail,
  TbMapPin,
  TbMenu2,
  TbPackage,
  TbPhone,
  TbPlaneDeparture,
  TbSearch,
  TbShieldCheck,
  TbChevronDown,
  TbShip,
  TbShoppingCart,
  TbWorld,
  TbX,
} from 'react-icons/tb';

import { EMAIL, FACEBOOK_URL, OFFICES as offices, TIKTOK_URL, whatsappLink } from '../../constants/contact';
import logo from '../../../public/images/exios-logo.png';
import portImage from '../../../public/images/landing/port.jpg';
import shipImage from '../../../public/images/landing/ship.jpg';
import warehouseImage from '../../../public/images/landing/warehouse.jpg';
import agreementImage from '../../../public/images/landing/agreement.jpg';
import airImage from '../../../public/images/air-shipping.jpg';

const navLinks = [
  { href: '#services', label: 'خدماتنا' },
  { href: '#how-it-works', label: 'خطوات العمل' },
  { href: '#about', label: 'من نحن' },
  { href: '#faq', label: 'الأسئلة الشائعة' },
  { href: '#contact', label: 'تواصل معنا' },
];

const steps = [
  {
    icon: TbHeadset,
    title: 'تواصل مع مندوب الشركة',
    desc: 'تواصل معنا أو زر مكتبنا، وأعطنا تفاصيل المنتج الذي ترغب في استيراده من أي قطاع تجاري.',
  },
  {
    icon: TbFileInvoice,
    title: 'استلم التكلفة والموافقة',
    desc: 'نبحث عن المنتج في الصين ونقدم لك تكلفة الفاتورة، وتختار طريقة الشحن المناسبة لك مع المدة المتوقعة للوصول.',
  },
  {
    icon: TbPackage,
    title: 'نبدأ تجهيز الطلبية',
    desc: 'بعد موافقتك يتواصل فريق اكسيوس مع المصنع لبدء تجهيز البضائع المطلوبة.',
  },
  {
    icon: TbShip,
    title: 'التحقق والشحن إلى ليبيا',
    desc: 'نزور المصنع ونتحقق من البضائع وسلامتها، ثم نشحنها إلى ليبيا مع تغليف آمن.',
  },
];

const shippingModes = [
  { icon: TbShoppingCart, label: 'الشراء من الصين' },
  { icon: TbPlaneDeparture, label: 'شحن جوي' },
  { icon: TbContainer, label: 'حاوية كاملة FCL' },
  { icon: TbBoxMultiple, label: 'شحن مشترك LCL' },
];

const extraServices = [
  {
    icon: TbShoppingCart,
    title: 'خدمة الشراء من الصين',
    desc: 'نشتري بدلًا عنك من علي بابا والمصانع والمواقع الصينية، ونتواصل مع المورد عنك.',
  },
  {
    icon: TbBuildingBank,
    title: 'الدفع والتحويل للمورد',
    desc: 'نحوّل قيمة البضاعة للمصنع أو المورد في الصين لإتمام الشراء بأمان.',
  },
  {
    icon: TbShieldCheck,
    title: 'التحقق من البضائع قبل الشحن',
    desc: 'نتأكد من سلامة البضاعة والجودة المتفق عليها، ونحميك من الغش أو الكسر.',
  },
  {
    icon: TbCash,
    title: 'أسعار واضحة قبل البدء',
    desc: 'تعرف تكلفة البضاعة والشحن كاملة قبل أن تبدأ، في كل القطاعات: بناء، غذاء، ملابس وغيرها.',
  },
];

// Visible on the page AND sent to Google as FAQPage structured data (keep them in one place).
const faqs = [
  {
    q: 'كيف أشحن بضاعتي من الصين إلى ليبيا؟',
    a: 'افتح حساب في اكسيوس، وستحصل على عنوان مخزننا في الصين للشحن الجوي أو البحري. أرسل بضاعتك إلى هذا العنوان، ونحن نشحنها إلى ليبيا وتتابعها من حسابك حتى تستلمها في طرابلس أو بنغازي.',
  },
  {
    q: 'هل تشترون بدلًا عني من علي بابا والمواقع الصينية؟',
    a: 'نعم. نقدم خدمة الشراء من الصين: نشتري لك من علي بابا والمصانع والمواقع الصينية، وندفع للمورد، ونتحقق من البضاعة قبل شحنها إلى ليبيا.',
  },
  {
    q: 'ما الفرق بين شحن الحاوية الكاملة FCL والشحن المشترك LCL؟',
    a: 'في الحاوية الكاملة FCL تكون الحاوية لبضاعتك وحدك، وهي الأنسب للكميات الكبيرة. في الشحن المشترك LCL تُشحن بضاعتك مع بضائع تجار آخرين وتدفع فقط حسب حجمها بالمتر المكعب.',
  },
  {
    q: 'كيف يتم حساب سعر الشحن من الصين؟',
    a: 'الشحن الجوي يُحسب حسب الوزن بالكيلو، والشحن البحري المشترك حسب الحجم بالمتر المكعب (CBM). الأسعار المحدثة موجودة دائمًا في حسابك.',
  },
  {
    q: 'كيف أتابع شحنتي؟',
    a: 'كل طلبية لها صفحة في حسابك تعرض حالتها: هل تم الدفع، هل شُحنت، ومتى ستصل، مع الصور والتفاصيل.',
  },
  {
    q: 'أين مكاتب اكسيوس في ليبيا؟',
    a: 'لدينا مكتب في طرابلس (باب بن غشير) ومكتب في بنغازي (الهواري)، ويمكنك التواصل مع أي مكتب مباشرة على واتساب.',
  },
];

const faqJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
});

// Offices, numbers and links live in constants/contact.ts, shared with the in-app contact page

/** Fades its content up once it scrolls into view (skipped under reduced motion via CSS). */
const Reveal = ({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const isLoggedIn = useSelector((state: any) => state.session.isLoggedIn);
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryCta = isLoggedIn
    ? { to: '/home', label: 'حسابي' }
    : { to: '/signup', label: 'افتح حساب' };

  return (
    <div dir="rtl" className="min-h-full bg-white text-right text-zinc-900 antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#top" className="flex items-center gap-2">
            <img src={logo} alt="اكسيوس" className="h-9 w-auto" />
          </a>

          <ul className="hidden items-center gap-8 text-sm font-semibold text-zinc-600 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-green-700">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            {!isLoggedIn && (
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-green-700">
                تسجيل الدخول
              </Link>
            )}
            <Link
              to={primaryCta.to}
              className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-800 active:scale-[0.98]"
            >
              {primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            className="rounded-full p-2 text-zinc-700 lg:hidden"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <TbX size={26} /> : <TbMenu2 size={26} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 pb-6 pt-2 lg:hidden">
            <ul className="flex flex-col text-base font-semibold text-zinc-700">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="block py-3" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {!isLoggedIn && (
                <Link to="/login" className="rounded-full border border-zinc-300 py-3 text-center text-sm font-bold text-zinc-800">
                  تسجيل الدخول
                </Link>
              )}
              <Link
                to={primaryCta.to}
                className={`rounded-full bg-green-700 py-3 text-center text-sm font-bold text-white ${isLoggedIn ? 'col-span-2' : ''}`}
              >
                {primaryCta.label}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-12">
          <Reveal className="lg:col-span-6">
            <p className="mb-5 text-sm font-bold text-green-700">شركة اكسيوس لخدمات الاستيراد والتصدير</p>
            <h1 className="text-4xl font-extrabold leading-[1.3] tracking-tight md:text-5xl lg:text-[3.4rem]">
              شحن بضائعك من الصين إلى ليبيا، جوًا وبحرًا
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-zinc-600">
              نشتري لك من علي بابا والمصانع الصينية، ونشحن جوًا أو بحرًا بحاوية كاملة أو شحن مشترك حتى طرابلس وبنغازي.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={primaryCta.to}
                className="group inline-flex items-center gap-2 rounded-full bg-green-700 px-7 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(21,128,61,0.6)] transition hover:bg-green-800 active:scale-[0.98]"
              >
                {primaryCta.label}
                <TbArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-base font-bold text-zinc-800 transition hover:border-zinc-400 active:scale-[0.98]"
              >
                تواصل معنا
              </a>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-6" delay={120}>
            <div className="relative">
              <img
                src={portImage}
                alt="سفن شحن محملة بالحاويات في الميناء"
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_30px_60px_-30px_rgba(24,24,27,0.45)] lg:aspect-[5/6]"
              />
              <div className="absolute -bottom-6 right-4 hidden items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_40px_-20px_rgba(24,24,27,0.35)] sm:flex md:right-8">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-700">
                  <TbShieldCheck size={24} />
                </span>
                <div>
                  <p className="text-sm font-bold">نتحقق من البضائع قبل الشحن</p>
                  <p className="text-xs text-zinc-500">من الغش أو الكسر، في المصنع</p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Route strip: China to Libya + the three shipping options */}
        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="flex items-center gap-3 text-lg font-extrabold text-zinc-900">
              الصين
              <TbArrowLeft size={22} className="text-green-700" aria-label="إلى" />
              ليبيا
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-base font-bold text-zinc-700">
              {shippingModes.map((mode) => (
                <li key={mode.label}>
                  <a href="#services" className="inline-flex items-center gap-2 hover:text-green-700">
                    <mode.icon size={22} className="text-green-700" />
                    {mode.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services: shipping options from China + supporting services */}
        <section id="services" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8 md:py-28">
          <Reveal>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              خدماتنا من الصين إلى ليبيا
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-zinc-600">
              ثلاث طرق للشحن، تختار منها حسب حجم بضاعتك وسرعة احتياجك لها.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* FCL */}
            <Reveal className="md:col-span-4 md:row-span-2">
              <article className="relative flex h-full min-h-[440px] flex-col justify-end overflow-hidden rounded-3xl">
                <img src={shipImage} alt="سفينة حاويات في طريقها للميناء" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/35 to-transparent" />
                <div className="relative p-7 text-white md:p-10">
                  <TbContainer size={34} className="mb-4 text-green-300" />
                  <h3 className="text-2xl font-bold md:text-3xl">
                    شحن بحري، حاوية كاملة <span dir="ltr">FCL</span>
                  </h3>
                  <p className="mt-3 max-w-[48ch] leading-relaxed text-zinc-200">
                    حاوية 20 أو 40 قدم لبضاعتك وحدك، تُحمّل من المصنع في الصين وتصل إلى الميناء في ليبيا. الخيار الأنسب للتجار والكميات الكبيرة.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* Air */}
            <Reveal className="md:col-span-2" delay={80}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white">
                <img src={airImage} alt="طائرة شحن فوق صناديق البضائع" className="h-36 w-full object-cover" loading="lazy" />
                <div className="p-7">
                  <TbPlaneDeparture size={30} className="text-green-700" />
                  <h3 className="mt-4 text-xl font-bold">شحن جوي</h3>
                  <p className="mt-2 leading-relaxed text-zinc-600">
                    الأسرع للطلبيات العاجلة والبضائع الخفيفة. السعر حسب الوزن بالكيلو.
                  </p>
                </div>
              </article>
            </Reveal>

            {/* LCL */}
            <Reveal className="md:col-span-2" delay={160}>
              <article className="flex h-full flex-col rounded-3xl bg-green-700 p-7 text-white">
                <TbBoxMultiple size={30} className="text-green-200" />
                <h3 className="mt-6 text-xl font-bold">
                  شحن بحري مشترك <span dir="ltr">LCL</span>
                </h3>
                <p className="mt-2 leading-relaxed text-green-50/90">
                  بضاعتك لا تملأ حاوية؟ نشحنها مع بضائع تجار آخرين، وتدفع فقط حسب حجمها بالمتر المكعب <span dir="ltr">(CBM)</span>.
                </p>
              </article>
            </Reveal>

            {/* Supporting services */}
            <Reveal className="md:col-span-6">
              <article className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white lg:grid-cols-5">
                <img src={warehouseImage} alt="تحميل البضائع في المستودع" className="h-56 w-full object-cover lg:col-span-2 lg:h-full" loading="lazy" />
                <div className="p-7 md:p-10 lg:col-span-3">
                  <h3 className="text-2xl font-bold">خدمات الشراء من الصين، ومعها ما يحمي طلبيتك</h3>
                  <ul className="mt-8 grid gap-7 sm:grid-cols-2">
                    {extraServices.map((service) => (
                      <li key={service.title} className="flex gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
                          <service.icon size={22} />
                        </span>
                        <div>
                          <h4 className="font-bold">{service.title}</h4>
                          <p className="mt-1 leading-relaxed text-zinc-600">{service.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 bg-white py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">خطوات العمل معنا</h2>
                  <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-zinc-600">
                    أربع خطوات من أول تواصل حتى وصول البضاعة إلى ليبيا.
                  </p>
                  <img
                    src={agreementImage}
                    alt="توقيع اتفاق الطلبية"
                    className="mt-10 hidden aspect-[4/3] w-full rounded-3xl object-cover lg:block"
                    loading="lazy"
                  />
                </Reveal>
              </div>
            </div>

            <ol className="relative lg:col-span-7">
              <span aria-hidden="true" className="absolute bottom-6 right-6 top-6 w-px bg-zinc-200" />
              {steps.map((step, index) => (
                <li key={step.title} className="relative pb-10 last:pb-0">
                  <Reveal delay={index * 70} className="flex gap-6">
                    <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700 ring-8 ring-white">
                      <step.icon size={24} />
                    </span>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 max-w-[52ch] leading-relaxed text-zinc-600">{step.desc}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8 md:py-28">
          <Reveal>
            <div className="grid gap-12 rounded-3xl bg-zinc-50 p-8 md:p-14 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <img src={logo} alt="اكسيوس" className="h-12 w-auto" />
                <h2 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">من نحن</h2>
                <p className="mt-5 max-w-[56ch] text-lg leading-loose text-zinc-600">
                  اكسيوس شركة ليبية لخدمات الاستيراد والتصدير. نقدم كل الخدمات اللوجستية التي تضمن التجارة بين المصنع في الصين والمستورد في ليبيا، من الدفع للمصنع والتحقق من البضاعة حتى شحنها وتسليمها لك.
                </p>
              </div>

              <div className="lg:col-span-5">
                <h3 className="text-xl font-bold">أهدافنا</h3>
                <ul className="mt-6 space-y-4">
                  <li className="flex gap-4 rounded-2xl bg-white p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
                      <TbWorld size={22} />
                    </span>
                    <div>
                      <h4 className="font-bold">توسيع التجارة في ليبيا</h4>
                      <p className="mt-1 leading-relaxed text-zinc-600">نفتح للتاجر الليبي باب الاستيراد في كل القطاعات التجارية بدون استثناء.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 rounded-2xl bg-white p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
                      <TbShieldCheck size={22} />
                    </span>
                    <div>
                      <h4 className="font-bold">حماية حقوق المستورد</h4>
                      <p className="mt-1 leading-relaxed text-zinc-600">نقلل مخاطرة التجارة عليك بخدمات تضمن حقك حتى تستلم بضاعتك.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Tracking CTA band */}
        <section className="px-4 md:px-8">
          <Reveal className="mx-auto max-w-7xl">
            <div className="grid gap-8 rounded-3xl bg-green-700 px-7 py-12 text-white md:grid-cols-12 md:items-center md:px-14 md:py-16">
              <div className="md:col-span-8">
                <TbSearch size={30} className="mb-5 text-green-300" />
                <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">تابع طلبيتك لحظة بلحظة</h2>
                <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-green-50/85">
                  من حسابك تعرف إن كانت البضاعة دُفعت، ومتى شُحنت، ومتى ستصل، مع الصور والتفاصيل.
                </p>
              </div>
              <div className="md:col-span-4 md:text-left">
                <Link
                  to={primaryCta.to}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-green-700 transition hover:bg-green-50 active:scale-[0.98]"
                >
                  {primaryCta.label}
                  <TbArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ: native <details> so every answer is in the HTML for crawlers */}
        <section id="faq" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-4 pt-20 md:px-8 md:pt-28">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">الأسئلة الشائعة عن الشحن من الصين</h2>
              <p className="mt-4 max-w-[40ch] text-lg leading-relaxed text-zinc-600">
                لم تجد إجابتك؟ راسل أقرب مكتب لك على واتساب.
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              {faqs.map((item, index) => (
                <Reveal key={item.q} delay={index * 50}>
                  <details className="group border-b border-zinc-200 py-5 first:pt-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <TbChevronDown size={22} className="shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 max-w-[65ch] leading-relaxed text-zinc-600">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8 md:py-28">
          <Reveal>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">تواصل معنا</h2>
            <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-zinc-600">
              زورنا في أحد مكاتبنا، أو راسل المكتب الأقرب لك مباشرة على واتساب.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {offices.map((office, index) => (
              <Reveal key={office.key} delay={index * 80}>
                <article className="h-full rounded-3xl border border-zinc-200 bg-white p-7">
                  <TbMapPin size={28} className="text-green-700" />
                  <h3 className="mt-5 text-xl font-bold">{office.name}</h3>
                  <p className="mt-2 leading-relaxed text-zinc-600">{office.address}</p>
                  <a href={office.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-green-700 hover:underline">
                    <TbMapPin size={16} />
                    الاتجاهات على خرائط Google
                  </a>
                  <ul className="mt-5 space-y-2">
                    {office.phones.map((phone) => (
                      <li key={phone}>
                        <a href={`tel:${phone}`} className="inline-flex items-center gap-2 font-semibold text-zinc-800 hover:text-green-700" dir="ltr">
                          <TbPhone size={18} className="text-zinc-400" />
                          {phone}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={whatsappLink(office.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-5 py-3 font-bold text-white transition hover:bg-green-800 active:scale-[0.98]"
                  >
                    <TbBrandWhatsapp size={22} />
                    واتساب {office.name}
                  </a>
                </article>
              </Reveal>
            ))}

            <Reveal delay={160}>
              <article className="flex h-full flex-col gap-3 rounded-3xl bg-zinc-50 p-7">
                <h3 className="mb-3 text-xl font-bold">راسلنا أو تابعنا</h3>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 font-bold text-zinc-800 transition hover:border-zinc-400 active:scale-[0.98]"
                >
                  <TbMail size={20} />
                  البريد الإلكتروني
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 font-bold text-zinc-800 transition hover:border-zinc-400 active:scale-[0.98]"
                >
                  <TbBrandFacebook size={20} />
                  فيسبوك
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 font-bold text-zinc-800 transition hover:border-zinc-400 active:scale-[0.98]"
                >
                  <TbBrandTiktok size={20} />
                  تيك توك
                </a>
              </article>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="اكسيوس" className="h-8 w-auto" />
            <p className="text-sm text-zinc-500">شركة اكسيوس لخدمات الاستيراد والتصدير</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-zinc-600">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-green-700">{link.label}</a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} Exios</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
