import { initTRPC, TRPCError } from '@trpc/server'
import { createClient } from '@/lib/supabase/server'

// Create context for tRPC - called for every request
export const createContext = async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return {
    session,
    supabase,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
