# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budget Planner is a Next.js TypeScript application featuring:
- **Next.js 15 App Router** - Modern file-based routing with Server and Client Components
- **tRPC v11 with Next.js** - End-to-end type-safe API with server-side and client-side integration
- **Supabase with SSR** - Authentication with server-side rendering support
- **Ant Design UI** - Enterprise-grade component library with SSR support
- **Middleware-based auth** - Route protection using Next.js middleware

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check without building
npm run type-check
```

## Environment Setup

Required environment variables in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Note: Next.js requires the `NEXT_PUBLIC_` prefix for environment variables that are accessible in the browser.

## Architecture

### Next.js App Router Structure

```
src/
├── app/                    # App Router pages and layouts
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page (redirects to /dashboard)
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── dashboard/          # Protected dashboard page
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/     # tRPC API route handler
│   └── globals.css         # Global styles
├── lib/                    # Utilities and configurations
│   ├── supabase/           # Supabase client utilities
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server component client
│   │   └── middleware.ts   # Middleware client
│   ├── trpc/               # tRPC client setup
│   │   ├── client.tsx      # Client-side tRPC with React Query
│   │   ├── server.ts       # Server-side tRPC caller
│   │   └── query-client.ts # React Query configuration
│   ├── auth/               # Authentication utilities
│   │   └── useUser.tsx     # Auth context and hook
│   └── antd/               # Ant Design configuration
│       └── AntdRegistry.tsx # CSS-in-JS SSR support
├── server/                 # tRPC server-side code
│   ├── trpc.ts             # tRPC initialization and procedures
│   └── routers/            # tRPC route handlers
│       ├── _app.ts         # Root router
│       └── auth.ts         # Auth router
└── middleware.ts           # Next.js middleware for auth

```

### tRPC Next.js Implementation

This project uses **tRPC v11 with Next.js App Router**:

1. **Server setup** (`src/server/`) - tRPC routers run server-side via API routes
2. **API Route** (`src/app/api/trpc/[trpc]/route.ts`) - Handles all tRPC requests using `fetchRequestHandler`
3. **Client integration** (`src/lib/trpc/client.tsx`) - React hooks via `createTRPCReact` and `httpBatchLink`
4. **Server caller** (`src/lib/trpc/server.ts`) - Direct server-side calls for Server Components
5. **Context creation** (`src/server/trpc.ts`) - Pulls Supabase session for each request

When adding new tRPC procedures:
- Define routers in `src/server/routers/`
- Export from `src/server/routers/_app.ts`
- Use `publicProcedure` for unauthenticated or `protectedProcedure` for authenticated endpoints
- Client components automatically get type-safe access via `trpc.routerName.procedureName.useQuery()` or `.useMutation()`
- Server components can call procedures directly: `const caller = await api(); const result = await caller.routerName.procedureName()`

### Authentication Flow

1. **Next.js Middleware** (`src/middleware.ts`) - Runs on every request to:
   - Refresh Supabase session
   - Protect routes (redirects unauthenticated users from `/dashboard` to `/login`)
   - Redirect authenticated users from `/login` or `/signup` to `/dashboard`

2. **Supabase SSR** (`src/lib/supabase/`) - Different clients for different contexts:
   - `client.ts` - Browser client for Client Components
   - `server.ts` - Server client for Server Components and API routes
   - `middleware.ts` - Middleware client for edge runtime

3. **Auth Context** (`src/lib/auth/useUser.tsx`) - Client-side React context that:
   - Subscribes to Supabase auth state changes
   - Provides `user`, `session`, and `loading` state throughout Client Components

4. **tRPC Auth Router** (`src/server/routers/auth.ts`) - Handles:
   - `signUp` - User registration
   - `signIn` - User login
   - `signOut` - User logout
   - `getSession` - Current session retrieval

### Supabase Integration

- Separate Supabase client utilities for browser, server, and middleware contexts
- Auth state managed through Supabase's `onAuthStateChange` listener in Client Components
- Session passed to tRPC context for server-side auth checks
- Middleware handles session refresh and route protection at the edge

### UI Patterns with Ant Design

All pages use Ant Design components with SSR support:
- **AntdRegistry** - Wraps the app to enable CSS-in-JS server-side rendering
- **App Component** - **CRITICAL** - NEVER use static `message`, `modal`, or `notification` from antd imports. ALWAYS use the `useMessage`, `useModal`, or `useNotification` hooks from `@/lib/antd/useMessage` to access these APIs through the App context. This is required for theme integration and prevents context warnings.
  ```typescript
  // ❌ WRONG - Do not do this
  import { message } from 'antd'
  message.success('Success!')

  // ✅ CORRECT - Always use the hook
  import { useMessage } from '@/lib/antd/useMessage'
  const message = useMessage()
  message.success('Success!')
  ```
- **Forms**: Use `Form.Item` with validation rules
- **Layouts**: Dashboard uses `Layout`, `Header`, `Content` structure
- **Loading states**: Use `Spin` component or button `loading` prop (note: use `isPending` instead of `isLoading` for tRPC v11)
- **Button Processing States**: **CRITICAL** - All buttons that trigger data operations (get, create, update, delete) MUST have a loading/processing state to prevent double-clicking. Use the `loading` prop on Ant Design buttons with tRPC's `isPending` state:
  ```typescript
  const mutation = trpc.yourFeature.createItem.useMutation()
  <Button loading={mutation.isPending} onClick={() => mutation.mutate({...})}>
    Submit
  </Button>
  ```
- **Errors**: Display with `Alert` component
- **Icons**: Import from `@ant-design/icons`
- **Mobile Responsiveness**: Always make the UI mobile responsive. Use Ant Design's Grid system (`Row`, `Col` with responsive breakpoints) and responsive utilities. Test layouts on mobile, tablet, and desktop viewports.

### React Query Configuration

Configured in `src/lib/trpc/query-client.ts` with:
```typescript
defaultOptions: {
  queries: {
    refetchOnWindowFocus: false, // Disabled to prevent refetch on tab focus
    staleTime: 30 * 1000,        // 30 seconds for SSR
  },
}
```

## File Organization

```
src/
├── app/            # Next.js App Router pages and API routes
├── lib/            # Configuration and utilities
├── server/         # tRPC server-side code (runs on server)
└── middleware.ts   # Next.js middleware for auth
```

## Adding New Features

### Adding a New tRPC Route

1. Create router in `src/server/routers/your-feature.ts`:
```typescript
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const yourRouter = router({
  getItems: protectedProcedure.query(async ({ ctx }) => {
    // Use ctx.session for user info
    // Use ctx.supabase for database access
    return { items: [] }
  }),

  createItem: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Mutation logic
      return { success: true }
    }),
})
```

2. Add to `src/server/routers/_app.ts`:
```typescript
export const appRouter = router({
  auth: authRouter,
  yourFeature: yourRouter, // Add here
})
```

3. Use in Client Components:
```typescript
'use client'
import { trpc } from '@/lib/trpc/client'

const { data } = trpc.yourFeature.getItems.useQuery()
const mutation = trpc.yourFeature.createItem.useMutation()
```

4. Use in Server Components:
```typescript
import { api } from '@/lib/trpc/server'

const caller = await api()
const data = await caller.yourFeature.getItems()
```

### Adding a New Page

1. Create directory in `src/app/your-page/`
2. Create `page.tsx` (use `'use client'` directive if needed)
3. Protected routes are handled by middleware (add path to `protectedPaths` in `src/middleware.ts`)

Example Client Component page:
```typescript
'use client'

import { useAuth } from '@/lib/auth/useUser'
import { trpc } from '@/lib/trpc/client'

export default function YourPage() {
  const { user } = useAuth()
  const { data } = trpc.yourFeature.getData.useQuery()

  return <div>Your page content</div>
}
```

Example Server Component page:
```typescript
import { api } from '@/lib/trpc/server'

export default async function YourPage() {
  const caller = await api()
  const data = await caller.yourFeature.getData()

  return <div>Your page content</div>
}
```

### Adding Protected Routes

1. Add the route path to the `protectedPaths` array in `src/middleware.ts`:
```typescript
const protectedPaths = ['/dashboard', '/your-new-protected-route']
```

2. The middleware will automatically redirect unauthenticated users to `/login`

## Important Notes

- **Type Safety**: The `AppRouter` type provides end-to-end type safety from tRPC routers to React components
- **Server vs Client Components**:
  - Use Server Components by default for better performance
  - Use Client Components (`'use client'`) when you need interactivity, hooks, or browser APIs
  - tRPC queries/mutations require Client Components
- **Session Management**:
  - Access user session via `useAuth()` hook in Client Components
  - Access via tRPC context in server-side procedures
- **Ant Design Version**: Using v5.27.5 - check documentation at https://ant.design
- **React Query Version**: Using v5 with tRPC v11
- **tRPC v11 Changes**: Use `isPending` instead of `isLoading` for mutation/query states
- **Middleware**: Runs on edge runtime - keep it lightweight and avoid heavy computations
- **Environment Variables**: Use `NEXT_PUBLIC_` prefix for client-accessible variables
- Add to memory, "add number type to all input fields expecting number (eg. amount)"