// Phone numbers for sign-up and sign-in: every country, Libya first and the default.
//
// What is sent to the server (and stored on the account as a number):
//   - Libya: the 9-digit national number, as always (912345678). The server's WhatsApp sender
//     (validatePhoneNumber) turns that into 218912345678, exactly as before.
//   - Any other country: the full international number without + (905321234567, 971501234567).
//     The WhatsApp sender leaves numbers that are not Libyan as they are, so it reaches them too.

// ISO code : dialling code. Libya and the countries our customers deal with most come first.
const DIAL = 'LY:218,EG:20,TN:216,TR:90,AE:971,SA:966,CN:86,'
  + 'AF:93,AL:355,DZ:213,AD:376,AO:244,AG:1268,AR:54,AM:374,AU:61,AT:43,AZ:994,BS:1242,BH:973,BD:880,BB:1246,BY:375,'
  + 'BE:32,BZ:501,BJ:229,BT:975,BO:591,BA:387,BW:267,BR:55,BN:673,BG:359,BF:226,BI:257,KH:855,CM:237,CA:1,CV:238,'
  + 'CF:236,TD:235,CL:56,CO:57,KM:269,CG:242,CD:243,CR:506,CI:225,HR:385,CU:53,CY:357,CZ:420,DK:45,DJ:253,DM:1767,'
  + 'DO:1809,EC:593,SV:503,GQ:240,ER:291,EE:372,SZ:268,ET:251,FJ:679,FI:358,FR:33,GA:241,GM:220,GE:995,DE:49,GH:233,'
  + 'GR:30,GD:1473,GT:502,GN:224,GW:245,GY:592,HT:509,HN:504,HK:852,HU:36,IS:354,IN:91,ID:62,IR:98,IQ:964,IE:353,'
  + 'IT:39,JM:1876,JP:81,JO:962,KZ:7,KE:254,KI:686,KW:965,KG:996,LA:856,LV:371,LB:961,LS:266,LR:231,LI:423,LT:370,'
  + 'LU:352,MO:853,MG:261,MW:265,MY:60,MV:960,ML:223,MT:356,MH:692,MR:222,MU:230,MX:52,FM:691,MD:373,MC:377,MN:976,'
  + 'ME:382,MA:212,MZ:258,MM:95,NA:264,NR:674,NP:977,NL:31,NZ:64,NI:505,NE:227,NG:234,KP:850,MK:389,NO:47,OM:968,'
  + 'PK:92,PW:680,PS:970,PA:507,PG:675,PY:595,PE:51,PH:63,PL:48,PT:351,PR:1787,QA:974,RO:40,RU:7,RW:250,KN:1869,'
  + 'LC:1758,VC:1784,WS:685,SM:378,ST:239,SN:221,RS:381,SC:248,SL:232,SG:65,SK:421,SI:386,SB:677,SO:252,ZA:27,'
  + 'KR:82,SS:211,ES:34,LK:94,SD:249,SR:597,SE:46,CH:41,SY:963,TW:886,TJ:992,TZ:255,TH:66,TL:670,TG:228,TO:676,'
  + 'TT:1868,TM:993,TV:688,UG:256,UA:380,GB:44,US:1,UY:598,UZ:998,VU:678,VA:39,VE:58,VN:84,YE:967,ZM:260,ZW:263,XK:383';

const TOP = 7; // how many lead the list before the alphabetical rest

// Names the browser's Arabic list words differently from how our customers say them
const NAME_FIX: Record<string, string> = { PS: 'فلسطين', XK: 'كوسوفو' };

let names: Intl.DisplayNames | null = null;
try { names = new Intl.DisplayNames(['ar'], { type: 'region' }); } catch { names = null; }

export type Country = { iso: string, dial: string, name: string };

const all: Country[] = DIAL.split(',').map((pair) => {
  const [iso, dial] = pair.split(':');
  let name = NAME_FIX[iso];
  if (!name) { try { name = names?.of(iso) || iso; } catch { name = iso; } }
  return { iso, dial, name };
});

export const COUNTRIES: Country[] = [
  ...all.slice(0, TOP),
  ...all.slice(TOP).sort((a, b) => a.name.localeCompare(b.name, 'ar')),
];

export const DEFAULT_COUNTRY = 'LY';
export const countryByIso = (iso: string) => COUNTRIES.find((c) => c.iso === iso) || COUNTRIES[0];

const digits = (v: string) => (v || '').replace(/\D/g, '');

// The number as typed, without the country's own prefixes (Libya: 218 / 0; others: their code / trunk 0)
export const nationalDigits = (iso: string, typed: string) => {
  let d = digits(typed);
  const { dial } = countryByIso(iso);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith(dial) && d.length > dial.length + 5) d = d.slice(dial.length);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
};

// Is it a number we can save and message?
export const phoneProblem = (iso: string, typed: string): string => {
  const n = nationalDigits(iso, typed);
  if (!n) return 'اكتب رقم هاتفك.';
  // 091–095: the Libyan mobile prefixes the WhatsApp sender recognises (validatePhoneNumber)
  if (iso === 'LY') return /^9[1-5]\d{7}$/.test(n) ? '' : 'رقم الهاتف غير صحيح. اكتبه هكذا: 0912345678';
  const full = countryByIso(iso).dial + n;
  if (n.length < 6 || n.length > 13 || full.length < 10) return 'رقم الهاتف غير صحيح. تأكد من الرقم ومن مفتاح الدولة.';
  return '';
};

// What the server stores (see the top of this file)
export const phoneForServer = (iso: string, typed: string) => {
  const n = nationalDigits(iso, typed);
  return iso === 'LY' ? n : countryByIso(iso).dial + n;
};

// A number typed or pasted with its country code (+90…, 00971…): which country it belongs to.
// Longest code wins (+1 868 is Trinidad, not the US); Libya wins its own code.
export const detectCountry = (typed: string): { iso: string, rest: string } | null => {
  const t = (typed || '').trim();
  if (!t.startsWith('+') && !t.startsWith('00')) return null;
  const d = digits(t).replace(/^00/, '');
  let best: Country | null = null;
  COUNTRIES.forEach((c) => {
    if (d.startsWith(c.dial) && (!best || c.dial.length > best.dial.length)) best = c;
  });
  if (!best) return null;
  const found = best as Country;
  return { iso: found.iso, rest: d.slice(found.dial.length) };
};

// A stored account number shown back with its country (912345678 → Libya, 905321234567 → Turkey)
export const fromServer = (stored?: string | number): { iso: string, national: string } => {
  const d = digits(String(stored ?? ''));
  if (!d) return { iso: DEFAULT_COUNTRY, national: '' };
  if (/^9\d{8}$/.test(d)) return { iso: 'LY', national: `0${d}` };
  const found = detectCountry(`+${d}`);
  return found ? { iso: found.iso, national: found.rest } : { iso: DEFAULT_COUNTRY, national: d };
};

export const flagUrl = (iso: string) => `https://flagcdn.com/${iso.toLowerCase()}.svg`;
