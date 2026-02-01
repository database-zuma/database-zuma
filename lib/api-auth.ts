/**
 * API Route Protection
 * 
 * Server-side utilities for protecting API routes with RBAC.
 * These functions check permissions before allowing API access.
 * 
 * All API routes should use these utilities to ensure proper authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Permission,
  PermissionRecord,
  UserRole,
  WarehouseCode,
} from "@/types/rbac";
import { getEffectivePermissions, hasPermissionValue } from "@/lib/permissions";

/**
 * Result of API permission check
 */
export interface ApiPermissionCheckResult {
  allowed: boolean;
  userId?: string;
  roles: UserRole[];
  permissions: PermissionRecord;
  warehouses: WarehouseCode[];
  error?: string;
  statusCode: number;
}

/**
 * Check API request permissions
 * Verifies authentication and authorization for API routes
 */
export async function checkApiPermissions(
  request: NextRequest,
  options: {
    requiredPermission?: Permission;
    requiredRoles?: UserRole[];
    requireAll?: boolean;
    requireAllRoles?: boolean;
  } = {}
): Promise<ApiPermissionCheckResult> {
  const supabase = await createClient();
  
  // Get current session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Check authentication
  if (authError || !user) {
    return {
      allowed: false,
      roles: [],
      permissions: {},
      warehouses: [],
      error: "Unauthorized - Authentication required",
      statusCode: 401,
    };
  }

  const userId = user.id;

  try {
    // Fetch user roles
    const { data: roleData, error: roleError } = await supabase
      .from("wms_user_roles")
      .select(`
        role:role_id (
          name
        )
      `)
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error fetching user roles:", roleError);
      return {
        allowed: false,
        userId,
        roles: [],
        permissions: {},
        warehouses: [],
        error: "Failed to verify permissions",
        statusCode: 500,
      };
    }

    const roles = (roleData || [])
      .map((item) => {
        // Supabase returns joined relation as array
        const roleArray = item.role as unknown as { name: UserRole }[];
        return roleArray?.[0]?.name;
      })
      .filter((name): name is UserRole => Boolean(name));

    // Get effective permissions from roles
    const permissions = getEffectivePermissions(roles);

    // Check if user has global warehouse access
    const hasGlobalAccess = roles.some((role) =>
      ["admin", "gm", "ops_manager"].includes(role)
    );

    // Fetch warehouses
    let warehouses: WarehouseCode[] = [];
    if (hasGlobalAccess) {
      warehouses = ["DDD", "LJBB", "MBB", "UBB"];
    } else {
      const { data: warehouseData, error: warehouseError } = await supabase
        .from("wms_user_warehouses")
        .select("warehouse_code")
        .eq("user_id", userId);

      if (!warehouseError && warehouseData) {
        warehouses = warehouseData
          .map((item: { warehouse_code: WarehouseCode }) => item.warehouse_code)
          .filter((code): code is WarehouseCode => Boolean(code));
      }
    }

    // Check role requirements
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      const hasRequiredRole = options.requireAllRoles
        ? options.requiredRoles.every((role) => roles.includes(role))
        : options.requiredRoles.some((role) => roles.includes(role));

      if (!hasRequiredRole) {
        return {
          allowed: false,
          userId,
          roles,
          permissions,
          warehouses,
          error: `Forbidden - Requires ${options.requireAllRoles ? "all" : "one"} of: ${options.requiredRoles.join(", ")}`,
          statusCode: 403,
        };
      }
    }

    // Check permission requirements
    if (options.requiredPermission) {
      const hasPermission = hasPermissionValue(
        permissions[options.requiredPermission],
        options.requireAll
      );

      if (!hasPermission) {
        return {
          allowed: false,
          userId,
          roles,
          permissions,
          warehouses,
          error: `Forbidden - Missing required permission: ${options.requiredPermission}`,
          statusCode: 403,
        };
      }
    }

    // All checks passed
    return {
      allowed: true,
      userId,
      roles,
      permissions,
      warehouses,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error checking API permissions:", error);
    return {
      allowed: false,
      userId,
      roles: [],
      permissions: {},
      warehouses: [],
      error: "Internal server error during permission check",
      statusCode: 500,
    };
  }
}

/**
 * Middleware to protect API routes
 * Returns a NextResponse if access is denied, null if allowed
 */
export async function protectApiRoute(
  request: NextRequest,
  options: {
    requiredPermission?: Permission;
    requiredRoles?: UserRole[];
    requireAll?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const result = await checkApiPermissions(request, options);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: result.error,
        code: result.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      },
      { status: result.statusCode }
    );
  }

  return null;
}

/**
 * Check warehouse access for API route
 */
export async function checkWarehouseAccess(
  request: NextRequest,
  warehouseCode: WarehouseCode
): Promise<{
  allowed: boolean;
  userId?: string;
  error?: string;
  statusCode: number;
}> {
  const supabase = await createClient();

  // Get current session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      allowed: false,
      error: "Unauthorized - Authentication required",
      statusCode: 401,
    };
  }

  const userId = user.id;

  try {
    // Use database function to check warehouse access
    const { data, error } = await supabase.rpc("has_warehouse_access", {
      p_user_id: userId,
      p_warehouse_code: warehouseCode,
    });

    if (error) {
      console.error("Error checking warehouse access:", error);
      return {
        allowed: false,
        userId,
        error: "Failed to verify warehouse access",
        statusCode: 500,
      };
    }

    if (!data) {
      return {
        allowed: false,
        userId,
        error: `Forbidden - You do not have access to warehouse ${warehouseCode}`,
        statusCode: 403,
      };
    }

    return {
      allowed: true,
      userId,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Exception checking warehouse access:", error);
    return {
      allowed: false,
      userId,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}

/**
 * Log permission failure for security audit
 */
export function logPermissionFailure(
  userId: string,
  path: string,
  reason: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    path,
    reason,
    userAgent: metadata?.userAgent || "unknown",
    ip: metadata?.ip || "unknown",
    ...metadata,
  };

  // Log to console (in production, send to logging service)
  console.warn("[PERMISSION_DENIED]", JSON.stringify(logEntry));
}

/**
 * Wrapper for API route handlers with permission checking
 * 
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withPermissionCheck(request, {
 *     requiredPermission: 'view_transactions'
 *   }, async (context) => {
 *     // Handler code here - only runs if permission check passes
 *     const { userId, warehouses } = context;
 *     // ... fetch and return data
 *   });
 * }
 * ```
 */
export async function withPermissionCheck(
  request: NextRequest,
  options: {
    requiredPermission?: Permission;
    requiredRoles?: UserRole[];
    requireAll?: boolean;
  },
  handler: (context: {
    userId: string;
    roles: UserRole[];
    permissions: PermissionRecord;
    warehouses: WarehouseCode[];
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await checkApiPermissions(request, options);

  if (!result.allowed) {
    // Log the failure for security audit
    if (result.userId) {
      logPermissionFailure(result.userId, request.url, result.error || "Unknown", {
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json(
      {
        error: result.error,
        code: result.statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      },
      { status: result.statusCode }
    );
  }

  // Call the handler with the permission context
  return handler({
    userId: result.userId!,
    roles: result.roles,
    permissions: result.permissions,
    warehouses: result.warehouses,
  });
}

/**
 * Create a filtered query based on warehouse access
 * Returns warehouse codes the user can access
 */
export async function getUserWarehouseFilter(
  userId: string
): Promise<{
  warehouses: WarehouseCode[];
  hasAllAccess: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Check if user has global warehouse access
    const { data: roleData } = await supabase
      .from("wms_user_roles")
      .select(`
        role:role_id (
          name
        )
      `)
      .eq("user_id", userId);

    const roles = (roleData || [])
      .map((item) => {
        const roleArray = item.role as unknown as { name: UserRole }[];
        return roleArray?.[0]?.name;
      })
      .filter((name): name is UserRole => Boolean(name));

    const hasAllAccess = roles.some((role) =>
      ["admin", "gm", "ops_manager"].includes(role)
    );

    if (hasAllAccess) {
      return {
        warehouses: ["DDD", "LJBB", "MBB", "UBB"],
        hasAllAccess: true,
      };
    }

    // Get assigned warehouses
    const { data: warehouseData, error } = await supabase
      .from("wms_user_warehouses")
      .select("warehouse_code")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching warehouses:", error);
      return {
        warehouses: [],
        hasAllAccess: false,
        error: "Failed to fetch warehouse access",
      };
    }

    const warehouses = (warehouseData || [])
      .map((item: { warehouse_code: WarehouseCode }) => item.warehouse_code)
      .filter((code): code is WarehouseCode => Boolean(code));

    return {
      warehouses,
      hasAllAccess: false,
    };
  } catch (error) {
    console.error("Exception fetching warehouse filter:", error);
    return {
      warehouses: [],
      hasAllAccess: false,
      error: "Internal error",
    };
  }
}
