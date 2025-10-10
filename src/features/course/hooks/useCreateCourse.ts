'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    }) => {
      const response = await apiClient.post('/api/manage/courses', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      toast({
        title: '성공',
        description: '코스가 생성되었습니다',
      });
      router.push(`/manage/courses/${data.id}/edit`);
    },
    onError: () => {
      toast({
        title: '오류',
        description: '코스 생성에 실패했습니다',
        variant: 'destructive',
      });
    },
  });
};