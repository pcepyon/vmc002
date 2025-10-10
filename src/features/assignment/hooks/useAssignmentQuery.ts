'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetail } from '../lib/dto';

export function useAssignmentQuery(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error('Assignment ID is required');

      const response = await apiClient.get<{ success: boolean; data: AssignmentDetail }>(
        `/api/assignments/${assignmentId}`
      );

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch assignment');
    },
    enabled: !!assignmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}