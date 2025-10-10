'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useState } from 'react';

interface GradeData {
  course: {
    id: string;
    title: string;
  };
  assignments: Array<{
    id: string;
    title: string;
    due_date: string;
    weight: number;
    submission: {
      id: string;
      score: number | null;
      status: 'submitted' | 'graded' | 'resubmission_required';
      is_late: boolean;
      feedback: string | null;
      version: number;
      submitted_at: string;
    } | null;
  }>;
  summary: {
    total_score: number;
    submitted_count: number;
    graded_count: number;
    pending_count: number;
    average_score: number;
    letter_grade: string;
  };
}

interface FeedbackDetail {
  submission: {
    id: string;
    content_text: string;
    content_link: string | null;
    submitted_at: string;
    is_late: boolean;
  };
  grading: {
    score: number | null;
    feedback: string | null;
    status: string;
  };
  assignment: {
    title: string;
    weight: number;
    due_date: string;
  };
}

export default function GradesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // 성적 조회
  const { data: grades, isLoading, error } = useQuery({
    queryKey: ['grades', courseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/my-courses/${courseId}/grades`);
      return response.data.data as GradeData;
    },
  });

  // 피드백 상세 조회
  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['feedback', selectedSubmissionId],
    queryFn: async () => {
      if (!selectedSubmissionId) return null;
      const response = await apiClient.get(`/api/submissions/${selectedSubmissionId}/feedback`);
      return response.data.data as FeedbackDetail;
    },
    enabled: !!selectedSubmissionId,
  });

  const getStatusBadge = (submission: any) => {
    if (!submission) {
      return <Badge variant="outline">미제출</Badge>;
    }
    switch (submission.status) {
      case 'submitted':
        return <Badge variant="secondary">제출됨</Badge>;
      case 'graded':
        return <Badge variant="default">채점완료</Badge>;
      case 'resubmission_required':
        return <Badge variant="destructive">재제출 필요</Badge>;
      default:
        return null;
    }
  };

  const getLetterGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateProgressPercentage = () => {
    if (!grades) return 0;
    const total = grades.assignments.length;
    const graded = grades.summary.graded_count;
    return total > 0 ? (graded / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">성적을 불러오는 중...</div>
      </div>
    );
  }

  if (error || !grades) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          성적을 불러오는데 실패했습니다
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href={`/my-courses/${courseId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          코스로 돌아가기
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{grades.course.title} 성적표</h1>
        <p className="text-gray-500">과제별 점수와 전체 성적을 확인하세요</p>
      </div>

      {/* 성적 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              전체 성적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {grades.summary.total_score.toFixed(1)}
              </span>
              <span className={`text-2xl font-semibold ${getLetterGradeColor(grades.summary.letter_grade)}`}>
                {grades.summary.letter_grade}
              </span>
            </div>
            <Progress value={grades.summary.total_score} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              제출 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">제출됨</span>
                <span className="font-medium">
                  {grades.summary.submitted_count} / {grades.assignments.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">채점완료</span>
                <span className="font-medium text-green-600">
                  {grades.summary.graded_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">채점대기</span>
                <span className="font-medium text-orange-600">
                  {grades.summary.pending_count}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              진도율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">
                {calculateProgressPercentage().toFixed(0)}%
              </div>
              <Progress value={calculateProgressPercentage()} />
              <p className="text-sm text-gray-500">
                전체 과제 중 {grades.summary.graded_count}개 채점 완료
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 과제별 성적 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>과제별 성적</CardTitle>
          <CardDescription>
            각 과제의 점수와 상태를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>과제명</TableHead>
                  <TableHead>마감일</TableHead>
                  <TableHead className="text-center">비중</TableHead>
                  <TableHead className="text-center">점수</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.title}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.due_date), 'yyyy-MM-dd HH:mm', {
                        locale: ko,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {assignment.weight}%
                    </TableCell>
                    <TableCell className="text-center">
                      {assignment.submission?.score !== null ? (
                        <span className="font-semibold">
                          {assignment.submission.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusBadge(assignment.submission)}
                        {assignment.submission?.is_late && (
                          <Badge variant="outline" className="text-xs">
                            지각
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {assignment.submission ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedSubmissionId(assignment.submission!.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          피드백
                        </Button>
                      ) : assignment.submission === null ? (
                        <Link href={`/my-courses/${courseId}/assignments/${assignment.id}`}>
                          <Button size="sm" variant="outline">
                            제출하기
                          </Button>
                        </Link>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 피드백 모달 */}
      <Dialog
        open={!!selectedSubmissionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmissionId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {feedback?.assignment.title} - 피드백
            </DialogTitle>
            <DialogDescription>
              제출물에 대한 점수와 피드백을 확인하세요
            </DialogDescription>
          </DialogHeader>
          {feedbackLoading ? (
            <div className="text-center py-4">로딩 중...</div>
          ) : feedback ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">제출일</p>
                  <p className="font-medium">
                    {format(new Date(feedback.submission.submitted_at), 'yyyy-MM-dd HH:mm', {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">점수</p>
                  <p className="text-2xl font-bold">
                    {feedback.grading.score !== null ? feedback.grading.score : '-'} / 100
                  </p>
                </div>
              </div>

              {feedback.submission.is_late && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-800">
                      이 과제는 마감일 이후에 제출되었습니다
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">제출 내용</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {feedback.submission.content_text}
                  </p>
                  {feedback.submission.content_link && (
                    <div className="mt-2">
                      <a
                        href={feedback.submission.content_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        첨부 링크 보기
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {feedback.grading.feedback && (
                <div>
                  <h4 className="font-semibold mb-2">강사 피드백</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {feedback.grading.feedback}
                    </p>
                  </div>
                </div>
              )}

              {feedback.grading.status === 'resubmission_required' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      재제출이 필요합니다. 피드백을 확인하고 다시 제출해주세요.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}