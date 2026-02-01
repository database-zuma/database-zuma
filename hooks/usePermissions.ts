"use client";

/**
 * usePermissions Hook
 * 
 * React hook for managing user permissions, roles, and warehouse access.
 * Provides reactive permission checking for UI components.
 * 
 * SECURITY NOTE: These client-side checks are for UI convenience only.
 * Always rely on RLS policies and server-side validation for security.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Permission,
  PermissionRecord,
  UserRole,
  WarehouseCode,
  UserPermissionsContext,
} from "@/types/rbac";
import {
  fetchUserRoles,
  fetchUserWarehouses,
  fetchUserPermissions,
  getEffectivePermissions,
  checkPermission,
  hasAnyRole,
  userHasGlobalWarehouseAccess,
} from "@/lib/permissions";

/**
 * Hook return type with permission checking methods
 */
interface UsePermissionsReturn extends UserPermissionsContext {
  // Permission checking methods
  can: (permission: Permission, requireAll?: boolean) => boolean;
  canViewAll: (permission: Permission) => boolean;
  canViewOwn: (permission: Permission) => boolean;
  
  // Role checking methods
  hasRole: (role: UserRole) => boolean;
  hasAnyOfRoles: (roles: UserRole[]) => boolean;
  hasAllOfRoles: (roles: UserRole[]) => boolean;
  
  // Warehouse methods
  canAccessWarehouse: (warehouseCode: WarehouseCode) => boolean;
  hasAllWarehouseAccess: boolean;
  
  // Utility methods
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isSupervisor: boolean;
  isStaff: boolean;
  isGM: boolean;
  isOpsManager: boolean;
}

/**
 * React hook for permission-based access control
 * 
 * Usage:
 * ```tsx
 * const { can, hasRole, warehouses, canAccessWarehouse } = usePermissions();
 * 
 * if (can('view_dashboard')) {
 *   // Show dashboard
 * }
 * 
 * if (hasRole('admin')) {
 *   // Show admin features
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { user, loading: authLoading } = useAuth();
  
  // State for permissions data
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord>({});
  const [warehouses, setWarehouses] = useState<WarehouseCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = user?.id || null;

  /**
   * Fetch all permission data from the database
   */
  const fetchPermissionData = useCallback(async () => {
    if (!userId) {
      setRoles([]);
      setPermissions({});
      setWarehouses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch roles, warehouses, and permissions in parallel
      const [rolesResult, warehousesResult, permissionsResult] = await Promise.all([
        fetchUserRoles(userId),
        fetchUserWarehouses(userId),
        fetchUserPermissions(userId),
      ]);

      // Handle errors
      if (rolesResult.error) throw rolesResult.error;
      if (warehousesResult.error) throw warehousesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;

      setRoles(rolesResult.roles);
      setWarehouses(warehousesResult.warehouses);
      
      // Use effective permissions from database or fallback to matrix
      const effectivePerms = permissionsResult.permissions && 
        Object.keys(permissionsResult.permissions).length > 0
        ? permissionsResult.permissions
        : getEffectivePermissions(rolesResult.roles);
      
      setPermissions(effectivePerms);
    } catch (err) {
      console.error("Error fetching permission data:", err);
      setError(err instanceof Error ? err : new Error("Failed to load permissions"));
      
      // Fallback to empty state on error
      setRoles([]);
      setPermissions({});
      setWarehouses([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch permission data when user changes
  useEffect(() => {
    fetchPermissionData();
  }, [fetchPermissionData]);

  /**
   * Check if user has a specific permission
   */
  const can = useCallback(
    (permission: Permission, requireAll = false): boolean => {
      if (!userId) return false;
      return checkPermission(permissions, permission, requireAll);
    },
    [permissions, userId]
  );

  /**
   * Check if user can view all resources (not just own)
   */
  const canViewAll = useCallback(
    (permission: Permission): boolean => {
      if (!userId) return false;
      return permissions[permission] === "all";
    },
    [permissions, userId]
  );

  /**
   * Check if user can view own resources
   */
  const canViewOwn = useCallback(
    (permission: Permission): boolean => {
      if (!userId) return false;
      const value = permissions[permission];
      return value === true || value === "own" || value === "all";
    },
    [permissions, userId]
  );

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return roles.includes(role);
    },
    [roles]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyOfRoles = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      return hasAnyRole(roles, requiredRoles);
    },
    [roles]
  );

  /**
   * Check if user has all of the specified roles
   */
  const hasAllOfRoles = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      return requiredRoles.every((role) => roles.includes(role));
    },
    [roles]
  );

  /**
   * Check if user can access a specific warehouse
   */
  const canAccessWarehouse = useCallback(
    (warehouseCode: WarehouseCode): boolean => {
      if (!userId) return false;
      // Check if user has global warehouse access
      if (userHasGlobalWarehouseAccess(roles)) return true;
      // Check specific warehouse assignment
      return warehouses.includes(warehouseCode);
    },
    [warehouses, roles, userId]
  );

  /**
   * Check if user has access to all warehouses
   */
  const hasAllWarehouseAccess = useMemo(() => {
    return userHasGlobalWarehouseAccess(roles);
  }, [roles]);

  /**
   * Convenience role checks
   */
  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);
  const isSupervisor = useMemo(() => roles.includes("supervisor"), [roles]);
  const isStaff = useMemo(() => roles.includes("staff"), [roles]);
  const isGM = useMemo(() => roles.includes("gm"), [roles]);
  const isOpsManager = useMemo(() => roles.includes("ops_manager"), [roles]);

  /**
   * Refresh permission data from the database
   */
  const refresh = useCallback(async () => {
    await fetchPermissionData();
  }, [fetchPermissionData]);

  return {
    // Base context
    userId: userId || "",
    roles,
    permissions,
    warehouses,
    isLoading: authLoading || isLoading,
    error,
    
    // Permission methods
    can,
    canViewAll,
    canViewOwn,
    
    // Role methods
    hasRole,
    hasAnyOfRoles,
    hasAllOfRoles,
    
    // Warehouse methods
    canAccessWarehouse,
    hasAllWarehouseAccess,
    
    // Utility
    refresh,
    
    // Convenience flags
    isAdmin,
    isSupervisor,
    isStaff,
    isGM,
    isOpsManager,
  };
}

/**
 * Hook to check if a specific permission is granted
 * Useful for conditional rendering
 * 
 * Usage:
 * ```tsx
 * const canEdit = useCan('edit_transactions');
 * ```
 */
export function useCan(
  permission: Permission,
  requireAll = false
): boolean {
  const { can } = usePermissions();
  return can(permission, requireAll);
}

/**
 * Hook to check if user has a specific role
 * 
 * Usage:
 * ```tsx
 * const isAdmin = useHasRole('admin');
 * ```
 */
export function useHasRole(role: UserRole): boolean {
  const { hasRole } = usePermissions();
  return hasRole(role);
}

/**
 * Hook to get user's warehouse assignments
 * 
 * Usage:
 * ```tsx
 * const { warehouses, canAccessWarehouse } = useWarehouses();
 * ```
 */
export function useWarehouses(): {
  warehouses: WarehouseCode[];
  canAccessWarehouse: (code: WarehouseCode) => boolean;
  hasAllAccess: boolean;
  isLoading: boolean;
} {
  const { warehouses, canAccessWarehouse, hasAllWarehouseAccess, isLoading } =
    usePermissions();
  
  return {
    warehouses,
    canAccessWarehouse,
    hasAllAccess: hasAllWarehouseAccess,
    isLoading,
  };
}
