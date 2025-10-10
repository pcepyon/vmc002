'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GradingFilter, SubmissionForGrading, GradingStats } from '../lib/dto';

async function fetchSubmissions(
  assignmentId: string,
  filters: GradingFilter
): Promise<SubmissionForGrading[]> {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.order) params.append('order', filters.order);

  const response = await apiClient.get(
    `/api/assignments/${assignmentId}/submissions?${params.toString()}`
  );
  return response.data.data;
}

async function fetchGradingStats(assignmentId: string): Promise<GradingStats> {
  const response = await apiClient.get(
    `/api/assignments/${assignmentId}/grading-stats`
  );
  return response.data.data;
}

export function useSubmissionsQuery(
  assignmentId: string,
  filters: GradingFilter = {}
) {
  return useQuery({
    queryKey: ['submissions', assignmentId, filters],
    queryFn: () => fetchSubmissions(assignmentId, filters),
    enabled: !!assignmentId,
    placeholderData: (previousData) => previousData,
  });
}

export function useGradingStats(assignmentId: string) {
  return useQuery({
    queryKey: ['grading-stats', assignmentId],
    queryFn: () => fetchGradingStats(assignmentId),
    enabled: !!assignmentId,
    refetchInterval: 30000, // 30초마다 갱신
  });
}