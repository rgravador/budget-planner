import { router, protectedProcedure } from '../trpc'
import { z } from 'zod'

export const categoryRouter = router({
  // Get all categories for the authenticated user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('categories')
      .select('*')
      .eq('user_id', ctx.session.user.id)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }),

  // Create a new category
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Category name is required'),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if category already exists for this user
      const { data: existing } = await ctx.supabase
        .from('categories')
        .select('id')
        .eq('user_id', ctx.session.user.id)
        .eq('name', input.name)
        .maybeSingle()

      if (existing) {
        throw new Error('Category already exists')
      }

      const { data, error } = await ctx.supabase
        .from('categories')
        .insert({
          user_id: ctx.session.user.id,
          name: input.name,
          icon: input.icon || 'TagOutlined',
          is_default: false,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    }),

  // Update a category
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const { data, error } = await ctx.supabase
        .from('categories')
        .update({
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.icon && { icon: updateData.icon }),
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

  // Delete a category (only non-default categories)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if it's a default category
      const { data: category } = await ctx.supabase
        .from('categories')
        .select('is_default')
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)
        .single()

      if (category?.is_default) {
        throw new Error('Cannot delete default categories')
      }

      const { error } = await ctx.supabase
        .from('categories')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.session.user.id)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    }),
})
