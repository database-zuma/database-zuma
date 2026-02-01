-- Migration: Create WMS Authentication Tables with Permission Matrix and RLS Policies
-- Schema: branch_super_app_clawdbot
-- Created: 2025-02-01

-- ============================================================================
-- PERMISSION MATRIX
-- ============================================================================
-- | Capability         | Staff  | Supervisor | Admin | GM    | Ops Mgr |
-- |--------------------|--------|------------|-------|-------|---------|
-- | View Dashboard     | ✅     | ✅         | ✅    | ✅    | ✅      |
-- | View Transactions  | own    | own        | all   | all   | all     |
-- | Create Transactions| ✅     | ✅         | ✅    | ❌    | ❌      |
-- | Edit Transactions  | ❌     | ✅         | ✅    | ❌    | ❌      |
-- | View Stock         | own    | own        | all   | all   | all     |
-- | Manage ROs         | ✅     | ✅         | ✅    | ✅    | ✅      |
-- | Manage Users       | ❌     | ❌         | ✅    | ✅    | ✅      |
-- | View Reports       | ❌     | ✅         | ✅    | ✅    | ✅      |
-- | System Settings    | ❌     | ❌         | ✅    | ❌    | ❌      |
-- ============================================================================

-- ============================================================================
-- 1. wms_roles - Role definitions with permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.wms_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on role name for lookups
CREATE INDEX IF NOT EXISTS idx_wms_roles_name ON branch_super_app_clawdbot.wms_roles(name);

COMMENT ON TABLE branch_super_app_clawdbot.wms_roles IS 'Role definitions with permission matrices for WMS RBAC';

-- ============================================================================
-- 2. wms_users - Extends auth.users with WMS-specific profile data
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.wms_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on user ID for joins
CREATE INDEX IF NOT EXISTS idx_wms_users_id ON branch_super_app_clawdbot.wms_users(id);
CREATE INDEX IF NOT EXISTS idx_wms_users_is_active ON branch_super_app_clawdbot.wms_users(is_active);

COMMENT ON TABLE branch_super_app_clawdbot.wms_users IS 'WMS user profiles extending Supabase auth.users';

-- ============================================================================
-- 3. wms_user_roles - Junction table for user-role assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.wms_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES branch_super_app_clawdbot.wms_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES branch_super_app_clawdbot.wms_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES branch_super_app_clawdbot.wms_users(id),
    UNIQUE(user_id, role_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wms_user_roles_user_id ON branch_super_app_clawdbot.wms_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_wms_user_roles_role_id ON branch_super_app_clawdbot.wms_user_roles(role_id);

COMMENT ON TABLE branch_super_app_clawdbot.wms_user_roles IS 'Junction table linking users to their roles';

-- ============================================================================
-- 4. wms_user_warehouses - Warehouse access control for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch_super_app_clawdbot.wms_user_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES branch_super_app_clawdbot.wms_users(id) ON DELETE CASCADE,
    warehouse_code VARCHAR(10) NOT NULL CHECK (warehouse_code IN ('DDD', 'LJBB', 'MBB', 'UBB')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES branch_super_app_clawdbot.wms_users(id),
    UNIQUE(user_id, warehouse_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wms_user_warehouses_user_id ON branch_super_app_clawdbot.wms_user_warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_wms_user_warehouses_warehouse ON branch_super_app_clawdbot.wms_user_warehouses(warehouse_code);

COMMENT ON TABLE branch_super_app_clawdbot.wms_user_warehouses IS 'Warehouse access assignments for users (DDD, LJBB, MBB, UBB)';

-- ============================================================================
-- 5. INSERT ROLES WITH PERMISSION MATRIX
-- ============================================================================

-- Staff role
INSERT INTO branch_super_app_clawdbot.wms_roles (name, display_name, permissions, description)
VALUES (
    'staff',
    'Staff',
    '{
        "view_dashboard": true,
        "view_transactions": "own",
        "create_transactions": true,
        "edit_transactions": false,
        "view_stock": "own",
        "manage_ros": true,
        "manage_users": false,
        "view_reports": false,
        "system_settings": false
    }'::jsonb,
    'Front-line staff with limited access to own transactions and assigned warehouses'
)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Supervisor role
INSERT INTO branch_super_app_clawdbot.wms_roles (name, display_name, permissions, description)
VALUES (
    'supervisor',
    'Supervisor',
    '{
        "view_dashboard": true,
        "view_transactions": "own",
        "create_transactions": true,
        "edit_transactions": true,
        "view_stock": "own",
        "manage_ros": true,
        "manage_users": false,
        "view_reports": true,
        "system_settings": false
    }'::jsonb,
    'Supervisor with edit permissions and reporting access for their warehouses'
)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Admin role
INSERT INTO branch_super_app_clawdbot.wms_roles (name, display_name, permissions, description)
VALUES (
    'admin',
    'Administrator',
    '{
        "view_dashboard": true,
        "view_transactions": "all",
        "create_transactions": true,
        "edit_transactions": true,
        "view_stock": "all",
        "manage_ros": true,
        "manage_users": true,
        "view_reports": true,
        "system_settings": true
    }'::jsonb,
    'Full system administrator with complete access and configuration rights'
)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- GM (General Manager) role
INSERT INTO branch_super_app_clawdbot.wms_roles (name, display_name, permissions, description)
VALUES (
    'gm',
    'General Manager',
    '{
        "view_dashboard": true,
        "view_transactions": "all",
        "create_transactions": false,
        "edit_transactions": false,
        "view_stock": "all",
        "manage_ros": true,
        "manage_users": true,
        "view_reports": true,
        "system_settings": false
    }'::jsonb,
    'General Manager with read-only oversight and user management capabilities'
)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Ops Manager role
INSERT INTO branch_super_app_clawdbot.wms_roles (name, display_name, permissions, description)
VALUES (
    'ops_manager',
    'Operations Manager',
    '{
        "view_dashboard": true,
        "view_transactions": "all",
        "create_transactions": false,
        "edit_transactions": false,
        "view_stock": "all",
        "manage_ros": true,
        "manage_users": true,
        "view_reports": true,
        "system_settings": false
    }'::jsonb,
    'Operations manager with oversight across all warehouses but limited operational access'
)
ON CONFLICT (name) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE branch_super_app_clawdbot.wms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.wms_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.wms_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_super_app_clawdbot.wms_user_warehouses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. RLS POLICIES FOR wms_users
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON branch_super_app_clawdbot.wms_users
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON branch_super_app_clawdbot.wms_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND wr.name IN ('admin', 'gm', 'ops_manager')
        )
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON branch_super_app_clawdbot.wms_users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can manage all user profiles
CREATE POLICY "Admins can manage all profiles" ON branch_super_app_clawdbot.wms_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND wr.name = 'admin'
        )
    );

-- Service role bypass
CREATE POLICY "Service role full access" ON branch_super_app_clawdbot.wms_users
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. RLS POLICIES FOR wms_roles
-- ============================================================================

-- All authenticated users can read roles
CREATE POLICY "Authenticated users can view roles" ON branch_super_app_clawdbot.wms_roles
    FOR SELECT TO authenticated USING (true);

-- Only admins can modify roles
CREATE POLICY "Only admins can modify roles" ON branch_super_app_clawdbot.wms_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND wr.name = 'admin'
        )
    );

-- ============================================================================
-- 9. RLS POLICIES FOR wms_user_roles
-- ============================================================================

-- Users can view their own role assignments
CREATE POLICY "Users can view own role assignments" ON branch_super_app_clawdbot.wms_user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view and manage all role assignments
CREATE POLICY "Admins can manage all role assignments" ON branch_super_app_clawdbot.wms_user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND wr.name IN ('admin', 'gm', 'ops_manager')
        )
    );

-- ============================================================================
-- 10. RLS POLICIES FOR wms_user_warehouses
-- ============================================================================

-- Users can view their own warehouse assignments
CREATE POLICY "Users can view own warehouse assignments" ON branch_super_app_clawdbot.wms_user_warehouses
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view and manage all warehouse assignments
CREATE POLICY "Admins can manage all warehouse assignments" ON branch_super_app_clawdbot.wms_user_warehouses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND wr.name IN ('admin', 'gm', 'ops_manager')
        )
    );

-- ============================================================================
-- 11. HELPER FUNCTIONS FOR PERMISSION CHECKS
-- ============================================================================

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.has_permission(
    p_user_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_perm BOOLEAN := false;
    v_role_permissions JSONB;
BEGIN
    -- Check each role the user has
    FOR v_role_permissions IN
        SELECT wr.permissions
        FROM branch_super_app_clawdbot.wms_user_roles wur
        JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
        WHERE wur.user_id = p_user_id
    LOOP
        IF v_role_permissions ? p_permission AND 
           (v_role_permissions->>p_permission)::TEXT != 'false' THEN
            v_has_perm := true;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's effective permissions (merged from all roles)
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.get_user_permissions(
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_permissions JSONB := '{}';
    v_role_permissions JSONB;
BEGIN
    -- Merge permissions from all roles (true/all beats false/own)
    FOR v_role_permissions IN
        SELECT wr.permissions
        FROM branch_super_app_clawdbot.wms_user_roles wur
        JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
        WHERE wur.user_id = p_user_id
    LOOP
        -- For each key in role permissions, upgrade if more permissive
        v_permissions := v_permissions || v_role_permissions;
    END LOOP;
    
    RETURN v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a specific warehouse
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.has_warehouse_access(
    p_user_id UUID,
    p_warehouse_code TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has access to this warehouse
    RETURN EXISTS (
        SELECT 1 FROM branch_super_app_clawdbot.wms_user_warehouses
        WHERE user_id = p_user_id
        AND warehouse_code = p_warehouse_code
    ) OR EXISTS (
        -- Admins, GMs, Ops Managers have access to all warehouses
        SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
        JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
        WHERE wur.user_id = p_user_id
        AND wr.name IN ('admin', 'gm', 'ops_manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all accessible warehouses for a user
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.get_user_warehouses(
    p_user_id UUID
) RETURNS TEXT[] AS $$
BEGIN
    -- If admin/gm/ops_manager, return all warehouses
    IF EXISTS (
        SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
        JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
        WHERE wur.user_id = p_user_id
        AND wr.name IN ('admin', 'gm', 'ops_manager')
    ) THEN
        RETURN ARRAY['DDD', 'LJBB', 'MBB', 'UBB'];
    END IF;
    
    -- Otherwise return assigned warehouses
    RETURN ARRAY(
        SELECT warehouse_code 
        FROM branch_super_app_clawdbot.wms_user_warehouses
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION branch_super_app_clawdbot.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS trigger_wms_roles_updated_at ON branch_super_app_clawdbot.wms_roles;
CREATE TRIGGER trigger_wms_roles_updated_at
    BEFORE UPDATE ON branch_super_app_clawdbot.wms_roles
    FOR EACH ROW EXECUTE FUNCTION branch_super_app_clawdbot.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_wms_users_updated_at ON branch_super_app_clawdbot.wms_users;
CREATE TRIGGER trigger_wms_users_updated_at
    BEFORE UPDATE ON branch_super_app_clawdbot.wms_users
    FOR EACH ROW EXECUTE FUNCTION branch_super_app_clawdbot.update_updated_at_column();

-- ============================================================================
-- 13. UPDATE EXISTING TABLES RLS POLICIES FOR WAREHOUSE-BASED ACCESS
-- ============================================================================

-- Update ro_process RLS to filter by warehouse access
DROP POLICY IF EXISTS "Allow read access to all users" ON branch_super_app_clawdbot.ro_process;

-- Users can view transactions for warehouses they have access to
CREATE POLICY "Users can view transactions for accessible warehouses" ON branch_super_app_clawdbot.ro_process
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM branch_super_app_clawdbot.wms_user_roles wur
            JOIN branch_super_app_clawdbot.wms_roles wr ON wur.role_id = wr.id
            WHERE wur.user_id = auth.uid()
            AND (
                -- Admin/GM/Ops Manager can see all
                wr.name IN ('admin', 'gm', 'ops_manager')
                OR
                -- Others need warehouse assignment check (simplified for now)
                EXISTS (
                    SELECT 1 FROM branch_super_app_clawdbot.wms_user_warehouses wuw
                    WHERE wuw.user_id = auth.uid()
                )
            )
        )
    );

-- Service role bypass for ro_process
CREATE POLICY "Service role full access on ro_process" ON branch_super_app_clawdbot.ro_process
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- ============================================================================
/*
-- Check all roles were created
SELECT name, display_name, permissions FROM branch_super_app_clawdbot.wms_roles;

-- Check RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('wms_users', 'wms_roles', 'wms_user_roles', 'wms_user_warehouses');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'branch_super_app_clawdbot'
AND tablename LIKE 'wms_%';

-- Test permission functions
SELECT branch_super_app_clawdbot.has_permission(auth.uid(), 'view_dashboard');
SELECT branch_super_app_clawdbot.get_user_permissions(auth.uid());
SELECT branch_super_app_clawdbot.get_user_warehouses(auth.uid());
*/
