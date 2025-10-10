'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { SubmissionStatus } from '@/features/submission/components/SubmissionStatus';
import { useLatestSubmission } from '@/features/submission/hooks/useSubmissionStatus';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

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

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const assignmentId = params?.assignmentId as string;

  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
    enabled: !!assignmentId,
  });

  const { data: submission, isLoading: submissionLoading } =
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

  if (!submission) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  아직 제출한 과제가 없습니다.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() =>
                    router.push(`/my-courses/${courseId}/assignments/${assignmentId}/submit`)
                  }
                >
                  과제 제출하기
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

  const needsResubmission = submission.status === 'resubmission_required';
  const canResubmit = assignment.allow_resubmission || needsResubmission;

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
            <CardDescription>과제 제출 현황 및 피드백</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SubmissionStatus
              submission={submission}
              deadline={new Date(assignment.due_date)}
            />

            {/* 제출 내용 표시 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">제출 내용</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">답변:</p>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="whitespace-pre-wrap">{submission.content_text}</p>
                  </div>
                </div>

                {submission.content_link && (
                  <div>
                    <p className="text-sm font-medium mb-2">참고 링크:</p>
                    <a
                      href={submission.content_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {submission.content_link}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            {canResubmit && (
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    router.push(`/my-courses/${courseId}/assignments/${assignmentId}/submit`)
                  }
                  variant={needsResubmission ? 'default' : 'outline'}
                >
                  {needsResubmission ? '재제출하기 (요청됨)' : '수정하기'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}