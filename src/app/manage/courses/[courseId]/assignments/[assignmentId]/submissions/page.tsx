'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { SubmissionTable } from '@/features/grading/components/SubmissionTable';
import { GradingStatsCard } from '@/features/grading/components/GradingStats';
import { useSubmissionsQuery, useGradingStats } from '@/features/grading/hooks/useSubmissionsQuery';
import { apiClient } from '@/lib/remote/api-client';
import type { GradingFilter } from '@/features/grading/lib/dto';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
}

interface Course {
  id: string;
  title: string;
  instructor_id: string;
}

async function fetchAssignment(assignmentId: string): Promise<Assignment> {
  const response = await apiClient.get(`/api/assignments/${assignmentId}`);
  return response.data.data;
}

async function fetchCourse(courseId: string): Promise<Course> {
  const response = await apiClient.get(`/api/courses/${courseId}`);
  return response.data.data;
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const assignmentId = params?.assignmentId as string;

  const [filters, setFilters] = useState<GradingFilter>({
    status: 'all',
    sortBy: 'submitted_at',
    order: 'desc',
  });

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
    enabled: !!assignmentId,
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: !!courseId,
  });

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useSubmissionsQuery(assignmentId, filters);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGradingStats(assignmentId);

  const isLoading = assignmentLoading || courseLoading || submissionsLoading || statsLoading;

  const handleRefresh = () => {
    refetchSubmissions();
    refetchStats();
  };

  const handleExport = () => {
    // TODO: Export functionality
    console.log('Export grades');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">로딩 중...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment || !course) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>과제를 찾을 수 없습니다</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            {course.title} • 마감일: {new Date(assignment.due_date).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && <GradingStatsCard stats={stats} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>제출물 목록</CardTitle>
          <CardDescription>
            학생들이 제출한 과제를 확인하고 채점하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as any })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ungraded">미채점</SelectItem>
                <SelectItem value="graded">채점완료</SelectItem>
                <SelectItem value="late">지각제출</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ ...filters, sortBy: value as any })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted_at">제출시간</SelectItem>
                <SelectItem value="name">이름</SelectItem>
                <SelectItem value="status">상태</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.order}
              onValueChange={(value) =>
                setFilters({ ...filters, order: value as any })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="정렬 순서" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">오름차순</SelectItem>
                <SelectItem value="desc">내림차순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SubmissionTable
            submissions={submissions}
            onRefresh={handleRefresh}
            allowBatchGrading={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}