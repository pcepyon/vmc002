'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';
import type { EnrollmentResponse } from '@/features/enrollment/lib/dto';

export function useEnrollMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.post<{ success: boolean; data?: EnrollmentResponse; error?: { message: string } }>(
        `/api/courses/${courseId}/enroll`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error?.message || '수강신청에 실패했습니다');
    },
    onSuccess: (data, courseId) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });

      toast({
        title: '수강신청 완료',
        description: '성공적으로 수강신청되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '수강신청 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUnenrollMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.delete<{ success: boolean; data?: { message: string }; error?: { message: string } }>(
        `/api/courses/${courseId}/enroll`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error?.message || '수강취소에 실패했습니다');
    },
    onSuccess: (data, courseId) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });

      toast({
        title: '수강취소 완료',
        description: '성공적으로 수강취소되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '수강취소 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}