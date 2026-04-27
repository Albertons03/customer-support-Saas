import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type ProfileRole = 'customer' | 'agent' | 'admin' | 'hr_manager'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: ProfileRole
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProfile((data as Profile | null) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return { profile, loading, isHR: profile?.role === 'hr_manager' || profile?.role === 'admin' }
}
