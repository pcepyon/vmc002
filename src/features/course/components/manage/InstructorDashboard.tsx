'use client';

import Link from 'next/link';
import { useInstructorCourses } from '../../hooks/useInstructorCourses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Plus, Edit, Eye } from 'lucide-react';

export const InstructorDashboard = () => {
  const { data: courses, isLoading, error } = useInstructorCourses();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">내 코스 관리</h2>
        <Link href="/manage/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 코스 만들기
          </Button>
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">아직 개설한 코스가 없습니다</p>
            <Link href="/manage/courses/new">
              <Button>첫 코스 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {course.description || '설명이 없습니다'}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      course.status === 'published'
                        ? 'default'
                        : course.status === 'draft'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {course.status === 'published'
                      ? '게시됨'
                      : course.status === 'draft'
                      ? '초안'
                      : '아카이브'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      수강생
                    </span>
                    <span className="font-medium">{course.studentCount || 0}명</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      미채점
                    </span>
                    <span className="font-medium">{course.pendingGrading || 0}개</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/manage/courses/${course.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-1" />
                    편집
                  </Button>
                </Link>
                {course.status === 'published' && (
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      보기
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};