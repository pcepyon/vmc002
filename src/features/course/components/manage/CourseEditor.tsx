'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { useUpdateCourse } from '../../hooks/useUpdateCourse';
import { usePublishCourse } from '../../hooks/usePublishCourse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const CourseFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
  description: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

type CourseFormData = z.infer<typeof CourseFormSchema>;

interface CourseEditorProps {
  courseId: string;
}

export const CourseEditor = ({ courseId }: CourseEditorProps) => {
  const { data: course, isLoading } = useCourseDetail(courseId);
  const updateMutation = useUpdateCourse();
  const publishMutation = usePublishCourse();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(CourseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title,
        description: course.description || '',
        category: course.category || '',
        difficulty: course.difficulty || 'beginner',
      });
    }
  }, [course, form]);

  const handleSubmit = async (data: CourseFormData) => {
    await updateMutation.mutateAsync({
      courseId,
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
      }
    });
  };

  const handlePublish = async () => {
    if (window.confirm('코스를 게시하시겠습니까? 게시 후에는 학습자들이 수강신청할 수 있습니다.')) {
      await publishMutation.mutateAsync(courseId);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">로딩 중...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">코스를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manage/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">코스 편집</h1>
        </div>
        {course?.status === 'draft' && (
          <Button onClick={handlePublish} disabled={publishMutation.isPending}>
            코스 게시
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            코스의 기본 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>코스 제목 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: React 기초부터 실전까지" {...field} />
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
                    <FormLabel>코스 설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="코스에 대한 설명을 입력해주세요"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      학습자들이 코스를 이해하는데 도움이 되는 설명을 작성해주세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 웹 개발, 프로그래밍" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>난이도</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="난이도 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>과제 관리</CardTitle>
          <CardDescription>
            코스의 과제를 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/manage/courses/${courseId}/assignments`}>
            <Button variant="outline">과제 관리하기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};