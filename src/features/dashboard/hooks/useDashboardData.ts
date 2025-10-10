'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'
import type {
  LearnerDashboardResponse,
  InstructorDashboardResponse
} from '../lib/dto'

/**
 * Hook to fetch learner dashboard data
 */
export const useLearnerDashboard = () => {
  return useQuery<LearnerDashboardResponse>({
    queryKey: ['dashboard', 'learner'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dashboard/learner')
      return response.data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to fetch instructor dashboard data
 */
export const useInstructorDashboard = () => {
  return useQuery<InstructorDashboardResponse>({
    queryKey: ['dashboard', 'instructor'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dashboard/instructor')
      return response.data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to fetch user role and determine dashboard redirect
 */
export const useUserRole = () => {
  return useQuery<{ role: 'learner' | 'instructor'; redirect_url: string }>({
    queryKey: ['dashboard', 'role'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/dashboard')
        const data = response.data.data

        // Ensure we never return undefined
        if (!data) {
          throw new Error('No data returned from dashboard API')
        }

        return data
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 1,
  })
}