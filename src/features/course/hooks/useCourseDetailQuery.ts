'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseDetail } from '../lib/dto';

export function useCourseDetailQuery(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      const response = await apiClient.get<{ success: boolean; data: CourseDetail }>(
        `/api/courses/${courseId}`
      );

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch course details');
    },
    enabled: !!courseId,
    staleTime: 60000, // 1 minute
  });
}