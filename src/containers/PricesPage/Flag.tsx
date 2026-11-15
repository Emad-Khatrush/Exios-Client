// Small inline flags for the countries we ship from (and Libya, where everything arrives). Inline
// SVG rather than emoji: Windows draws flag emoji as two letters.
import { Globe2 } from 'lucide-react';

// A five-pointed star's points around (cx, cy), the first point at `angle` degrees from straight up
const star = (cx: number, cy: number, r: number, angle = 0) => Array.from({ length: 10 }, (_, i) => {
  const a = ((angle + i * 36) * Math.PI) / 180;
  const radius = i % 2 ? r * 0.382 : r;
  return `${(cx + radius * Math.sin(a)).toFixed(2)},${(cy - radius * Math.cos(a)).toFixed(2)}`;
}).join(' ');

const FLAGS: Record<string, JSX.Element> = {
  china: (
    <>
      <rect width="30" height="20" fill="#DE2910" />
      <polygon points={star(5, 5, 3)} fill="#FFDE00" />
      <polygon points={star(10, 2, 1, 23)} fill="#FFDE00" />
      <polygon points={star(12, 4, 1, 45)} fill="#FFDE00" />
      <polygon points={star(12, 7, 1, 70)} fill="#FFDE00" />
      <polygon points={star(10, 9, 1, 20)} fill="#FFDE00" />
    </>
  ),
  uae: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.67" fill="#00732F" />
      <rect y="13.33" width="30" height="6.67" fill="#000" />
      <rect width="7.5" height="20" fill="#FF0000" />
    </>
  ),
  turkey: (
    <>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="11" cy="10" r="5" fill="#fff" />
      <circle cx="12.25" cy="10" r="4" fill="#E30A17" />
      <polygon points={star(17, 10, 2.1, -90)} fill="#fff" />
    </>
  ),
  usa: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />)}
      <rect width="13" height={(7 * 20) / 13} fill="#3C3B6E" />
      {[0, 1, 2, 3].flatMap((row) => [0, 1, 2, 3, 4].map((col) => (
        <circle key={`${row}-${col}`} cx={1.6 + col * 2.45 + (row % 2) * 1.2} cy={1.5 + row * 2.45} r="0.5" fill="#fff" />
      )))}
    </>
  ),
  uk: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth="6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.6" />
    </>
  ),
  libya: (
    <>
      <rect width="30" height="20" fill="#000" />
      <rect width="30" height="5" fill="#E70013" />
      <rect y="15" width="30" height="5" fill="#239E46" />
      <circle cx="14.2" cy="10" r="2.9" fill="#fff" />
      <circle cx="15" cy="10" r="2.35" fill="#000" />
      <polygon points={star(17.3, 10, 1.3, -90)} fill="#fff" />
    </>
  ),
};

// Ports the office is likely to type, to the country whose flag they get
const PORT_COUNTRY: [RegExp, string][] = [
  [/شنغهاي|شانغهاي|نينغبو|نينجبو|شنتشن|شينزين|قوانغتشو|قوانجو|غوانزو|تشينغداو|تشينجداو|شيامن|تيانجين|ييوو|داليان|shanghai|ningbo|shenzhen|guangzhou|qingdao|xiamen|tianjin|dalian|yiwu|الصين/i, 'china'],
  [/إسطنبول|اسطنبول|مرسين|أزمير|ازمير|istanbul|mersin|izmir|ambarli|تركيا/i, 'turkey'],
  [/جبل علي|دبي|الشارقة|jebel ali|dubai|sharjah|الإمارات/i, 'uae'],
  [/طرابلس|مصراتة|بنغازي|الخمس|زوارة|طبرق|tripoli|misrata|misurata|benghazi|khoms|libya|ليبيا/i, 'libya'],
];
export const countryOfPort = (port?: string) => PORT_COUNTRY.find(([re]) => port && re.test(port))?.[1];

const Flag = ({ country, size = 22, className = '' }: { country?: string, size?: number, className?: string }) => {
  const flag = country ? FLAGS[country] : undefined;
  if (!flag) return <Globe2 size={size * 0.8} className={`shrink-0 text-zinc-400 ${className}`} aria-hidden />;
  return (
    <svg
      viewBox="0 0 30 20"
      width={size}
      height={(size * 2) / 3}
      className={`flag shrink-0 ${className}`}
      aria-hidden
      focusable="false"
    >
      {flag}
    </svg>
  );
};

export default Flag;
