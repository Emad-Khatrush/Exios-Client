import { RiDashboardLine } from 'react-icons/ri';
import { BsBox } from 'react-icons/bs';
import { MdBlock, MdFlight, MdShoppingCart, MdSwapHoriz, MdContactSupport, MdLocalShipping, MdOutlineAnnouncement } from 'react-icons/md';
import { ImLocation2 } from 'react-icons/im';
import { TbDeviceMobileMessage } from 'react-icons/tb';

export const routes = [
  {
    label: 'الصفحة الرئيسية',
    value: 'home',
    icon: <RiDashboardLine />,
    path: '/home'
  },
  {
    label: 'طلبياتي',
    value: 'myOrders',
    icon: <BsBox />,
    path: '/orders'
  },
  {
    label: 'ابدأ بالشحن',
    value: 'startShip',
    icon: <MdLocalShipping />,
    path: '/start-shipment'
  },
  {
    label: 'عناوننا',
    value: 'address',
    icon: <ImLocation2 />,
    path: '/address'
  },
  // Prices are split by service so each is one tap away
  {
    label: 'أسعار الشحن',
    value: 'shippingPrices',
    icon: <MdFlight />,
    path: '/prices/shipping'
  },
  {
    label: 'أسعار الشراء',
    value: 'purchasePrices',
    icon: <MdShoppingCart />,
    path: '/prices/purchase'
  },
  {
    label: 'الحوالات المالية',
    value: 'transferPrices',
    icon: <MdSwapHoriz />,
    path: '/prices/transfers'
  },
  {
    label: 'ممنوعات من الشحن',
    value: 'prohibitedItems',
    icon: <MdBlock />,
    path: '/prohibited-items'
  },
  {
    label: 'الإعلانات',
    value: 'announcements',
    icon: <MdOutlineAnnouncement />,
    path: '/announcements'
  },
  {
    label: 'شكوى / اقتراح',
    value: 'suggestions',
    icon: <TbDeviceMobileMessage />,
    path: '/suggestions'
  },
  {
    label: 'تواصل معنا',
    value: 'contactUs',
    icon: <MdContactSupport />,
    path: '/contact-us'
  }
]
