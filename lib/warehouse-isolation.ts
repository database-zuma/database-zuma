/**
 * Warehouse Isolation Utilities
 * 
 * Utilities for enforcing warehouse-level data isolation.
 * These functions ensure users can only access data from warehouses
 * they are assigned to.
 */

import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { WarehouseCode, UserRole } from "@/types/rbac";

/**
 * Warehouse filter options for queries
 */
export interface WarehouseFilterOptions {
  /**
   * User ID to check access for
   */
  userId: string;
  
  /**
   * Specific warehouse to filter by (optional)
   * If provided, will verify user has access to this warehouse
   */
  warehouseCode?: WarehouseCode;
  
  /**
   * If true, returns all warehouses for admin/gm/ops_manager
   * @default true
   */
  allowGlobalAccess?: boolean;
}

/**
 * Result of warehouse filter check
 */
export interface WarehouseFilterResult {
  /**
   * Whether the user has access to any warehouses
   */
  hasAccess: boolean;
  
  /**
   * List of warehouse codes the user can access
   */
  accessibleWarehouses: WarehouseCode[];
  
  /**
   * If warehouseCode was specified, whether user has access to it specifically
   */
  hasSpecificAccess?: boolean;
  
  /**
   * Supabase filter query for the warehouse column
   * Use this in your .eq() or .in() clauses
   */
  filterQuery: {
    column: string;
    value: string | string[];
  };
  
  /**
   * Error message if check failed
   */
  error?: string;
}

/**
 * Get warehouse filter for client-side queries
 * 
 * Usage:
 * ```typescript
 * const filter = await getWarehouseFilter({ userId: '123' });
 * if (!filter.hasAccess) {
 *   // Handle no access
 * }
 * 
 * const { data } = await supabase
 *   .from('transactions')
 *   .select('*')
 *   .in('warehouse', filter.accessibleWarehouses);
 * ```
 */
export async function getWarehouseFilter(
  options: WarehouseFilterOptions
): Promise<WarehouseFilterResult> {
  const supabase = createClient();
  const { userId, warehouseCode, allowGlobalAccess = true } = options;

  try {
    // Check user's roles for global access
    const { data: roleData, error: roleError } = await supabase
      .from("wms_user_roles")
      .select(`
        role:role_id (
          name
        )
      `)
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error fetching roles:", roleError);
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "Failed to verify access",
      };
    }

    const roles = (roleData || [])
      .map((item) => {
        const roleArray = item.role as unknown as { name: UserRole }[];
        return roleArray?.[0]?.name;
      })
      .filter((name): name is UserRole => Boolean(name));

    const hasGlobalAccess = allowGlobalAccess &&
      roles.some((role) => ["admin", "gm", "ops_manager"].includes(role));

    if (hasGlobalAccess) {
      const allWarehouses: WarehouseCode[] = ["DDD", "LJBB", "MBB", "UBB"];
      
      const hasSpecificAccess = warehouseCode
        ? allWarehouses.includes(warehouseCode)
        : undefined;

      return {
        hasAccess: true,
        accessibleWarehouses: allWarehouses,
        hasSpecificAccess,
        filterQuery: warehouseCode
          ? { column: "warehouse", value: warehouseCode }
          : { column: "warehouse", value: allWarehouses },
      };
    }

    const { data: warehouseData, error: warehouseError } = await supabase
      .from("wms_user_warehouses")
      .select("warehouse_code")
      .eq("user_id", userId);

    if (warehouseError) {
      console.error("Error fetching warehouses:", warehouseError);
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "Failed to fetch warehouse assignments",
      };
    }

    const warehouses = (warehouseData || [])
      .map((item: { warehouse_code: WarehouseCode }) => item.warehouse_code)
      .filter((code): code is WarehouseCode => Boolean(code));

    if (warehouses.length === 0) {
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "No warehouse access assigned",
      };
    }

    // Check if specific warehouse access was requested
    const hasSpecificAccess = warehouseCode
      ? warehouses.includes(warehouseCode)
      : undefined;

    return {
      hasAccess: true,
      accessibleWarehouses: warehouses,
      hasSpecificAccess,
      filterQuery: warehouseCode
        ? { column: "warehouse", value: warehouseCode }
        : { column: "warehouse", value: warehouses },
    };
  } catch (error) {
    console.error("Exception in getWarehouseFilter:", error);
    return {
      hasAccess: false,
      accessibleWarehouses: [],
      filterQuery: { column: "warehouse", value: [] },
      error: "Internal error",
    };
  }
}

/**
 * Get warehouse filter for server-side queries
 * Use this in API routes and server components
 */
export async function getServerWarehouseFilter(
  options: WarehouseFilterOptions
): Promise<WarehouseFilterResult> {
  const supabase = await createServerClient();
  const { userId, warehouseCode, allowGlobalAccess = true } = options;

  try {
    // Check user's roles for global access
    const { data: roleData, error: roleError } = await supabase
      .from("wms_user_roles")
      .select(`
        role:role_id (
          name
        )
      `)
      .eq("user_id", userId);

    if (roleError) {
      console.error("Error fetching roles:", roleError);
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "Failed to verify access",
      };
    }

    const roles = (roleData || [])
      .map((item) => {
        const roleArray = item.role as unknown as { name: UserRole }[];
        return roleArray?.[0]?.name;
      })
      .filter((name): name is UserRole => Boolean(name));

    const hasGlobalAccess = allowGlobalAccess &&
      roles.some((role) => ["admin", "gm", "ops_manager"].includes(role));

    if (hasGlobalAccess) {
      const allWarehouses: WarehouseCode[] = ["DDD", "LJBB", "MBB", "UBB"];
      
      const hasSpecificAccess = warehouseCode
        ? allWarehouses.includes(warehouseCode)
        : undefined;

      return {
        hasAccess: true,
        accessibleWarehouses: allWarehouses,
        hasSpecificAccess,
        filterQuery: warehouseCode
          ? { column: "warehouse", value: warehouseCode }
          : { column: "warehouse", value: allWarehouses },
      };
    }

    // Fetch assigned warehouses
    const { data: warehouseData, error: warehouseError } = await supabase
      .from("wms_user_warehouses")
      .select("warehouse_code")
      .eq("user_id", userId);

    if (warehouseError) {
      console.error("Error fetching warehouses:", warehouseError);
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "Failed to fetch warehouse assignments",
      };
    }

    const warehouses = (warehouseData || [])
      .map((item: { warehouse_code: WarehouseCode }) => item.warehouse_code)
      .filter((code): code is WarehouseCode => Boolean(code));

    if (warehouses.length === 0) {
      return {
        hasAccess: false,
        accessibleWarehouses: [],
        filterQuery: { column: "warehouse", value: [] },
        error: "No warehouse access assigned",
      };
    }

    const hasSpecificAccess = warehouseCode
      ? warehouses.includes(warehouseCode)
      : undefined;

    return {
      hasAccess: true,
      accessibleWarehouses: warehouses,
      hasSpecificAccess,
      filterQuery: warehouseCode
        ? { column: "warehouse", value: warehouseCode }
        : { column: "warehouse", value: warehouses },
    };
  } catch (error) {
    console.error("Exception in getServerWarehouseFilter:", error);
    return {
      hasAccess: false,
      accessibleWarehouses: [],
      filterQuery: { column: "warehouse", value: [] },
      error: "Internal error",
    };
  }
}

/**
 * Apply warehouse filter to a Supabase query
 * 
 * Usage:
 * ```typescript
 * const query = supabase.from('transactions').select('*');
 * const filteredQuery = await applyWarehouseFilter(query, userId);
 * const { data } = await filteredQuery;
 * ```
 */
export async function applyWarehouseFilter<T>(
  query: T,
  userId: string,
  warehouseColumn = "warehouse"
): Promise<T | null> {
  const filter = await getServerWarehouseFilter({ userId });
  
  if (!filter.hasAccess) {
    return null;
  }

  // Apply filter to query
  if (Array.isArray(filter.filterQuery.value)) {
    return (query as unknown as { in: (col: string, val: string[]) => T }).in(
      warehouseColumn,
      filter.filterQuery.value
    );
  } else {
    return (query as unknown as { eq: (col: string, val: string) => T }).eq(
      warehouseColumn,
      filter.filterQuery.value
    );
  }
}

/**
 * Verify user can access a specific warehouse
 * 
 * Usage:
 * ```typescript
 * const canAccess = await verifyWarehouseAccess(userId, 'DDD');
 * if (!canAccess) {
 *   throw new Error('Access denied');
 * }
 * ```
 */
export async function verifyWarehouseAccess(
  userId: string,
  warehouseCode: WarehouseCode
): Promise<boolean> {
  const filter = await getServerWarehouseFilter({
    userId,
    warehouseCode,
  });

  return filter.hasAccess && filter.hasSpecificAccess === true;
}

/**
 * Get the SQL filter condition for warehouse queries
 * Useful for raw SQL queries or RPC calls
 */
export function getWarehouseSqlFilter(
  accessibleWarehouses: WarehouseCode[],
  columnName = "warehouse"
): string {
  if (accessibleWarehouses.length === 0) {
    return "FALSE"; // No access
  }
  
  if (accessibleWarehouses.length === 4) {
    // All warehouses - no filter needed, but return TRUE for consistency
    return "TRUE";
  }
  
  const values = accessibleWarehouses
    .map((code) => `'${code}'`)
    .join(", ");
  
  return `${columnName} IN (${values})`;
}

/**
 * Warehouse access error
 */
export class WarehouseAccessError extends Error {
  constructor(
    message: string,
    public warehouseCode?: WarehouseCode,
    public userId?: string
  ) {
    super(message);
    this.name = "WarehouseAccessError";
  }
}

/**
 * Assert user has access to a specific warehouse
 * Throws WarehouseAccessError if access is denied
 */
export async function assertWarehouseAccess(
  userId: string,
  warehouseCode: WarehouseCode
): Promise<void> {
  const hasAccess = await verifyWarehouseAccess(userId, warehouseCode);
  
  if (!hasAccess) {
    throw new WarehouseAccessError(
      `User ${userId} does not have access to warehouse ${warehouseCode}`,
      warehouseCode,
      userId
    );
  }
}
