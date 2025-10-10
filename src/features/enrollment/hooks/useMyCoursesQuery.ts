'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useMyCoursesQuery = () => {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/my-courses');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};