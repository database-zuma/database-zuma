/**
 * Role-Based Access Control (RBAC) Types
 * 
 * Type definitions for permissions, roles, and warehouse access control.
 */

/**
 * Permission capabilities available in the system
 */
export type Permission =
  | "view_dashboard"
  | "view_transactions"
  | "create_transactions"
  | "edit_transactions"
  | "view_stock"
  | "manage_ros"
  | "manage_users"
  | "view_reports"
  | "system_settings";

/**
 * Permission values - boolean or scoped access levels
 */
export type PermissionValue = boolean | "own" | "all";

/**
 * Permission record mapping permission keys to their values
 */
export type PermissionRecord = Partial<Record<Permission, PermissionValue>>;

/**
 * User roles in the system
 */
export type UserRole = "staff" | "supervisor" | "admin" | "gm" | "ops_manager";

/**
 * All user roles array for iteration
 */
export const ALL_ROLES: UserRole[] = [
  "staff",
  "supervisor",
  "admin",
  "gm",
  "ops_manager",
];

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  staff: "Staff",
  supervisor: "Supervisor",
  admin: "Administrator",
  gm: "General Manager",
  ops_manager: "Operations Manager",
};

/**
 * Warehouse codes available in the system
 */
export type WarehouseCode = "DDD" | "LJBB" | "MBB" | "UBB";

/**
 * All warehouse codes array for iteration
 */
export const ALL_WAREHOUSES: WarehouseCode[] = ["DDD", "LJBB", "MBB", "UBB"];

/**
 * Warehouse display names for UI
 */
export const WAREHOUSE_DISPLAY_NAMES: Record<WarehouseCode, string> = {
  DDD: "DDD Warehouse",
  LJBB: "LJBB Warehouse",
  MBB: "MBB Warehouse",
  UBB: "UBB Warehouse",
};

/**
 * Database role record structure
 */
export interface WmsRole {
  id: string;
  name: UserRole;
  display_name: string;
  permissions: PermissionRecord;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database user role assignment structure
 */
export interface WmsUserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string | null;
  role?: WmsRole;
}

/**
 * Database warehouse assignment structure
 */
export interface WmsUserWarehouse {
  id: string;
  user_id: string;
  warehouse_code: WarehouseCode;
  assigned_at: string;
  assigned_by: string | null;
}

/**
 * Database user profile structure
 */
export interface WmsUserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Complete user permissions context
 */
export interface UserPermissionsContext {
  userId: string;
  roles: UserRole[];
  permissions: PermissionRecord;
  warehouses: WarehouseCode[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Navigation item with permission requirements
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  children?: NavigationItem[];
}

/**
 * API route permission configuration
 */
export interface RoutePermissionConfig {
  path: string;
  methods: string[];
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  requireWarehouseAccess?: boolean;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  missingPermission?: Permission;
  missingRole?: UserRole;
}

/**
 * Permission matrix for role-based access control
 * Maps each role to their permissions
 */
export const PERMISSION_MATRIX: Record<UserRole, PermissionRecord> = {
  staff: {
    view_dashboard: true,
    view_transactions: "own",
    create_transactions: true,
    edit_transactions: false,
    view_stock: "own",
    manage_ros: true,
    manage_users: false,
    view_reports: false,
    system_settings: false,
  },
  supervisor: {
    view_dashboard: true,
    view_transactions: "own",
    create_transactions: true,
    edit_transactions: true,
    view_stock: "own",
    manage_ros: true,
    manage_users: false,
    view_reports: true,
    system_settings: false,
  },
  admin: {
    view_dashboard: true,
    view_transactions: "all",
    create_transactions: true,
    edit_transactions: true,
    view_stock: "all",
    manage_ros: true,
    manage_users: true,
    view_reports: true,
    system_settings: true,
  },
  gm: {
    view_dashboard: true,
    view_transactions: "all",
    create_transactions: false,
    edit_transactions: false,
    view_stock: "all",
    manage_ros: true,
    manage_users: true,
    view_reports: true,
    system_settings: false,
  },
  ops_manager: {
    view_dashboard: true,
    view_transactions: "all",
    create_transactions: false,
    edit_transactions: false,
    view_stock: "all",
    manage_ros: true,
    manage_users: true,
    view_reports: true,
    system_settings: false,
  },
};

/**
 * Roles that have access to all warehouses without explicit assignment
 */
export const GLOBAL_WAREHOUSE_ACCESS_ROLES: UserRole[] = [
  "admin",
  "gm",
  "ops_manager",
];

/**
 * Check if a role has global warehouse access
 */
export function hasGlobalWarehouseAccess(role: UserRole): boolean {
  return GLOBAL_WAREHOUSE_ACCESS_ROLES.includes(role);
}
