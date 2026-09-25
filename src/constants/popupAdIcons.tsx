import {
  Award, Bell, Calendar, Clock, Flame, Gift, Globe, Heart, Info, Megaphone,
  Moon, Package, PartyPopper, Percent, Rocket, ShieldCheck, Sparkles, Star,
  Sun, Tag, ThumbsUp, TrendingUp, Truck, Zap,
} from 'lucide-react';

// Keys are shared with Exios-Api (validation) and exios-admin (icon picker) -
// keep all three lists in sync if this changes.
export const POPUP_AD_ICON_COMPONENTS: Record<string, any> = {
  megaphone: Megaphone,
  gift: Gift,
  sparkles: Sparkles,
  rocket: Rocket,
  star: Star,
  bell: Bell,
  tag: Tag,
  percent: Percent,
  truck: Truck,
  party: PartyPopper,
  heart: Heart,
  shield: ShieldCheck,
  zap: Zap,
  calendar: Calendar,
  clock: Clock,
  trending: TrendingUp,
  award: Award,
  flame: Flame,
  thumbsUp: ThumbsUp,
  info: Info,
  globe: Globe,
  package: Package,
  sun: Sun,
  moon: Moon,
};
