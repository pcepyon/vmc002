'use client';

import Link from 'next/link';
import { useMyCoursesQuery } from '../hooks/useMyCoursesQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const MyCoursesList = () => {
  const { data: courses, isLoading, error } = useMyCoursesQuery();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">오류가 발생했습니다</p>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">수강 중인 코스가 없습니다</p>
        <Link href="/courses">
          <Button>코스 둘러보기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((enrollment: any) => (
        <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="line-clamp-2">{enrollment.courses?.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              강사: {enrollment.courses?.profiles?.name || '알 수 없음'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>진행률</span>
                  <span>{enrollment.progress || 0}%</span>
                </div>
                <Progress value={enrollment.progress || 0} />
              </div>

              {enrollment.nextAssignment && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">다음 과제</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {enrollment.nextAssignment.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    마감: {format(new Date(enrollment.nextAssignment.due_date), 'M월 d일', { locale: ko })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/my-courses/${enrollment.course_id}`} className="w-full">
              <Button className="w-full">계속 학습하기</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};