'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { toast } from '@/components/ui/use-toast';

export const usePublishCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiClient.put(`/api/manage/courses/${courseId}/publish`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      toast({
        title: '성공',
        description: '코스가 게시되었습니다',
      });
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.response?.data?.message || '코스 게시에 실패했습니다',
        variant: 'destructive',
      });
    },
  });
};