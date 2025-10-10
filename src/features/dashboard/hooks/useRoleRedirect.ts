'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from './useDashboardData'

/**
 * Hook to automatically redirect users based on their role
 */
export const useRoleRedirect = () => {
  const router = useRouter()
  const { data: roleData, isLoading, error } = useUserRole()

  useEffect(() => {
    if (!isLoading && roleData) {
      router.push(roleData.redirect_url)
    }
  }, [roleData, isLoading, router])

  useEffect(() => {
    if (error) {
      // If error is 401, redirect to signin
      if ((error as any)?.response?.status === 401) {
        router.push('/auth/signin')
      }
    }
  }, [error, router])

  return {
    isLoading,
    error,
    role: roleData?.role,
    redirectUrl: roleData?.redirect_url
  }
}