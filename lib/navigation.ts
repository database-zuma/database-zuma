/**
 * Navigation Configuration with RBAC
 * 
 * Defines navigation items with their permission and role requirements.
 * Use with filterNavigationByPermissions() to show only allowed items.
 */

import { Permission, UserRole, WarehouseCode } from "@/types/rbac";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  Settings, 
  BarChart3,
  Warehouse
} from "lucide-react";
import { LucideIcon } from "lucide-react";

/**
 * Navigation item with permission requirements
 */
export interface NavigationItem {
  /**
   * Unique identifier for the navigation item
   */
  id: string;
  
  /**
   * Display label (should be translated)
   */
  label: string;
  
  /**
   * URL path
   */
  href: string;
  
  /**
   * Icon component
   */
  icon: LucideIcon;
  
  /**
   * Required permission to view this item
   */
  requiredPermission?: Permission;
  
  /**
   * Required roles to view this item (any of these roles)
   */
  requiredRoles?: UserRole[];
  
  /**
   * Child navigation items
   */
  children?: NavigationItem[];
  
  /**
   * If true, requires "all" access level (not just "own")
   */
  requireAllAccess?: boolean;
  
  /**
   * If true, this item is only shown when user has warehouse access
   */
  requiresWarehouse?: boolean;
  
  /**
   * Specific warehouse required (if any)
   */
  warehouseCode?: WarehouseCode;
  
  /**
   * Badge text or number to display
   */
  badge?: string | number;
  
  /**
   * If true, item is shown but disabled when no permission
   * If false, item is hidden when no permission
   * @default false
   */
  showWhenDisabled?: boolean;
}

/**
 * Main navigation configuration
 * Organized by feature area with appropriate permission requirements
 */
export const mainNavigation: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "view_dashboard",
  },
  {
    id: "transactions",
    label: "Transactions",
    href: "/transactions",
    icon: FileText,
    requiredPermission: "view_transactions",
    children: [
      {
        id: "transactions-ddd",
        label: "DDD Warehouse",
        href: "/transactions/ddd",
        icon: Warehouse,
        requiredPermission: "view_transactions",
      },
      {
        id: "transactions-ljbb",
        label: "LJBB Warehouse",
        href: "/transactions/ljbb",
        icon: Warehouse,
        requiredPermission: "view_transactions",
      },
      {
        id: "transactions-mbb",
        label: "MBB Warehouse",
        href: "/transactions/mbb",
        icon: Warehouse,
        requiredPermission: "view_transactions",
      },
    ],
  },
  {
    id: "stock",
    label: "Stock Management",
    href: "/stock",
    icon: Package,
    requiredPermission: "view_stock",
    children: [
      {
        id: "stock-all",
        label: "All Stock",
        href: "/stock",
        icon: Package,
        requiredPermission: "view_stock",
        requireAllAccess: true,
      },
      {
        id: "stock-own",
        label: "My Warehouse Stock",
        href: "/stock/my",
        icon: Package,
        requiredPermission: "view_stock",
      },
    ],
  },
  {
    id: "ros",
    label: "Return Orders",
    href: "/ros",
    icon: Warehouse,
    requiredPermission: "manage_ros",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    requiredPermission: "view_reports",
    requiredRoles: ["supervisor", "admin", "gm", "ops_manager"],
  },
  {
    id: "users",
    label: "User Management",
    href: "/users",
    icon: Users,
    requiredPermission: "manage_users",
    requiredRoles: ["admin", "gm", "ops_manager"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    requiredPermission: "system_settings",
    requiredRoles: ["admin"],
  },
];

/**
 * Warehouse-specific navigation items
 * These are dynamically generated based on user's warehouse access
 */
export function getWarehouseNavigation(
  warehouseCode: WarehouseCode
): NavigationItem {
  const warehouseNames: Record<WarehouseCode, string> = {
    DDD: "DDD Warehouse",
    LJBB: "LJBB Warehouse",
    MBB: "MBB Warehouse",
    UBB: "UBB Warehouse",
  };

  return {
    id: `warehouse-${warehouseCode}`,
    label: warehouseNames[warehouseCode],
    href: `/warehouses/${warehouseCode}`,
    icon: Warehouse,
    requiredPermission: "view_stock",
    warehouseCode,
    requiresWarehouse: true,
  };
}

/**
 * User menu navigation items (profile, logout, etc.)
 */
export const userMenuNavigation: NavigationItem[] = [
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: Users,
  },
];

/**
 * Filter navigation items based on user permissions
 * 
 * @param items - Navigation items to filter
 * @param hasPermission - Function to check if user has a permission
 * @param hasRole - Function to check if user has a role
 * @param canAccessWarehouse - Function to check warehouse access
 * @returns Filtered navigation items
 */
export function filterNavigationItems(
  items: NavigationItem[],
  hasPermission: (permission: Permission, requireAll?: boolean) => boolean,
  hasRole: (role: UserRole) => boolean,
  canAccessWarehouse?: (code: WarehouseCode) => boolean
): NavigationItem[] {
  return items
    .filter((item) => {
      // Check permission requirement
      if (item.requiredPermission) {
        const hasPerm = hasPermission(
          item.requiredPermission,
          item.requireAllAccess
        );
        if (!hasPerm && !item.showWhenDisabled) {
          return false;
        }
      }

      // Check role requirement
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        const hasRequiredRole = item.requiredRoles.some((role) => {
          return hasRole(role);
        });
        if (!hasRequiredRole && !item.showWhenDisabled) {
          return false;
        }
      }

      // Check warehouse requirement
      if (item.requiresWarehouse && item.warehouseCode && canAccessWarehouse) {
        const hasAccess = canAccessWarehouse(item.warehouseCode);
        if (!hasAccess && !item.showWhenDisabled) {
          return false;
        }
      }

      return true;
    })
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterNavigationItems(
            item.children,
            hasPermission,
            hasRole,
            canAccessWarehouse
          ),
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove items with empty children (unless they have their own href)
      if (item.children && item.children.length === 0) {
        // Check if item has its own requirements that still pass
        const hasPerm = !item.requiredPermission || 
          hasPermission(item.requiredPermission, item.requireAllAccess);
        const hasRequiredRole = !item.requiredRoles || 
          item.requiredRoles.some((r) => hasRole(r));
        return hasPerm && hasRequiredRole;
      }
      return true;
    });
}

/**
 * Get allowed warehouses for navigation
 * 
 * @param warehouses - User's accessible warehouses
 * @returns Navigation items for each accessible warehouse
 */
export function getWarehouseNavigationItems(
  warehouses: WarehouseCode[]
): NavigationItem[] {
  return warehouses.map((code) => getWarehouseNavigation(code));
}

/**
 * Check if user can access a specific navigation item
 */
export function canAccessNavigationItem(
  item: NavigationItem,
  hasPermission: (permission: Permission, requireAll?: boolean) => boolean,
  hasRole: (role: UserRole) => boolean,
  canAccessWarehouse?: (code: WarehouseCode) => boolean
): boolean {
  // Check permission
  if (item.requiredPermission) {
    if (!hasPermission(item.requiredPermission, item.requireAllAccess)) {
      return false;
    }
  }

  // Check roles
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    if (!item.requiredRoles.some((role) => hasRole(role))) {
      return false;
    }
  }

  // Check warehouse
  if (item.requiresWarehouse && item.warehouseCode && canAccessWarehouse) {
    if (!canAccessWarehouse(item.warehouseCode)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the first accessible navigation item
 * Useful for redirecting after login
 */
export function getFirstAccessibleItem(
  items: NavigationItem[],
  hasPermission: (permission: Permission, requireAll?: boolean) => boolean,
  hasRole: (role: UserRole) => boolean,
  canAccessWarehouse?: (code: WarehouseCode) => boolean
): NavigationItem | null {
  for (const item of items) {
    if (canAccessNavigationItem(item, hasPermission, hasRole, canAccessWarehouse)) {
      return item;
    }
    
    // Check children
    if (item.children) {
      const accessibleChild = getFirstAccessibleItem(
        item.children,
        hasPermission,
        hasRole,
        canAccessWarehouse
      );
      if (accessibleChild) {
        return accessibleChild;
      }
    }
  }
  return null;
}

/**
 * Default redirect path based on role
 */
export function getDefaultRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "gm":
      return "/dashboard";
    case "ops_manager":
      return "/dashboard";
    case "supervisor":
      return "/transactions";
    case "staff":
      return "/transactions/my";
    default:
      return "/dashboard";
  }
}
