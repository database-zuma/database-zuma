import {
  Banknote,
  ChartBar,
  LayoutDashboard,
  Settings,
  User,
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
      {
        title: "Transaksi",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        title: "RO Process",
        url: "/dashboard/finance",
        icon: Banknote,
      },
    ],
  },
  {
    id: 2,
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
