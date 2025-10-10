'use client';

import { useCourseDetailQuery } from '../hooks/useCourseDetailQuery';
import { CourseProgress } from './CourseProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface CourseDetailViewProps {
  courseId: string;
}

export const CourseDetailView = ({ courseId }: CourseDetailViewProps) => {
  const { data, isLoading, error } = useCourseDetailQuery(courseId);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">로딩 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">코스 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const { course, assignments, progress, currentGrade, stats } = data;

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Circle className="h-4 w-4 text-muted-foreground" />;
    if (status === 'graded') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'submitted') return <Clock className="h-4 w-4 text-blue-500" />;
    if (status === 'resubmission_required') return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = (status: string | null) => {
    if (!status) return '미제출';
    if (status === 'graded') return '채점완료';
    if (status === 'submitted') return '제출됨';
    if (status === 'resubmission_required') return '재제출 요청';
    return '미제출';
  };

  return (
    <div className="space-y-6">
      {/* 코스 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{course.title}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              강사: {course.instructorName}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CourseProgress progress={progress || 0} />
            <div>
              <div className="text-sm text-muted-foreground">현재 성적</div>
              <div className="text-2xl font-bold">{currentGrade || 0}점</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">과제 완료</div>
              <div className="text-2xl font-bold">
                {stats.completedAssignments}/{stats.totalAssignments}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">과제 목록</TabsTrigger>
          <TabsTrigger value="grades">성적</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {assignments && assignments.length > 0 ? (
            assignments.map((assignment: any) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.submission?.status)}
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(assignment.submission?.status)}
                    </span>
                  </div>
                  <CardDescription>{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        마감: {format(new Date(assignment.due_date), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                      </p>
                      {assignment.weight > 0 && (
                        <p className="text-sm text-muted-foreground">
                          배점: {assignment.weight}%
                        </p>
                      )}
                      {assignment.submission?.score !== null && (
                        <p className="text-sm font-medium">
                          점수: {assignment.submission.score}점
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!assignment.submission && (
                        <Link href={`/my-courses/${courseId}/assignments/${assignment.id}/submit`}>
                          <Button size="sm">제출하기</Button>
                        </Link>
                      )}
                      {assignment.submission?.status === 'graded' && (
                        <Link href={`/my-courses/${courseId}/assignments/${assignment.id}/feedback`}>
                          <Button size="sm" variant="outline">피드백 확인</Button>
                        </Link>
                      )}
                      {assignment.submission?.status === 'resubmission_required' && (
                        <Link href={`/my-courses/${courseId}/assignments/${assignment.id}/submit`}>
                          <Button size="sm" variant="outline">재제출</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">등록된 과제가 없습니다</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>성적 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-lg font-medium">총점</span>
                  <span className="text-2xl font-bold">{currentGrade || 0}점</span>
                </div>
                {assignments && assignments
                  .filter((a: any) => a.submission?.status === 'graded')
                  .map((assignment: any) => (
                    <div key={assignment.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          가중치: {assignment.weight}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{assignment.submission.score}점</p>
                        <p className="text-sm text-muted-foreground">
                          기여도: {Math.round((assignment.submission.score * assignment.weight) / 100)}점
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};