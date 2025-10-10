'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { SubmissionForm } from '@/features/submission/components/SubmissionForm';
import { formatDeadlineMessage } from '@/lib/utils/deadline';
import { apiClient } from '@/lib/remote/api-client';
import { useLatestSubmission } from '@/features/submission/hooks/useSubmissionStatus';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  allow_late: boolean;
  allow_resubmission: boolean;
  status: string;
  weight: number;
}

async function fetchAssignment(assignmentId: string): Promise<Assignment> {
  const response = await apiClient.get(`/api/assignments/${assignmentId}`);
  return response.data.data;
}

export default function SubmitAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const assignmentId = params?.assignmentId as string;

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
    enabled: !!assignmentId,
  });

  const { data: latestSubmission, isLoading: submissionLoading } =
    useLatestSubmission(assignmentId);

  const isLoading = assignmentLoading || submissionLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">로딩 중...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>과제를 찾을 수 없습니다</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (assignment.status === 'closed') {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  이 과제는 마감되었습니다. 더 이상 제출할 수 없습니다.
                </AlertDescription>
              </Alert>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const deadline = new Date(assignment.due_date);
  const hasSubmitted = !!latestSubmission;
  const canResubmit = hasSubmitted && assignment.allow_resubmission;

  if (hasSubmitted && !canResubmit) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>이미 제출하셨습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  이 과제는 재제출이 허용되지 않습니다.
                  제출 내용은 피드백 페이지에서 확인하실 수 있습니다.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() =>
                    router.push(`/my-courses/${courseId}/assignments/${assignmentId}/feedback`)
                  }
                >
                  피드백 보기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  돌아가기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              {hasSubmitted ? '과제 재제출' : '과제 제출'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {assignment.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>마감일: {deadline.toLocaleString()}</span>
                </div>
                <span className="text-muted-foreground">
                  ({formatDeadlineMessage(deadline)})
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span>배점: {assignment.weight}점</span>
                <span>지각 제출: {assignment.allow_late ? '허용' : '불가'}</span>
                <span>재제출: {assignment.allow_resubmission ? '허용' : '불가'}</span>
              </div>
            </div>

            <SubmissionForm
              assignmentId={assignmentId}
              courseId={courseId}
              deadline={deadline}
              allowLate={assignment.allow_late}
              allowResubmission={assignment.allow_resubmission}
              previousSubmission={latestSubmission}
              onCancel={() => router.back()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}