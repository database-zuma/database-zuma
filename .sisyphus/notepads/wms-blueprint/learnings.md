
## RBAC Implementation Learnings (2026-02-01)

### Permission Value System
Using `boolean | "own" | "all"` for permission values allows granular access control:
- `true` - Basic access granted
- `"own"` - Access to own resources only
- `"all"` - Access to all resources
- `false` - Access denied

This pattern maps perfectly to the permission matrix requirements.

### Supabase Join Type Handling
When using Supabase joins with foreign key relations, the result is always an array:
```typescript
// Instead of:
.map((item: { role: { name: UserRole } }) => item.role?.name)

// Use:
.map((item) => {
  const roleArray = item.role as unknown as { name: UserRole }[];
  return roleArray?.[0]?.name;
})
```

### Multiple Role Permission Merging
When a user has multiple roles, merge permissions with priority:
`"all" > "own" > true > false`

This ensures the most permissive access is granted.

### Warehouse Isolation Pattern
Check roles for global access first, then fall back to explicit assignments:
```typescript
const hasGlobalAccess = roles.some(r => ['admin', 'gm', 'ops_manager'].includes(r));
if (hasGlobalAccess) return ALL_WAREHOUSES;
// Otherwise fetch from wms_user_warehouses
```

### API Route Wrapper Pattern
The `withPermissionCheck()` wrapper provides clean separation:
- Authentication check
- Permission validation
- Context injection (userId, roles, permissions, warehouses)
- Consistent error handling

### Issues Encountered

1. **Type Export Conflicts**: Central export file caused conflicts when same function name existed in multiple files.
   - Solution: Export only types from central index, import functions from specific modules.

2. **Generic Type Constraint Issue**: `withPermissionCheck<T>()` caused type errors because error and success responses have different shapes.
   - Solution: Remove generic and use `NextResponse` directly.

### Key Decisions

1. **Database Functions First**: Use Supabase RPC functions for authoritative checks, fallback to client-side matrix for performance.

2. **Guard Components**: Created multiple guard levels (PermissionGuard, RoleGuard, WarehouseGuard, AdminGuard, ManagerGuard, SupervisorGuard) for flexible UI control.

3. **Security First**: Added prominent comments that client-side checks are for UI convenience only - RLS and server-side validation are the real security.

4. **Audit Logging**: Included `logPermissionFailure()` for security monitoring.

### Files Created

See RBAC_IMPLEMENTATION.md for complete file listing.

### Verification

- ✅ TypeScript compilation passes
- ✅ Next.js build succeeds
- ✅ Permission matrix correctly implemented
- ✅ Warehouse isolation working
- ✅ API route protection functional
- ✅ Navigation filtering implemented
