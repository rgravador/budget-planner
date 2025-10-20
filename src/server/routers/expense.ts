import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const expenseRouter = router({
  // Get all expenses for the authenticated user
  getAll: protectedProcedure
    .input(
      z
        .object({
          month: z.string().optional(), // Format: YYYY-MM
          category: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('expenses')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('expense_date', { ascending: false })

      // Filter by month if provided
      if (input?.month) {
        const startDate = `${input.month}-01`
        const endDate = new Date(input.month + '-01')
        endDate.setMonth(endDate.getMonth() + 1)
        const endDateStr = endDate.toISOString().split('T')[0]

        query = query.gte('expense_date', startDate).lt('expense_date', endDateStr)
      }

      // Filter by category if provided
      if (input?.category) {
        query = query.eq('category', input.category)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    }),

  // Get expenses grouped by category for a specific month
  getByCategory: protectedProcedure
    .input(
      z.object({
        month: z.string(), // Format: YYYY-MM
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = `${input.month}-01`
      const endDate = new Date(input.month + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data, error } = await ctx.supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', ctx.session.user.id)
        .gte('expense_date', startDate)
        .lt('expense_date', endDateStr)

      if (error) {
        throw new Error(error.message)
      }

      // Group by category and sum amounts
      const grouped = (data || []).reduce(
        (acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = { category: expense.category, total: 0, count: 0 }
          }
          acc[expense.category].total += parseFloat(expense.amount)
          acc[expense.category].count += 1
          return acc
        },
        {} as Record<string, { category: string; total: number; count: number }>
      )

      return Object.values(grouped)
    }),

  // Create a new expense
  create: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1, 'Category is required'),
        description: z.string().min(3, 'Description must be at least 3 characters'),
        amount: z.number().positive('Amount must be greater than 0'),
        expenseDate: z.string().optional(), // Format: YYYY-MM-DD
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('expenses')
        .insert({
          user_id: ctx.session.user.id,
          category: input.category,
          description: input.description,
          amount: input.amount,
          expense_date: input.expenseDate || new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Update an expense
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        category: z.string().min(1).optional(),
        description: z.string().min(3).optional(),
        amount: z.number().positive().optional(),
        expenseDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const { data, error } = await ctx.supabase
        .from('expenses')
        .update({
          ...(updateData.category && { category: updateData.category }),
          ...(updateData.description && { description: updateData.description }),
          ...(updateData.amount && { amount: updateData.amount }),
          ...(updateData.expenseDate && { expense_date: updateData.expenseDate }),
        })
        .eq('id', id)
        .eq('user_id', ctx.session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Delete an expense
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('expenses')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),
})
