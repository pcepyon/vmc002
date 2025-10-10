'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentListResponse } from '../lib/dto';

export function useAssignmentsQuery(courseId: string | undefined) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      const response = await apiClient.get<{ success: boolean; data: AssignmentListResponse }>(
        `/api/my-courses/${courseId}/assignments`
      );

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch assignments');
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}