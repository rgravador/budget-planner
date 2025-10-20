import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const budgetRouter = router({
  // Get all budget for the authenticated user
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
        .from('budget')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('budget_month', { ascending: false })

      // Filter by month if provided
      if (input?.month) {
        query = query.eq('budget_month', `${input.month}-01`)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    }),

  // Get budget for a specific month
  getByMonth: protectedProcedure
    .input(
      z.object({
        month: z.string(), // Format: YYYY-MM
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('budget')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .eq('budget_month', `${input.month}-01`)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Create a new budget record
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive('Amount must be greater than 0'),
        budgetMonth: z.string(), // Format: YYYY-MM
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if budget for this month already exists
      const { data: existing } = await ctx.supabase
        .from('budget')
        .select('id, amount')
        .eq('user_id', ctx.session.user.id)
        .eq('budget_month', `${input.budgetMonth}-01`)
        .maybeSingle()

      if (existing) {
        // Add to existing budget amount instead of overriding
        const newAmount = parseFloat(existing.amount) + input.amount

        const { data, error } = await ctx.supabase
          .from('budget')
          .update({
            amount: newAmount,
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
        // Create new budget
        const { data, error } = await ctx.supabase
          .from('budget')
          .insert({
            user_id: ctx.session.user.id,
            amount: input.amount,
            budget_month: `${input.budgetMonth}-01`,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        return data
      }
    }),

  // Update a budget record
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        amount: z.number().positive('Amount must be greater than 0'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('budget')
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

  // Delete a budget record
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('budget')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),
})
