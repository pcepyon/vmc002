'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/remote/api-client';
import type { SubmitAssignmentDto, SubmissionResponse } from '../lib/dto';

async function submitAssignment(
  assignmentId: string,
  data: SubmitAssignmentDto
): Promise<SubmissionResponse> {
  const response = await apiClient.post(
    `/api/assignments/${assignmentId}/submit`,
    data
  );
  return response.data.data;
}

export function useSubmitAssignment(
  assignmentId: string,
  courseId: string
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SubmitAssignmentDto) =>
      submitAssignment(assignmentId, data),

    onMutate: async (data) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['submission-status', assignmentId]
      });

      const previousStatus = queryClient.getQueryData([
        'submission-status',
        assignmentId
      ]);

      queryClient.setQueryData(['submission-status', assignmentId], {
        status: 'submitted',
        ...data,
      });

      return { previousStatus };
    },

    onError: (err, data, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(
          ['submission-status', assignmentId],
          context.previousStatus
        );
      }

      const message = err instanceof Error
        ? err.message
        : '제출에 실패했습니다';
      toast.error(message);
    },

    onSuccess: (response) => {
      // Invalidate and redirect
      queryClient.invalidateQueries({
        queryKey: ['submission-status', assignmentId]
      });
      queryClient.invalidateQueries({
        queryKey: ['assignments']
      });
      queryClient.invalidateQueries({
        queryKey: ['my-assignments']
      });

      if (response.is_late) {
        toast.warning('지각 제출되었습니다');
      } else {
        toast.success('제출이 완료되었습니다');
      }

      // Navigate to feedback page
      router.push(
        `/my-courses/${courseId}/assignments/${assignmentId}/feedback`
      );
    },
  });
}