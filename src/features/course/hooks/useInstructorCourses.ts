'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useInstructorCourses = () => {
  return useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const response = await apiClient.get('/api/manage/courses');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};