"use client";

/**
 * PermissionGuard Component
 * 
 * Conditionally renders children based on permission requirements.
 * Shows fallback content or null if permission check fails.
 * 
 * SECURITY NOTE: This is a UI convenience component. Always rely on 
 * RLS policies and server-side validation for actual security.
 */

import { ReactNode } from "react";
import { Permission, UserRole } from "@/types/rbac";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  /**
   * Content to render if permission check passes
   */
  children: ReactNode;
  
  /**
   * Content to render if permission check fails
   * If not provided, renders null on failure
   */
  fallback?: ReactNode;
  
  /**
   * Required permission to view the content
   */
  permission?: Permission;
  
  /**
   * Required roles to view the content
   * User must have at least one of the specified roles
   */
  roles?: UserRole[];
  
  /**
   * If true, permission must grant "all" access (not just "own")
   * Only applies when permission is specified
   */
  requireAll?: boolean;
  
  /**
   * If true, user must have ALL specified roles (not just one)
   * Only applies when roles is specified
   */
  requireAllRoles?: boolean;
  
  /**
   * If true, shows nothing while loading permission data
   * If false, renders children optimistically while loading
   * @default true
   */
  hideWhileLoading?: boolean;
}

/**
 * Guard component that conditionally renders based on permissions
 * 
 * Usage:
 * ```tsx
 * // Require specific permission
 * <PermissionGuard permission="manage_users">
 *   <UserManagementPanel />
 * </PermissionGuard>
 * 
 * // Require specific role
 * <PermissionGuard roles={['admin', 'gm']}>
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * // With fallback content
 * <PermissionGuard 
 *   permission="edit_transactions"
 *   fallback={<p>You don't have permission to edit</p>}
 * >
 *   <EditButton />
 * </PermissionGuard>
 * 
 * // Require all-access (not just own)
 * <PermissionGuard permission="view_transactions" requireAll>
 *   <AllTransactionsView />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  fallback = null,
  permission,
  roles,
  requireAll = false,
  requireAllRoles = false,
  hideWhileLoading = true,
}: PermissionGuardProps): ReactNode {
  const { can, hasAnyOfRoles, hasAllOfRoles, isLoading } = usePermissions();
  
  // Handle loading state
  if (isLoading && hideWhileLoading) {
    return null;
  }
  
  // Check permission if specified
  if (permission) {
    const hasPermission = can(permission, requireAll);
    if (!hasPermission) {
      return fallback;
    }
  }
  
  // Check roles if specified
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAllRoles
      ? hasAllOfRoles(roles)
      : hasAnyOfRoles(roles);
    
    if (!hasRequiredRoles) {
      return fallback;
    }
  }
  
  // All checks passed, render children
  return children;
}

/**
 * Props for RoleGuard component
 */
interface RoleGuardProps {
  /**
   * Content to render if role check passes
   */
  children: ReactNode;
  
  /**
   * Content to render if role check fails
   */
  fallback?: ReactNode;
  
  /**
   * Required roles - user must have at least one
   */
  roles: UserRole[];
  
  /**
   * If true, user must have ALL specified roles
   * @default false
   */
  requireAll?: boolean;
  
  /**
   * If true, shows nothing while loading
   * @default true
   */
  hideWhileLoading?: boolean;
}

/**
 * Guard component that conditionally renders based on user roles
 * 
 * Usage:
 * ```tsx
 * // Require any of the roles
 * <RoleGuard roles={['admin', 'gm']}>
 *   <AdminFeatures />
 * </RoleGuard>
 * 
 * // Require all roles
 * <RoleGuard roles={['supervisor', 'admin']} requireAll>
 *   <SupervisorAdminFeatures />
 * </RoleGuard>
 * 
 * // With fallback
 * <RoleGuard 
 *   roles={['admin']}
 *   fallback={<p>Admin access required</p>}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  fallback = null,
  roles,
  requireAll = false,
  hideWhileLoading = true,
}: RoleGuardProps): ReactNode {
  const { hasAnyOfRoles, hasAllOfRoles, isLoading } = usePermissions();
  
  // Handle loading state
  if (isLoading && hideWhileLoading) {
    return null;
  }
  
  // Check roles
  const hasRequiredRoles = requireAll
    ? hasAllOfRoles(roles)
    : hasAnyOfRoles(roles);
  
  if (!hasRequiredRoles) {
    return fallback;
  }
  
  return children;
}

/**
 * Props for WarehouseGuard component
 */
interface WarehouseGuardProps {
  /**
   * Content to render if warehouse access check passes
   */
  children: ReactNode;
  
  /**
   * Content to render if access check fails
   */
  fallback?: ReactNode;
  
  /**
   * Warehouse code to check access for
   */
  warehouseCode: string;
  
  /**
   * If true, shows nothing while loading
   * @default true
   */
  hideWhileLoading?: boolean;
}

/**
 * Guard component that conditionally renders based on warehouse access
 * 
 * Usage:
 * ```tsx
 * <WarehouseGuard warehouseCode="DDD">
 *   <WarehouseDashboard warehouse="DDD" />
 * </WarehouseGuard>
 * 
 * // With fallback
 * <WarehouseGuard 
 *   warehouseCode="LJBB"
 *   fallback={<AccessDenied message="You don't have access to LJBB" />}
 * >
 *   <LJBBOperations />
 * </WarehouseGuard>
 * ```
 */
export function WarehouseGuard({
  children,
  fallback = null,
  warehouseCode,
  hideWhileLoading = true,
}: WarehouseGuardProps): ReactNode {
  const { canAccessWarehouse, isLoading } = usePermissions();
  
  // Handle loading state
  if (isLoading && hideWhileLoading) {
    return null;
  }
  
  // Check warehouse access
  const hasAccess = canAccessWarehouse(warehouseCode as import("@/types/rbac").WarehouseCode);
  
  if (!hasAccess) {
    return fallback;
  }
  
  return children;
}

/**
 * Props for AdminGuard component
 */
interface AdminGuardProps {
  /**
   * Content to render if user is an admin
   */
  children: ReactNode;
  
  /**
   * Content to render if user is not an admin
   */
  fallback?: ReactNode;
  
  /**
   * If true, shows nothing while loading
   * @default true
   */
  hideWhileLoading?: boolean;
}

/**
 * Convenience guard for admin-only content
 * 
 * Usage:
 * ```tsx
 * <AdminGuard>
 *   <SystemSettings />
 * </AdminGuard>
 * 
 * // With fallback
 * <AdminGuard fallback={<p>Admin access required</p>}>
 *   <UserManagement />
 * </AdminGuard>
 * ```
 */
export function AdminGuard({
  children,
  fallback = null,
  hideWhileLoading = true,
}: AdminGuardProps): ReactNode {
  return (
    <RoleGuard 
      roles={["admin"]} 
      fallback={fallback}
      hideWhileLoading={hideWhileLoading}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Props for ManagerGuard component
 * Guards for GM, Ops Manager, or Admin roles
 */
interface ManagerGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  hideWhileLoading?: boolean;
}

/**
 * Convenience guard for manager-level content (GM, Ops Manager, Admin)
 * 
 * Usage:
 * ```tsx
 * <ManagerGuard>
 *   <ReportsDashboard />
 * </ManagerGuard>
 * ```
 */
export function ManagerGuard({
  children,
  fallback = null,
  hideWhileLoading = true,
}: ManagerGuardProps): ReactNode {
  return (
    <RoleGuard 
      roles={["admin", "gm", "ops_manager"]} 
      fallback={fallback}
      hideWhileLoading={hideWhileLoading}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Props for SupervisorGuard component
 */
interface SupervisorGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  hideWhileLoading?: boolean;
}

/**
 * Convenience guard for supervisor+ content (Supervisor, Admin, GM, Ops Manager)
 * 
 * Usage:
 * ```tsx
 * <SupervisorGuard>
 *   <EditTransactionForm />
 * </SupervisorGuard>
 * ```
 */
export function SupervisorGuard({
  children,
  fallback = null,
  hideWhileLoading = true,
}: SupervisorGuardProps): ReactNode {
  return (
    <RoleGuard 
      roles={["supervisor", "admin", "gm", "ops_manager"]} 
      fallback={fallback}
      hideWhileLoading={hideWhileLoading}
    >
      {children}
    </RoleGuard>
  );
}
