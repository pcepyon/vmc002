'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useCourseDetail = (courseId: string) => {
  return useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/courses/${courseId}`);
      return response.data.data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
};