
## Authentication Architecture (2026-02-01)

### Decision: Supabase Auth with SSR
**Rationale**: 
- Supabase provides built-in auth with email/password
- SSR support via `@supabase/ssr` package
- Automatic session management with cookies
- Real-time session updates via `onAuthStateChange`

### Decision: Proxy.ts for Middleware (Not middleware.ts)
**Rationale**:
- Next.js 16 requires `proxy.ts` instead of `middleware.ts`
- Merged i18n middleware with auth middleware in single proxy.ts
- Maintains both locale routing and auth protection

### Decision: Client-Side Auth Context
**Rationale**:
- Provides reactive session state to all components
- Avoids prop drilling
- Enables real-time UI updates on auth state changes
- Centralized signOut logic

### Decision: Email/Password Only (No Social Login)
**Rationale**:
- Simpler initial implementation
- Meets current requirements
- Can add social login later if needed

### Decision: Zuma Brand Colors in Login UI
**Rationale**:
- Primary: #002A3A (deep teal)
- Accent: #00E273 (bright green)
- Creates cohesive brand experience
- Gradient backgrounds add visual interest without being distracting

### Decision: Error Message Masking
**Rationale**:
- Generic "Invalid email or password" message
- Prevents user enumeration attacks
- Security best practice

### Decision: Form Validation Before API Call
**Rationale**:
- Reduces unnecessary API calls
- Faster feedback to user
- Client-side validation: email format, password length
- Server still validates (defense in depth)

