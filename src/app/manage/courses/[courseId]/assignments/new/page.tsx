'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';

const createAssignmentSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(200),
  description: z.string().optional(),
  due_date: z.string().min(1, '마감일은 필수입니다'),
  weight: z.coerce.number().min(0).max(100).default(0),
  allow_late: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

type CreateAssignmentForm = z.infer<typeof createAssignmentSchema>;

export default function NewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [isPublishing, setIsPublishing] = useState(false);

  const form = useForm<CreateAssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      weight: 0,
      allow_late: false,
      allow_resubmission: false,
    },
  });

  // 과제 생성
  const createMutation = useMutation({
    mutationFn: async (data: CreateAssignmentForm) => {
      const formattedData = {
        ...data,
        due_date: new Date(data.due_date).toISOString(),
      };

      const response = await apiClient.post(`/api/courses/${courseId}/assignments`, formattedData);
      return response.data.data;
    },
    onSuccess: async (data) => {
      if (isPublishing) {
        // 바로 게시
        try {
          await apiClient.put(`/api/assignments/${data.id}/publish`);
          toast({
            title: '과제가 생성되고 게시되었습니다',
            description: '학습자들이 과제를 확인할 수 있습니다.',
          });
        } catch (error) {
          toast({
            title: '과제는 생성되었으나 게시에 실패했습니다',
            description: '과제 관리 페이지에서 다시 시도해주세요.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: '과제가 생성되었습니다',
          description: '과제가 초안으로 저장되었습니다.',
        });
      }
      router.push(`/manage/courses/${courseId}/assignments`);
    },
    onError: (error: Error) => {
      toast({
        title: '과제 생성 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateAssignmentForm) => {
    setIsPublishing(false);
    createMutation.mutate(data);
  };

  const onSubmitAndPublish = (data: CreateAssignmentForm) => {
    setIsPublishing(true);
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/manage/courses/${courseId}/assignments`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          과제 목록으로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 과제 만들기</CardTitle>
          <CardDescription>
            과제 정보를 입력하세요. 저장 후 게시하거나 초안으로 보관할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 제목 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 1주차 프로그래밍 과제" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="과제에 대한 상세한 설명을 입력하세요..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제의 목표, 요구사항, 평가 기준 등을 설명하세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>마감일 *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        과제 제출 마감일과 시간을 설정하세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>점수 비중 (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        전체 성적에서 차지하는 비중 (0-100)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="allow_late"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">지각 제출 허용</FormLabel>
                        <FormDescription>
                          마감일 이후에도 과제를 제출할 수 있도록 허용합니다.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_resubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">재제출 허용</FormLabel>
                        <FormDescription>
                          학습자가 과제를 여러 번 제출할 수 있도록 허용합니다.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  초안으로 저장
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(onSubmitAndPublish)}
                  disabled={createMutation.isPending}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  저장 후 게시
                </Button>
                <Link href={`/manage/courses/${courseId}/assignments`}>
                  <Button type="button" variant="outline">
                    취소
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}