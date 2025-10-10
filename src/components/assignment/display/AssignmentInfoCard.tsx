'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeadlineTimer } from '@/components/ui/deadline-timer/DeadlineTimer';
import { SubmissionStatusBadge } from '@/components/ui/status-badge/SubmissionStatusBadge';
import { CalendarDays, FileText, Percent, RotateCcw, Clock } from 'lucide-react';
import type { AssignmentDetail } from '@/features/assignment/lib/dto';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AssignmentInfoCardProps {
  assignment: AssignmentDetail;
}

export function AssignmentInfoCard({ assignment }: AssignmentInfoCardProps) {
  const getSubmissionStatus = () => {
    if (!assignment.submissionStatus?.hasSubmitted) {
      return 'not_submitted';
    }

    const submission = assignment.submissionStatus.submission;
    if (!submission) return 'not_submitted';

    if (submission.status === 'graded') return 'graded';
    if (submission.status === 'resubmission_required') return 'resubmission_required';
    if (submission.isLate) return 'late';
    return 'submitted';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{assignment.title}</CardTitle>
            {assignment.courseName && (
              <CardDescription>{assignment.courseName}</CardDescription>
            )}
          </div>
          <SubmissionStatusBadge status={getSubmissionStatus() as any} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 과제 설명 */}
        {assignment.description && (
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">{assignment.description}</p>
          </div>
        )}

        {/* 과제 정보 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 마감일 */}
          <div className="flex items-start gap-3">
            <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">마감일</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(assignment.dueDate), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </p>
              <DeadlineTimer deadline={assignment.dueDate} variant="inline" />
            </div>
          </div>

          {/* 점수 비중 */}
          <div className="flex items-start gap-3">
            <Percent className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">점수 비중</p>
              <p className="text-sm text-muted-foreground">{assignment.weight}%</p>
            </div>
          </div>

          {/* 지각 제출 정책 */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">지각 제출</p>
              <Badge variant={assignment.allowLate ? 'default' : 'secondary'}>
                {assignment.allowLate ? '허용' : '불가'}
              </Badge>
            </div>
          </div>

          {/* 재제출 정책 */}
          <div className="flex items-start gap-3">
            <RotateCcw className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">재제출</p>
              <Badge variant={assignment.allowResubmission ? 'default' : 'secondary'}>
                {assignment.allowResubmission ? '허용' : '불가'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 제출 상태 정보 */}
        {assignment.submissionStatus?.hasSubmitted && assignment.submissionStatus.submission && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">제출 정보</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">제출일시</span>
                <span>
                  {format(
                    new Date(assignment.submissionStatus.submission.submittedAt),
                    'yyyy년 MM월 dd일 HH:mm',
                    { locale: ko }
                  )}
                </span>
              </div>
              {assignment.submissionStatus.submission.isLate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">제출 상태</span>
                  <Badge variant="destructive">지각 제출</Badge>
                </div>
              )}
              {assignment.submissionStatus.submission.score !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">점수</span>
                  <span className="font-medium">{assignment.submissionStatus.submission.score}점</span>
                </div>
              )}
              {assignment.submissionStatus.submission.feedback && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">피드백</span>
                  <p className="text-sm bg-muted p-3 rounded">
                    {assignment.submissionStatus.submission.feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 과제 상태 경고 */}
        {assignment.status === 'closed' && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <FileText className="inline h-4 w-4 mr-1" />
              이 과제는 마감되었습니다. 제출이 불가능합니다.
            </p>
          </div>
        )}

        {assignment.deadlineInfo.isOverdue && !assignment.deadlineInfo.canSubmitLate && (
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              마감일이 지났으며, 지각 제출이 허용되지 않습니다.
            </p>
          </div>
        )}

        {assignment.deadlineInfo.isOverdue && assignment.deadlineInfo.canSubmitLate && (
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              마감일이 지났지만 지각 제출이 가능합니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}