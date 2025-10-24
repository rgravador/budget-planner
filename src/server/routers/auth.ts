import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'

export const authRouter = router({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: data.user, session: data.session }
    }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: data.user, session: data.session }
    }),

  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    // Unregister device before signing out
    try {
      await ctx.supabase
        .from('user_devices')
        .delete()
        .eq('user_id', ctx.session.user.id)
    } catch (error) {
      // Continue with signout even if device unregistration fails
      console.error('Failed to unregister device:', error)
    }

    const { error } = await ctx.supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    return { session: ctx.session }
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('expense_users')
      .select('*')
      .eq('id', ctx.session.user.id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('expense_users')
        .update({
          ...(input.name !== undefined && { name: input.name }),
        })
        .eq('id', ctx.session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),
})
