'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { toast } from '@/components/ui/use-toast';

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, data }: {
      courseId: string;
      data: {
        title?: string;
        description?: string;
        category?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
      };
    }) => {
      const response = await apiClient.put(`/api/manage/courses/${courseId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      toast({
        title: '성공',
        description: '코스가 수정되었습니다',
      });
    },
    onError: () => {
      toast({
        title: '오류',
        description: '코스 수정에 실패했습니다',
        variant: 'destructive',
      });
    },
  });
};