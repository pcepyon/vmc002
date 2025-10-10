'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCourse } from '../../hooks/useCreateCourse';
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

export const CourseCreationForm = () => {
  const createMutation = useCreateCourse();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(CourseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      difficulty: 'beginner',
    },
  });

  const handleSubmit = async (data: CourseFormData) => {
    await createMutation.mutateAsync({
      title: data.title,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4 mb-2">
          <Link href="/manage/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
        </div>
        <CardTitle>새 코스 만들기</CardTitle>
        <CardDescription>
          코스의 기본 정보를 입력해주세요. 코스는 초안 상태로 생성되며, 나중에 게시할 수 있습니다.
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

            <div className="flex justify-end gap-4">
              <Link href="/manage/courses">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '생성 중...' : '코스 생성'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};