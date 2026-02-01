/**
 * Permission Utilities
 * 
 * Client-side permission checking utilities for RBAC.
 * These functions work with the database functions and RLS policies.
 * 
 * IMPORTANT: These are for UI convenience only. Always rely on RLS policies
 * for actual data protection. Never trust client-side checks for security.
 */

import { createClient } from "@/lib/supabase/client";
import {
  Permission,
  PermissionValue,
  PermissionRecord,
  UserRole,
  WarehouseCode,
  WmsRole,
  WmsUserRole,
  WmsUserWarehouse,
  PERMISSION_MATRIX,
  GLOBAL_WAREHOUSE_ACCESS_ROLES,
  PermissionCheckResult,
} from "@/types/rbac";

/**
 * Check if a permission value grants access
 * - true: always grants access
 * - "all": grants access to all resources
 * - "own": grants access to own resources only
 * - false: denies access
 */
export function hasPermissionValue(
  value: PermissionValue | undefined,
  requireAll = false
): boolean {
  if (value === true || value === "all") return true;
  if (requireAll) return false;
  if (value === "own") return true;
  return false;
}

/**
 * Check if a permission value allows access to all resources (not just own)
 */
export function hasAllAccess(value: PermissionValue | undefined): boolean {
  return value === "all";
}

/**
 * Check if a permission value allows access to own resources only
 */
export function hasOwnAccess(value: PermissionValue | undefined): boolean {
  return value === "own" || value === true;
}

/**
 * Get effective permissions for a set of roles
 * Merges permissions from all roles, with "all" > "own" > false
 */
export function getEffectivePermissions(
  roles: UserRole[]
): PermissionRecord {
  const effective: PermissionRecord = {};

  for (const role of roles) {
    const rolePerms = PERMISSION_MATRIX[role];
    if (!rolePerms) continue;

    for (const [perm, value] of Object.entries(rolePerms)) {
      const permission = perm as Permission;
      const currentValue = effective[permission];

      // Merge logic: "all" > "own" > true > false
      if (value === "all") {
        effective[permission] = "all";
      } else if (value === "own" && currentValue !== "all") {
        effective[permission] = "own";
      } else if (value === true && currentValue !== "all" && currentValue !== "own") {
        effective[permission] = true;
      } else if (!(permission in effective)) {
        effective[permission] = value;
      }
    }
  }

  return effective;
}

/**
 * Check if a permission record has a specific permission
 */
export function checkPermission(
  permissions: PermissionRecord,
  permission: Permission,
  requireAll = false
): boolean {
  const value = permissions[permission];
  return hasPermissionValue(value, requireAll);
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(
  userRoles: UserRole[],
  requiredRoles: UserRole[]
): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 */
export function hasAllRoles(
  userRoles: UserRole[],
  requiredRoles: UserRole[]
): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.every((role) => userRoles.includes(role));
}

/**
 * Check if a role has global warehouse access (all warehouses)
 */
export function roleHasGlobalWarehouseAccess(role: UserRole): boolean {
  return GLOBAL_WAREHOUSE_ACCESS_ROLES.includes(role);
}

/**
 * Check if any of the user's roles have global warehouse access
 */
export function userHasGlobalWarehouseAccess(roles: UserRole[]): boolean {
  return roles.some((role) => roleHasGlobalWarehouseAccess(role));
}

/**
 * Fetch user's roles from the database
 */
export async function fetchUserRoles(
  userId: string
): Promise<{ roles: UserRole[]; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("wms_user_roles")
      .select(`
        role:role_id (
          name
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return { roles: [], error: new Error(error.message) };
    }

    const roles = (data || [])
      .map((item: any) => item.role?.name)
      .filter((name): name is UserRole => Boolean(name));

    return { roles, error: null };
  } catch (err) {
    console.error("Exception fetching user roles:", err);
    return {
      roles: [],
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Fetch user's warehouse assignments from the database
 */
export async function fetchUserWarehouses(
  userId: string
): Promise<{ warehouses: WarehouseCode[]; error: Error | null }> {
  const supabase = createClient();

  try {
    // First check if user has global warehouse access
    const { roles } = await fetchUserRoles(userId);
    if (userHasGlobalWarehouseAccess(roles)) {
      return { warehouses: ["DDD", "LJBB", "MBB", "UBB"], error: null };
    }

    const { data, error } = await supabase
      .from("wms_user_warehouses")
      .select("warehouse_code")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user warehouses:", error);
      return { warehouses: [], error: new Error(error.message) };
    }

    const warehouses = (data || [])
      .map((item: { warehouse_code: WarehouseCode }) => item.warehouse_code)
      .filter((code): code is WarehouseCode => Boolean(code));

    return { warehouses, error: null };
  } catch (err) {
    console.error("Exception fetching user warehouses:", err);
    return {
      warehouses: [],
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Check if user has access to a specific warehouse
 */
export async function checkWarehouseAccess(
  userId: string,
  warehouseCode: WarehouseCode
): Promise<{ hasAccess: boolean; error: Error | null }> {
  const supabase = createClient();

  try {
    // Use the database function for warehouse access check
    const { data, error } = await supabase.rpc("has_warehouse_access", {
      p_user_id: userId,
      p_warehouse_code: warehouseCode,
    });

    if (error) {
      console.error("Error checking warehouse access:", error);
      return { hasAccess: false, error: new Error(error.message) };
    }

    return { hasAccess: Boolean(data), error: null };
  } catch (err) {
    console.error("Exception checking warehouse access:", err);
    return {
      hasAccess: false,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Check if user has a specific permission using database function
 */
export async function checkPermissionDb(
  userId: string,
  permission: Permission
): Promise<{ hasPermission: boolean; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("has_permission", {
      p_user_id: userId,
      p_permission: permission,
    });

    if (error) {
      console.error("Error checking permission:", error);
      return { hasPermission: false, error: new Error(error.message) };
    }

    return { hasPermission: Boolean(data), error: null };
  } catch (err) {
    console.error("Exception checking permission:", err);
    return {
      hasPermission: false,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Get user's effective permissions from the database
 */
export async function fetchUserPermissions(
  userId: string
): Promise<{ permissions: PermissionRecord; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_user_permissions", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching user permissions:", error);
      return { permissions: {}, error: new Error(error.message) };
    }

    return { permissions: (data as PermissionRecord) || {}, error: null };
  } catch (err) {
    console.error("Exception fetching user permissions:", err);
    return {
      permissions: {},
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}

/**
 * Comprehensive permission check with detailed result
 */
export function checkAccess({
  userRoles,
  userPermissions,
  requiredPermission,
  requiredRoles,
  requireAll = false,
}: {
  userRoles: UserRole[];
  userPermissions: PermissionRecord;
  requiredPermission?: Permission;
  requiredRoles?: UserRole[];
  requireAll?: boolean;
}): PermissionCheckResult {
  // Check role requirements first
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = hasAnyRole(userRoles, requiredRoles);
    if (!hasRequiredRole) {
      return {
        allowed: false,
        reason: `Requires one of the following roles: ${requiredRoles.join(", ")}`,
        missingRole: requiredRoles.find((r) => !userRoles.includes(r)),
      };
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    const hasRequiredPermission = checkPermission(
      userPermissions,
      requiredPermission,
      requireAll
    );
    if (!hasRequiredPermission) {
      return {
        allowed: false,
        reason: `Missing required permission: ${requiredPermission}`,
        missingPermission: requiredPermission,
      };
    }
  }

  return { allowed: true };
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions<
  T extends { requiredPermission?: Permission; requiredRoles?: UserRole[] }
>(
  items: T[],
  userRoles: UserRole[],
  userPermissions: PermissionRecord
): T[] {
  return items.filter((item) => {
    if (item.requiredRoles && !hasAnyRole(userRoles, item.requiredRoles)) {
      return false;
    }
    if (
      item.requiredPermission &&
      !checkPermission(userPermissions, item.requiredPermission)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Get all permissions that are granted to a set of roles
 */
export function getGrantedPermissions(
  roles: UserRole[]
): Permission[] {
  const effective = getEffectivePermissions(roles);
  return Object.entries(effective)
    .filter(([_, value]) => hasPermissionValue(value))
    .map(([perm]) => perm as Permission);
}

/**
 * Get permission level as a readable string
 */
export function getPermissionLevel(value: PermissionValue | undefined): string {
  if (value === true) return "Granted";
  if (value === "all") return "All Access";
  if (value === "own") return "Own Only";
  return "Denied";
}
