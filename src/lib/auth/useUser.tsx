'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { generateDeviceFingerprint, storeDeviceFingerprint, getStoredDeviceFingerprint, clearDeviceFingerprint } from '@/lib/device/fingerprint'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Create supabase client only once
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const initializeAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // If user is logged in but no device fingerprint stored, generate one
        let storedFingerprint = getStoredDeviceFingerprint()
        if (!storedFingerprint) {
          storedFingerprint = await generateDeviceFingerprint()
          storeDeviceFingerprint(storedFingerprint)
        }
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear device fingerprint on sign out
        clearDeviceFingerprint()
        setSession(null)
        setUser(null)
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        // Generate and store device fingerprint on sign in
        const fingerprint = await generateDeviceFingerprint()
        storeDeviceFingerprint(fingerprint)
        setSession(session)
        setUser(session?.user ?? null)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
    }),
    [session, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
