'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SubmissionResponse } from '../lib/dto';

async function fetchLatestSubmission(
  assignmentId: string
): Promise<SubmissionResponse | null> {
  const response = await apiClient.get(
    `/api/assignments/${assignmentId}/submission/latest`
  );
  return response.data.data;
}

async function fetchCanSubmit(assignmentId: string) {
  const response = await apiClient.get(
    `/api/assignments/${assignmentId}/can-submit`
  );
  return response.data.data;
}

export function useLatestSubmission(assignmentId: string) {
  return useQuery({
    queryKey: ['submission-latest', assignmentId],
    queryFn: () => fetchLatestSubmission(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useCanSubmit(assignmentId: string) {
  return useQuery({
    queryKey: ['can-submit', assignmentId],
    queryFn: () => fetchCanSubmit(assignmentId),
    enabled: !!assignmentId,
    refetchInterval: 60000, // Refetch every minute to check deadline
  });
}