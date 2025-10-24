import { initTRPC, TRPCError } from '@trpc/server'
import { createClient } from '@/lib/supabase/server'
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

// Create context for tRPC - called for every request
export const createContext = async (opts?: FetchCreateContextFnOptions) => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Get device fingerprint from headers
  const deviceFingerprint = opts?.req?.headers.get('x-device-fingerprint') || null

  return {
    session,
    supabase,
    deviceFingerprint,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure that requires authentication and device validation
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }

  // Validate device fingerprint
  if (ctx.deviceFingerprint) {
    const userId = ctx.session.user.id

    // Get registered device for this user
    const { data: device } = await ctx.supabase
      .from('user_devices')
      .select('device_fingerprint')
      .eq('user_id', userId)
      .single()

    // If device exists and fingerprint doesn't match, throw error
    if (device && device.device_fingerprint !== ctx.deviceFingerprint) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Device verification failed. Please log in again.',
      })
    }

    // Update last active timestamp if device is valid
    if (device && device.device_fingerprint === ctx.deviceFingerprint) {
      await ctx.supabase
        .from('user_devices')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
