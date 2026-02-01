/**
 * Transactions API Route
 * 
 * Example API route demonstrating RBAC protection with warehouse isolation.
 * 
 * - GET /api/transactions - List transactions (filtered by warehouse access)
 * - POST /api/transactions - Create transaction (requires create_transactions permission)
 * - PUT /api/transactions/:id - Update transaction (requires edit_transactions permission)
 * - DELETE /api/transactions/:id - Delete transaction (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck, getUserWarehouseFilter } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/transactions
 * List transactions with warehouse filtering
 */
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { requiredPermission: "view_transactions" },
    async ({ userId, warehouses, permissions }) => {
      const supabase = await createClient();
      
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const warehouseFilter = searchParams.get("warehouse");
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      
      // Validate warehouse filter against user's accessible warehouses
      let allowedWarehouses = warehouses;
      if (warehouseFilter) {
        if (!warehouses.includes(warehouseFilter as import("@/types/rbac").WarehouseCode)) {
          return NextResponse.json(
            { error: "You do not have access to the specified warehouse" },
            { status: 403 }
          );
        }
        allowedWarehouses = [warehouseFilter as import("@/types/rbac").WarehouseCode];
      }
      
      // Build query with warehouse filter
      let query = supabase
        .from("ro_process")
        .select("*", { count: "exact" })
        .in("warehouse", allowedWarehouses)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      // If user can only view own transactions, filter by user_id
      const canViewAll = permissions["view_transactions"] === "all";
      if (!canViewAll) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
          { error: "Failed to fetch transactions" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        data,
        meta: {
          total: count,
          limit,
          offset,
          hasMore: count ? offset + limit < count : false,
        },
      });
    }
  );
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { requiredPermission: "create_transactions" },
    async ({ userId, warehouses }) => {
      const supabase = await createClient();
      
      try {
        const body = await request.json();
        
        // Validate warehouse access
        if (!body.warehouse) {
          return NextResponse.json(
            { error: "Warehouse is required" },
            { status: 400 }
          );
        }
        
        if (!warehouses.includes(body.warehouse)) {
          return NextResponse.json(
            { error: "You do not have access to the specified warehouse" },
            { status: 403 }
          );
        }
        
        // Insert transaction
        const { data, error } = await supabase
          .from("ro_process")
          .insert({
            ...body,
            user_id: userId,
            created_by: userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating transaction:", error);
          return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ data }, { status: 201 });
      } catch (err) {
        console.error("Error processing request:", err);
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        );
      }
    }
  );
}
