'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useCourseGradesQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['course-grades', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/my-courses/${courseId}/grades`);
      return response.data.data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
};