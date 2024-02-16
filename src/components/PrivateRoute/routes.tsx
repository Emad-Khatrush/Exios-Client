import { RiDashboardLine } from 'react-icons/ri';
import { BsBox } from 'react-icons/bs';
import { MdAttachMoney, MdContactSupport, MdLocalShipping } from 'react-icons/md';
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
  {
    label: 'الاسعار',
    value: 'prices',
    icon: <MdAttachMoney />,
    path: '/prices'
  },
  ,
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
