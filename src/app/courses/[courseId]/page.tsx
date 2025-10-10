'use client';

import { useRouter } from 'next/navigation';
import { useCourseDetailQuery } from '@/features/course/hooks/useCourseDetailQuery';
import { useEnrollMutation, useUnenrollMutation } from '@/features/course/hooks/useEnrollMutation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Users, Award, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [courseId, setCourseId] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // params를 비동기적으로 처리
  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  const { data: course, isLoading, isError } = useCourseDetailQuery(courseId);
  const enrollMutation = useEnrollMutation();
  const unenrollMutation = useUnenrollMutation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (courseId) {
      await enrollMutation.mutateAsync(courseId);
    }
  };

  const handleUnenroll = async () => {
    if (courseId) {
      await unenrollMutation.mutateAsync(courseId);
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const difficultyLabels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              코스를 찾을 수 없습니다.
            </p>
            <Button onClick={() => router.push('/courses')}>
              코스 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 뒤로가기 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        뒤로가기
      </Button>

      {/* 코스 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {course.category && (
                <Badge variant="secondary">{course.category}</Badge>
              )}
              <Badge className={cn(difficultyColors[course.difficulty])}>
                {difficultyLabels[course.difficulty]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">
              {course.description || '코스 설명이 없습니다.'}
            </p>

            {/* 코스 통계 */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  수강생 {course.enrollmentCount || 0}명
                </span>
              </div>
              {course.averageRating !== undefined && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    평점 {course.averageRating.toFixed(1)}점
                  </span>
                </div>
              )}
              {course.instructorName && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">강사: {course.instructorName}</span>
                </div>
              )}
            </div>

            {/* 수강신청 버튼 */}
            <div className="flex gap-4">
              {course.isEnrolled ? (
                <>
                  <Button asChild size="lg">
                    <Link href={`/my-courses/${courseId}`}>
                      학습 시작하기
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleUnenroll}
                    disabled={unenrollMutation.isPending}
                  >
                    수강 취소
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  {isAuthenticated ? '수강신청' : '로그인하여 수강신청'}
                </Button>
              )}
            </div>
          </div>

          {/* 코스 정보 카드 */}
          <div className="lg:w-96">
            <Card>
              <CardHeader>
                <CardTitle>코스 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">난이도</p>
                  <Badge className={cn(difficultyColors[course.difficulty])}>
                    {difficultyLabels[course.difficulty]}
                  </Badge>
                </div>
                {course.category && (
                  <div>
                    <p className="text-sm font-medium mb-1">카테고리</p>
                    <p className="text-sm text-muted-foreground">
                      {course.category}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">수강생</p>
                  <p className="text-sm text-muted-foreground">
                    {course.enrollmentCount || 0}명이 수강 중
                  </p>
                </div>
                {course.instructorName && (
                  <div>
                    <p className="text-sm font-medium mb-1">강사</p>
                    <p className="text-sm text-muted-foreground">
                      {course.instructorName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 코스 콘텐츠 탭 */}
      <Tabs defaultValue="about" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="about">소개</TabsTrigger>
          <TabsTrigger value="curriculum">커리큘럼</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>코스 소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {course.description || '상세 설명이 준비 중입니다.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>커리큘럼</CardTitle>
              <CardDescription>
                이 코스에서 학습할 내용입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.curriculum && course.curriculum.length > 0 ? (
                <div className="space-y-4">
                  {course.curriculum.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  커리큘럼이 준비 중입니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}