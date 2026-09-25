'use client';

import React from 'react';
import { MorphIcon, type MorphIconProps } from 'morphicons/react';
import * as LucideIcons from 'lucide';

// Mapping from Google Material Symbols to Lucide icon data nodes consumed by Morphicons
const ICON_MAP: Record<string, any> = {
  account_balance_wallet: LucideIcons.Wallet,
  add: LucideIcons.Plus,
  alarm: LucideIcons.AlarmClock,
  apps: LucideIcons.LayoutGrid,
  arrow_back: LucideIcons.ArrowLeft,
  arrow_forward: LucideIcons.ArrowRight,
  auto_awesome: LucideIcons.Sparkles,
  auto_graph: LucideIcons.TrendingUp,
  badge: LucideIcons.IdCard,
  bar_chart: LucideIcons.BarChart3,
  cake: LucideIcons.CakeSlice,
  calendar_month: LucideIcons.Calendar,
  calendar_today: LucideIcons.Calendar,
  category: LucideIcons.Layers,
  chat_bubble: LucideIcons.MessageSquare,
  check: LucideIcons.Check,
  check_circle: LucideIcons.CheckCircle2,
  checklist: LucideIcons.ClipboardList,
  chevron_left: LucideIcons.ChevronLeft,
  chevron_right: LucideIcons.ChevronRight,
  cleaning_services: LucideIcons.Sparkles,
  close: LucideIcons.X,
  coffee_maker: LucideIcons.Coffee,
  contact_support: LucideIcons.HelpCircle,
  content_copy: LucideIcons.Copy,
  cookie: LucideIcons.Cookie,
  dark_mode: LucideIcons.Moon,
  dashboard: LucideIcons.LayoutDashboard,
  delete: LucideIcons.Trash2,
  done: LucideIcons.Check,
  edit: LucideIcons.Pencil,
  emoji_food_beverage: LucideIcons.CupSoda,
  error_outline: LucideIcons.AlertCircle,
  event_available: LucideIcons.CalendarCheck,
  expand_less: LucideIcons.ChevronUp,
  expand_more: LucideIcons.ChevronDown,
  filter_alt: LucideIcons.Filter,
  graphic_eq: LucideIcons.AudioWaveform,
  grid_view: LucideIcons.LayoutGrid,
  group: LucideIcons.Users,
  home: LucideIcons.Home,
  hourglass_empty: LucideIcons.Hourglass,
  hourglass_top: LucideIcons.Hourglass,
  icecream: LucideIcons.IceCream2,
  info: LucideIcons.Info,
  insights: LucideIcons.TrendingUp,
  inventory_2: LucideIcons.Package,
  label: LucideIcons.Tag,
  layers: LucideIcons.Layers,
  light_mode: LucideIcons.Sun,
  local_cafe: LucideIcons.Coffee,
  local_drink: LucideIcons.CupSoda,
  local_fire_department: LucideIcons.Flame,
  local_mall: LucideIcons.ShoppingBag,
  local_offer: LucideIcons.Tag,
  location_on: LucideIcons.MapPin,
  lock: LucideIcons.Lock,
  lock_clock: LucideIcons.Clock,
  login: LucideIcons.LogIn,
  logout: LucideIcons.LogOut,
  mail: LucideIcons.Mail,
  menu_book: LucideIcons.BookOpen,
  mic: LucideIcons.Mic,
  more_vert: LucideIcons.MoreVertical,
  notifications: LucideIcons.Bell,
  notifications_active: LucideIcons.BellRing,
  notifications_off: LucideIcons.BellOff,
  open_in_new: LucideIcons.ExternalLink,
  payments: LucideIcons.CreditCard,
  person: LucideIcons.User,
  pie_chart: LucideIcons.PieChart,
  print: LucideIcons.Printer,
  progress_activity: LucideIcons.Loader2,
  published_with_changes: LucideIcons.ArrowLeftRight,
  qr_code_2: LucideIcons.QrCode,
  qr_code_scanner: LucideIcons.ScanLine,
  receipt: LucideIcons.Receipt,
  receipt_long: LucideIcons.FileText,
  recommend: LucideIcons.ThumbsUp,
  redeem: LucideIcons.Gift,
  refresh: LucideIcons.RotateCw,
  remove: LucideIcons.Minus,
  replay: LucideIcons.RotateCcw,
  restaurant: LucideIcons.Utensils,
  rotate_right: LucideIcons.RotateCw,
  schedule: LucideIcons.Clock,
  search: LucideIcons.Search,
  search_off: LucideIcons.SearchX,
  send: LucideIcons.Send,
  shopping_bag: LucideIcons.ShoppingBag,
  shopping_cart: LucideIcons.ShoppingCart,
  show_chart: LucideIcons.LineChart,
  soup_kitchen: LucideIcons.ChefHat,
  star: LucideIcons.Star,
  stop_circle: LucideIcons.StopCircle,
  storefront: LucideIcons.Store,
  swap_horiz: LucideIcons.ArrowLeftRight,
  sync: LucideIcons.RefreshCw,
  table_restaurant: LucideIcons.UtensilsCrossed,
  table_rows: LucideIcons.List,
  takeout_dining: LucideIcons.UtensilsCrossed,
  task_alt: LucideIcons.CheckCheck,
  trending_down: LucideIcons.TrendingDown,
  trending_up: LucideIcons.TrendingUp,
  tune: LucideIcons.SlidersHorizontal,
  verified: LucideIcons.BadgeCheck,
  verified_user: LucideIcons.ShieldCheck,
  view_list: LucideIcons.List,
  warning: LucideIcons.AlertTriangle,
  warning_amber: LucideIcons.AlertTriangle,
  users: LucideIcons.Users,
  wb_sunny: LucideIcons.SunMedium,
  wifi: LucideIcons.Wifi,
};

export interface DashboardIconProps extends Omit<MorphIconProps, 'icon'> {
  name: string;
}

export const DashboardIcon: React.FC<DashboardIconProps> = ({
  name,
  className = '',
  size = '1em',
  spring = 'snappy',
  strokeWidth = 2,
  ...props
}) => {
  const iconData =
    ICON_MAP[name] ||
    (LucideIcons as Record<string, any>)[name] ||
    LucideIcons.HelpCircle;

  return (
    <MorphIcon
      icon={iconData}
      size={size}
      spring={spring}
      strokeWidth={strokeWidth}
      className={`inline-block shrink-0 align-middle ${className}`}
      {...props}
    />
  );
};

export const AppIcon = DashboardIcon;
