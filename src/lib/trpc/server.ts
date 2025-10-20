import 'server-only'

import { cache } from 'react'
import { createCaller } from '@/server/routers/_app'
import { createContext } from '@/server/trpc'

// Create context once per request
export const getContext = cache(createContext)

// Create tRPC caller for server components
export const api = cache(async () => {
  const context = await getContext()
  return createCaller(context)
})
