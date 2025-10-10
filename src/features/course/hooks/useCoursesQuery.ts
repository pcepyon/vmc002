'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseListQuery, CourseListResponse } from '../lib/dto';

export function useCoursesQuery(filters: CourseListQuery) {
  return useQuery<CourseListResponse>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CourseListResponse }>(
        '/api/courses',
        { params: filters }
      );

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch courses');
    },
    staleTime: 30000, // 30 seconds
  });
}