/**
 * RBAC System Index
 *
 * Central export for all RBAC-related types.
 * Import utilities from their specific modules to avoid naming conflicts.
 */

// Types only - import functions directly from specific modules
export type {
  Permission,
  PermissionValue,
  PermissionRecord,
  UserRole,
  WarehouseCode,
  WmsRole,
  WmsUserRole,
  WmsUserWarehouse,
  WmsUserProfile,
  UserPermissionsContext,
  RoutePermissionConfig,
  PermissionCheckResult,
} from "../types/rbac";

export {
  ALL_ROLES,
  ROLE_DISPLAY_NAMES,
  ALL_WAREHOUSES,
  WAREHOUSE_DISPLAY_NAMES,
  PERMISSION_MATRIX,
  GLOBAL_WAREHOUSE_ACCESS_ROLES,
} from "../types/rbac";

// Utilities
// Note: Import directly from specific modules to avoid naming conflicts
// export * from "./permissions";
// export * from "./navigation";
// export * from "./api-auth";
// export * from "./warehouse-isolation";

// Hooks
// export { usePermissions, useCan, useHasRole, useWarehouses } from "../hooks/usePermissions";

// Components
// export {
//   PermissionGuard,
//   RoleGuard,
//   WarehouseGuard,
//   AdminGuard,
//   ManagerGuard,
//   SupervisorGuard,
// } from "../components/guards";

// export {
//   AccessDenied,
//   AccessDeniedPage,
//   AccessDeniedInline,
// } from "../components/access-denied";

// export { Sidebar } from "../components/sidebar";
