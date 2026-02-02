import {
  Banknote,
  ChartBar,
  LayoutDashboard,
  Settings,
  User,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "WH Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Raw Table",
    items: [
      {
        title: "Transaksi DDD",
        url: "/dashboard/transaksi-ddd",
        icon: Warehouse,
      },
      {
        title: "Transaksi LJBB",
        url: "/dashboard/transaksi-ljbb",
        icon: Warehouse,
      },
      {
        title: "Transaksi MBB",
        url: "/dashboard/transaksi-mbb",
        icon: Warehouse,
      },
      {
        title: "Transaksi UBB",
        url: "/dashboard/transaksi-ubb",
        icon: Warehouse,
      },
    ],
  },
  {
    id: 3,
    label: "Replenishment Orders",
    items: [
      {
        title: "RO Process",
        url: "/dashboard/finance",
        icon: Banknote,
      },
    ],
  },
  {
    id: 4,
    label: "Account",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: User,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
