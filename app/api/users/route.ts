/**
 * User Management API Route
 * 
 * Example API route demonstrating admin-only access.
 * 
 * - GET /api/users - List all users (admin, gm, ops_manager only)
 * - POST /api/users - Create new user (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermissionCheck } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users
 * List all users (manager roles only)
 */
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { requiredRoles: ["admin", "gm", "ops_manager"] },
    async () => {
      const supabase = await createClient();
      
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const roleFilter = searchParams.get("role");
      
      // Build query
      let query = supabase
        .from("wms_users")
        .select(`
          *,
          roles:wms_user_roles(
            role:role_id(name)
          ),
          warehouses:wms_user_warehouses(warehouse_code)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Apply role filter if provided
      if (roleFilter) {
        query = query.filter("wms_user_roles.role.name", "eq", roleFilter);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
          { error: "Failed to fetch users" },
          { status: 500 }
        );
      }
      
      // Transform data for cleaner response
      const transformedData = data?.map((user) => ({
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        roles: user.roles?.map((r: { role: { name: string } }) => r.role?.name).filter(Boolean) || [],
        warehouses: user.warehouses?.map((w: { warehouse_code: string }) => w.warehouse_code) || [],
      }));
      
      return NextResponse.json({
        data: transformedData,
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
 * POST /api/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { requiredRoles: ["admin"] },
    async ({ userId }) => {
      const supabase = await createClient();
      
      try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.email || !body.password) {
          return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            full_name: body.fullName,
          },
        });
        
        if (authError || !authData.user) {
          console.error("Error creating auth user:", authError);
          return NextResponse.json(
            { error: authError?.message || "Failed to create user" },
            { status: 500 }
          );
        }
        
        const newUserId = authData.user.id;
        
        // Create WMS user profile
        const { error: profileError } = await supabase
          .from("wms_users")
          .insert({
            id: newUserId,
            full_name: body.fullName,
            phone: body.phone,
            is_active: true,
          });
        
        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // Attempt to clean up auth user
          await supabase.auth.admin.deleteUser(newUserId);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
        
        // Assign roles if provided
        if (body.roles && body.roles.length > 0) {
          // Fetch role IDs
          const { data: roleData } = await supabase
            .from("wms_roles")
            .select("id, name")
            .in("name", body.roles);
          
          if (roleData && roleData.length > 0) {
            const roleAssignments = roleData.map((role) => ({
              user_id: newUserId,
              role_id: role.id,
              assigned_by: userId,
            }));
            
            await supabase.from("wms_user_roles").insert(roleAssignments);
          }
        }
        
        // Assign warehouses if provided
        if (body.warehouses && body.warehouses.length > 0) {
          const warehouseAssignments = body.warehouses.map((code: string) => ({
            user_id: newUserId,
            warehouse_code: code,
            assigned_by: userId,
          }));
          
          await supabase.from("wms_user_warehouses").insert(warehouseAssignments);
        }
        
        return NextResponse.json(
          { 
            data: {
              id: newUserId,
              email: body.email,
              fullName: body.fullName,
              roles: body.roles || [],
              warehouses: body.warehouses || [],
            }
          },
          { status: 201 }
        );
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
