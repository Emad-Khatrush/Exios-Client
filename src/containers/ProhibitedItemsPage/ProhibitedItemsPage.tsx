import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconType } from 'react-icons';
import {
  MdBatteryAlert,
  MdBlock,
  MdCleaningServices,
  MdDirectionsBoat,
  MdDoNotDisturbAlt,
  MdFastfood,
  MdFlight,
  MdLocalFireDepartment,
  MdOutlineSupportAgent,
  MdPestControl,
  MdSettingsInputAntenna,
  MdSmokingRooms,
} from 'react-icons/md';
import {
  GiArmorVest,
  GiBinoculars,
  GiDeliveryDrone,
  GiDiamondRing,
  GiElectric,
  GiHairStrands,
  GiMining,
  GiPerfumeBottle,
  GiPill,
  GiPistolGun,
  GiPowder,
  GiRadarSweep,
  GiScalpel,
} from 'react-icons/gi';

type ShippingType = 'air' | 'sea';
type ProhibitedItem = { label: string, icon: IconType };

const AIR_ITEMS: ProhibitedItem[] = [
  { label: 'المواد الغذائية', icon: MdFastfood },
  { label: 'أجهزة التعدين', icon: GiMining },
  { label: 'كاشف المعادن', icon: GiRadarSweep },
  { label: 'أجهزة لاسلكية', icon: MdSettingsInputAntenna },
  { label: 'الطائرات المسيرة', icon: GiDeliveryDrone },
  { label: 'السجائر الإلكترونية', icon: MdSmokingRooms },
  { label: 'المساحيق (البودر)', icon: GiPowder },
  { label: 'البطاريات / الباور بانك', icon: MdBatteryAlert },
  { label: 'الحبوب والأدوية والعقاقير', icon: GiPill },
  { label: 'المبيدات الحشرية والأسمدة', icon: MdPestControl },
  { label: 'العصي والصواعق الكهربائية', icon: GiElectric },
  { label: 'الأسلحة والأسلحة البيضاء والأدوات الحادة (وما يماثلها من الألعاب)', icon: GiPistolGun },
  { label: 'المواد الكيميائية الخطرة أو القابلة للاشتعال', icon: MdLocalFireDepartment },
  { label: 'المواد الإباحية والغير لائقة بكافة أشكالها وأنواعها', icon: MdDoNotDisturbAlt },
  { label: 'المعادن النفيسة كالذهب والألماس والعملات المالية', icon: GiDiamondRing },
  { label: 'الملابس والأدوات الخاصة بالأجهزة الأمنية والعسكرية وما يشابهها', icon: GiArmorVest },
  { label: 'العطور أو المواد السائلة والمواد التي تحتوي على محاليل ذات تركيب كحولي', icon: GiPerfumeBottle },
  { label: 'المناظير العسكرية والمناظير الليلية وملحقات وأجزاء الأسلحة النارية وإكسسواراتها', icon: GiBinoculars },
  { label: 'الشعر المستعار، وصلات الشعر، الرموش، الأظافر وأي شيء مخالف لأحكام وتشريعات الدين الإسلامي', icon: GiHairStrands },
];

const SEA_ITEMS: ProhibitedItem[] = [
  { label: 'المواد الغذائية', icon: MdFastfood },
  { label: 'أجهزة التعدين', icon: GiMining },
  { label: 'كاشف المعادن', icon: GiRadarSweep },
  { label: 'أجهزة لاسلكية', icon: MdSettingsInputAntenna },
  { label: 'الطائرات المسيرة', icon: GiDeliveryDrone },
  { label: 'السجائر الإلكترونية', icon: MdSmokingRooms },
  { label: 'العصي والصواعق الكهربائية', icon: GiElectric },
  { label: 'المواد الخطرة أو القابلة للاشتعال', icon: MdLocalFireDepartment },
  { label: 'الحبوب والأدوية والعقاقير', icon: GiPill },
  { label: 'المبيدات الحشرية والأسمدة ومواد التنظيف', icon: MdCleaningServices },
  { label: 'الأسلحة والأسلحة البيضاء والأدوات الحادة وما يماثلها من الألعاب', icon: GiPistolGun },
  { label: 'المعدات الطبية الجراحية أو ذات التقنية العالية', icon: GiScalpel },
  { label: 'المواد الإباحية والغير لائقة بكافة أشكالها وأنواعها', icon: MdDoNotDisturbAlt },
  { label: 'المعادن النفيسة كالذهب والألماس والعملات المالية', icon: GiDiamondRing },
  { label: 'الملابس والأدوات الخاصة بالأجهزة الأمنية والعسكرية وما يشابهها', icon: GiArmorVest },
  { label: 'المناظير العسكرية والمناظير الليلية وملحقات وأجزاء الأسلحة النارية وإكسسواراتها', icon: GiBinoculars },
  { label: 'الشعر المستعار، وصلات الشعر، الرموش، الأظافر وأي شيء مخالف لأحكام وتشريعات الدين الإسلامي', icon: GiHairStrands },
];

const TABS: { value: ShippingType, label: string, icon: IconType, items: ProhibitedItem[] }[] = [
  { value: 'air', label: 'الشحن الجوي', icon: MdFlight, items: AIR_ITEMS },
  { value: 'sea', label: 'الشحن البحري', icon: MdDirectionsBoat, items: SEA_ITEMS },
];

const ProhibitedItemsPage = () => {
  const [shippingType, setShippingType] = useState<ShippingType>('air');
  const activeTab = TABS.find(tab => tab.value === shippingType)!;

  return (
    <div dir="rtl" className="container mx-auto py-10 xl:w-11/12 px-3 text-right">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-red-50 text-red-600">
            <MdBlock size={30} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ممنوعات من الشحن</h1>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-[65ch]">
              قبل الشراء تأكد أن طلبيتك لا تحتوي على أي من المواد التالية، القائمة تختلف بين الشحن الجوي والشحن البحري.
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="نوع الشحن"
          className="mt-6 grid grid-cols-2 md:inline-grid gap-1 p-1 rounded-xl bg-gray-100"
        >
          {TABS.map(tab => {
            const isActive = tab.value === shippingType;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setShippingType(tab.value)}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-5 py-2.5 rounded-lg text-sm md:text-base font-bold whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-green-600' : ''}`} />
                {tab.label}
                <span
                  className={`text-xs font-bold rounded-full px-1.5 md:px-2 py-0.5 ${
                    isActive ? 'bg-green-50 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {tab.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ol key={shippingType} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {activeTab.items.map((item, index) => {
          const Icon = item.icon;
          return (
            <li
              key={item.label}
              className="prohibited-item flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200 hover:border-red-100 hover:shadow-md hover:-translate-y-[1px]"
              style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
            >
              <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-red-50 text-red-600">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="block text-xs font-bold text-gray-400 mb-1">{index + 1}</span>
                <p className="text-sm md:text-[0.95rem] font-semibold text-gray-800 leading-relaxed">{item.label}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-green-50 text-green-600">
          <MdOutlineSupportAgent size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-1">غير متأكد من منتج معين؟</h2>
          <p className="text-sm text-gray-600 leading-relaxed">تواصل معنا قبل الشراء وسنخبرك إذا كان بالإمكان شحنه.</p>
        </div>
        <Link
          to="/contact-us"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-green-600 hover:bg-green-700 px-6 py-2.5 text-sm font-bold text-white transition-colors active:scale-[0.98]"
        >
          تواصل معنا
        </Link>
      </div>
    </div>
  )
}

export default ProhibitedItemsPage;
