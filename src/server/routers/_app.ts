import { router } from '../trpc'
import { authRouter } from './auth'
import { expenseRouter } from './expense'
import { budgetRouter } from './budget'
import { categoryRouter } from './category'
import { deviceRouter } from './device'

export const appRouter = router({
  auth: authRouter,
  expense: expenseRouter,
  budget: budgetRouter,
  category: categoryRouter,
  device: deviceRouter,
})

export type AppRouter = typeof appRouter

// Export createCaller for server-side usage
export const createCaller = appRouter.createCaller
