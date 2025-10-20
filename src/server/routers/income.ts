import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const incomeRouter = router({
  // Get all income for the authenticated user
  getAll: protectedProcedure
    .input(
      z
        .object({
          month: z.string().optional(), // Format: YYYY-MM
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('income_month', { ascending: false })

      // Filter by month if provided
      if (input?.month) {
        query = query.eq('income_month', `${input.month}-01`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    }),

  // Get income for a specific month
  getByMonth: protectedProcedure
    .input(
      z.object({
        month: z.string(), // Format: YYYY-MM
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('income')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .eq('income_month', `${input.month}-01`)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Create a new income record
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive('Amount must be greater than 0'),
        incomeMonth: z.string(), // Format: YYYY-MM
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if income for this month already exists
      const { data: existing } = await ctx.supabase
        .from('income')
        .select('id')
        .eq('user_id', ctx.session.user.id)
        .eq('income_month', `${input.incomeMonth}-01`)
        .maybeSingle()

      if (existing) {
        // Update existing income
        const { data, error } = await ctx.supabase
          .from('income')
          .update({
            amount: input.amount,
          })
          .eq('id', existing.id)
          .eq('user_id', ctx.session.user.id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data
      } else {
        // Create new income
        const { data, error } = await ctx.supabase
          .from('income')
          .insert({
            user_id: ctx.session.user.id,
            amount: input.amount,
            income_month: `${input.incomeMonth}-01`,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data
      }
    }),

  // Update an income record
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        amount: z.number().positive('Amount must be greater than 0'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('income')
        .update({
          amount: input.amount,
        })
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Delete an income record
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('income')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),
})
