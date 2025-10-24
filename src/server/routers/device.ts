import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

const deviceInfoSchema = z.object({
  fingerprint: z.string(),
  userAgent: z.string(),
  platform: z.string(),
  screenResolution: z.string(),
  timezone: z.string(),
  language: z.string(),
})

export const deviceRouter = router({
  /**
   * Register or update the current device for a user
   */
  register: protectedProcedure
    .input(deviceInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Check if device already exists for this user
      const { data: existingDevice } = await ctx.supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingDevice) {
        // Update existing device
        const { error } = await ctx.supabase
          .from('user_devices')
          .update({
            device_fingerprint: input.fingerprint,
            user_agent: input.userAgent,
            platform: input.platform,
            screen_resolution: input.screenResolution,
            timezone: input.timezone,
            language: input.language,
            last_active_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (error) {
          throw new Error('Failed to update device')
        }
      } else {
        // Insert new device
        const { error } = await ctx.supabase
          .from('user_devices')
          .insert({
            user_id: userId,
            device_fingerprint: input.fingerprint,
            user_agent: input.userAgent,
            platform: input.platform,
            screen_resolution: input.screenResolution,
            timezone: input.timezone,
            language: input.language,
          })

        if (error) {
          throw new Error('Failed to register device')
        }
      }

      return { success: true }
    }),

  /**
   * Validate if the current device matches the registered device
   */
  validate: protectedProcedure
    .input(z.object({ fingerprint: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get the registered device for this user
      const { data: device, error } = await ctx.supabase
        .from('user_devices')
        .select('device_fingerprint')
        .eq('user_id', userId)
        .single()

      if (error || !device) {
        // No device registered, this is suspicious
        return { valid: false, reason: 'no_device_registered' }
      }

      // Check if the fingerprint matches
      const isValid = device.device_fingerprint === input.fingerprint

      if (isValid) {
        // Update last active timestamp
        await ctx.supabase
          .from('user_devices')
          .update({ last_active_at: new Date().toISOString() })
          .eq('user_id', userId)
      }

      return {
        valid: isValid,
        reason: isValid ? null : 'fingerprint_mismatch',
      }
    }),

  /**
   * Get the current registered device info
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const { data: device, error } = await ctx.supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !device) {
      return null
    }

    return {
      fingerprint: device.device_fingerprint,
      userAgent: device.user_agent,
      platform: device.platform,
      screenResolution: device.screen_resolution,
      timezone: device.timezone,
      language: device.language,
      lastActiveAt: device.last_active_at,
      createdAt: device.created_at,
    }
  }),

  /**
   * Unregister the current device (logout from this device)
   */
  unregister: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const { error } = await ctx.supabase
      .from('user_devices')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error('Failed to unregister device')
    }

    return { success: true }
  }),
})
