'use client'

import { useContext, useEffect, useState } from 'react'
import { CurrentUserContext } from '@/features/auth/context/current-user-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { Database } from '@/lib/supabase/types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext)
  const [role, setRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider')
  }

  const { user, isLoading, isAuthenticated, refresh } = context

  // Fetch role from profiles table
  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null)
        setRoleLoading(false)
        return
      }

      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single<ProfileRow>()

        if (!error && data) {
          setRole(data.role)
        } else {
          setRole(null)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole(null)
      } finally {
        setRoleLoading(false)
      }
    }

    fetchRole()
  }, [user])

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    await refresh()
  }

  return {
    user,
    role,
    isLoading: isLoading || roleLoading,
    isAuthenticated,
    refresh,
    signOut,
  }
}