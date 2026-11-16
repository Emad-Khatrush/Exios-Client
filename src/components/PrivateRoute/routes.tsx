import {
  ArrowLeftRight, Ban, FileText, Gift, Headset, House, LucideIcon, Megaphone, MessageSquareText, Package, Plane, Rocket,
  ShoppingBag, Warehouse,
} from 'lucide-react';

export type AppRoute = {
  label: string
  value: string
  icon: LucideIcon
  path: string
}

export type RouteGroup = {
  // Groups without a title are the everyday pages at the top of the sidebar
  title?: string
  routes: AppRoute[]
}

export const routeGroups: RouteGroup[] = [
  {
    routes: [
      { label: 'الصفحة الرئيسية', value: 'home', icon: House, path: '/home' },
      { label: 'طلبياتي', value: 'myOrders', icon: Package, path: '/orders' },
      { label: 'ابدأ الشحن', value: 'startShip', icon: Rocket, path: '/start-shipment' },
      { label: 'عناويننا', value: 'address', icon: Warehouse, path: '/address' },
      { label: 'نقاطي', value: 'points', icon: Gift, path: '/points' },
    ],
  },
  {
    // Prices are split by service so each is one tap away
    title: 'الأسعار',
    routes: [
      { label: 'أسعار الشحن', value: 'shippingPrices', icon: Plane, path: '/prices/shipping' },
      { label: 'أسعار الشراء', value: 'purchasePrices', icon: ShoppingBag, path: '/prices/purchase' },
      { label: 'الحوالات المالية', value: 'transferPrices', icon: ArrowLeftRight, path: '/prices/transfers' },
    ],
  },
  {
    title: 'المساعدة',
    routes: [
      { label: 'الإعلانات', value: 'announcements', icon: Megaphone, path: '/announcements' },
      { label: 'ممنوعات الشحن', value: 'prohibitedItems', icon: Ban, path: '/prohibited-items' },
      { label: 'شكوى / اقتراح', value: 'suggestions', icon: MessageSquareText, path: '/suggestions' },
      { label: 'الشروط والسياسات', value: 'terms', icon: FileText, path: '/terms-privacy' },
      { label: 'تواصل معنا', value: 'contactUs', icon: Headset, path: '/contact-us' },
    ],
  },
];

export const routes: AppRoute[] = routeGroups.flatMap((g) => g.routes);
