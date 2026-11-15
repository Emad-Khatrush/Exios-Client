// How to reach Exios: one place for the landing page and the in-app contact page, so a changed
// number or address is changed once.
// whatsapp: the number of each office that answers on WhatsApp (international format, no +)
// cities: the customer cities this office serves (account.city values), to suggest the nearest one
// mapsUrl: the office's Google Maps listing; mapEmbed: the same place for the in-page map

export type Office = {
  key: 'tripoli' | 'benghazi';
  city: string;
  name: string;
  address: string;
  directions?: string;
  phones: string[];
  whatsapp: string;
  cities: string[];
  mapsUrl: string;
  mapEmbed: string;
};

export const OFFICES: Office[] = [
  {
    key: 'tripoli',
    city: 'طرابلس',
    name: 'مكتب طرابلس',
    address: 'باب بن غشير، زنقة ميدان مدرسة اقرأ',
    directions: 'اجعل محلات مواد الزينة للجملة على يسارك، ثم ادخل أول زنقة بعدها على اليسار، ثم أول زنقة على اليمين.',
    phones: ['0915643265', '0912068211'],
    whatsapp: '218915643265',
    cities: ['tripoli', 'misrata', 'zawiya', 'zliten', 'sabratha', 'sabha'],
    mapsUrl: 'https://maps.google.com/?cid=12258524725644109128',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3351.111901251624!2d13.205703015546595!3d32.868758586608415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13a89344ae74c95d%3A0xaa1f074a1e5c2548!2z2LTYsdmD2Kkg2KfZg9iz2YrZiNizINmE2YTYp9iz2KrZitix2KfYryDZiNin2YTYqti12K_Zitix!5e0!3m2!1sar!2sly!4v1668264403979!5m2!1sar!2sly',
  },
  {
    key: 'benghazi',
    city: 'بنغازي',
    name: 'مكتب بنغازي',
    address: 'الهواري - بنغازي',
    phones: ['0919078031', '0919734019'],
    whatsapp: '218919734019',
    cities: ['benghazi', 'bayda', 'tobruk', 'ajdabiya', 'derna', 'kufra'],
    mapsUrl: 'https://maps.google.com/?cid=8072227268697048892',
    mapEmbed: 'https://maps.google.com/maps?cid=8072227268697048892&hl=ar&z=15&output=embed',
  },
];

export const EMAIL = 'emad.khatrush@exioslibya.com';
export const FACEBOOK_URL = 'https://www.facebook.com/exioscompany';
export const TIKTOK_URL = 'https://www.tiktok.com/@exiosshipping';

// The office serving a customer's city; Tripoli when the city is not listed
export const officeFor = (city?: string) => OFFICES.find((o) => city && o.cities.includes(city)) || OFFICES[0];

export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
