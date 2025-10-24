'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, TRPCClientError } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState, useEffect } from 'react'
import type { AppRouter } from '@/server/routers/_app'
import { createClient } from '@/lib/supabase/client'
import { clearDeviceFingerprint } from '@/lib/device/fingerprint'
import { useRouter } from 'next/navigation'

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleDeviceError = (error: unknown) => {
    // Handle device verification errors
    if (error instanceof TRPCClientError) {
      if (error.message.includes('Device verification failed')) {
        // Clear device fingerprint and sign out
        clearDeviceFingerprint()
        const supabase = createClient()
        supabase.auth.signOut().then(() => {
          router.push('/login')
        })
      }
    }
  }

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection time)
            retry: (failureCount, error) => {
              // Don't retry on device verification errors
              if (error instanceof TRPCClientError && error.message.includes('Device verification failed')) {
                handleDeviceError(error)
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry on device verification errors
              if (error instanceof TRPCClientError && error.message.includes('Device verification failed')) {
                handleDeviceError(error)
                return false
              }
              return failureCount < 3
            },
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            // Get device fingerprint from localStorage and include in headers
            if (typeof window !== 'undefined') {
              const fingerprint = localStorage.getItem('device_fingerprint')
              if (fingerprint) {
                return {
                  'x-device-fingerprint': fingerprint,
                }
              }
            }
            return {}
          },
        }),
      ],
    })
  )

  // Clear all queries when auth state changes
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Clear all cached queries when user signs in or out
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
