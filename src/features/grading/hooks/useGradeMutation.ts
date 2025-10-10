'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/remote/api-client';
import type { GradeSubmissionDto } from '../lib/dto';

async function gradeSubmission(
  submissionId: string,
  data: GradeSubmissionDto
) {
  const response = await apiClient.post(
    `/api/submissions/${submissionId}/grade`,
    data
  );
  return response.data.data;
}

export function useGradeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, data }: {
      submissionId: string;
      data: GradeSubmissionDto;
    }) => gradeSubmission(submissionId, data),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['grading-stats'] });
      queryClient.invalidateQueries({ queryKey: ['grading-queue'] });

      if (variables.data.request_resubmission) {
        toast.success('재제출 요청이 전송되었습니다');
      } else {
        toast.success('채점이 완료되었습니다');
      }
    },

    onError: (error) => {
      const message = error instanceof Error
        ? error.message
        : '채점 중 오류가 발생했습니다';
      toast.error(message);
    },
  });
}