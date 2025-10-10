'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentQuery } from '@/features/assignment/hooks/useAssignmentQuery';
import { AssignmentInfoCard } from '@/components/assignment/display/AssignmentInfoCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageProps {
  params: Promise<{
    courseId: string;
    assignmentId: string;
  }>;
}

export default function AssignmentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [courseId, setCourseId] = useState<string | undefined>();
  const [assignmentId, setAssignmentId] = useState<string | undefined>();
  const [contentText, setContentText] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // params를 비동기적으로 처리
  useEffect(() => {
    params.then((p) => {
      setCourseId(p.courseId);
      setAssignmentId(p.assignmentId);
    });
  }, [params]);

  const { data: assignment, isLoading, isError, error } = useAssignmentQuery(assignmentId);

  // 기존 제출물이 있으면 폼에 채우기
  useEffect(() => {
    if (assignment?.submissionStatus?.submission) {
      setContentText(assignment.submissionStatus.submission.contentText);
      setContentLink(assignment.submissionStatus.submission.contentLink || '');
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentText.trim()) {
      toast({
        title: '오류',
        description: '제출 내용을 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 여기에 실제 제출 API 호출 로직 추가
      toast({
        title: '제출 완료',
        description: '과제가 성공적으로 제출되었습니다.'
      });

      // 페이지 새로고침 또는 리다이렉트
      router.refresh();
    } catch (error) {
      toast({
        title: '제출 실패',
        description: '과제 제출 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
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

  if (isError) {
    const errorMessage = error?.message || '과제를 불러올 수 없습니다.';
    const is403 = errorMessage.includes('수강 등록이 필요');
    const is404 = errorMessage.includes('찾을 수 없');

    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {is403 && '접근 권한이 없습니다'}
              {is404 && '과제를 찾을 수 없습니다'}
              {!is403 && !is404 && '오류가 발생했습니다'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {is403 && '이 과제를 보려면 코스에 수강 등록이 필요합니다.'}
              {is404 && '요청하신 과제가 존재하지 않거나 삭제되었습니다.'}
              {!is403 && !is404 && errorMessage}
            </p>
            <Button onClick={() => router.push(`/my-courses/${courseId}`)}>
              코스로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return null;
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

      {/* 과제 정보 */}
      <div className="mb-8">
        <AssignmentInfoCard assignment={assignment} />
      </div>

      {/* 제출 폼 */}
      {assignment.canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle>과제 제출</CardTitle>
            <CardDescription>
              아래 양식에 과제 내용을 입력하고 제출하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="content">제출 내용 *</Label>
                <Textarea
                  id="content"
                  placeholder="과제 내용을 입력하세요..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 min-h-[200px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="link">참고 링크 (선택)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  value={contentLink}
                  onChange={(e) => setContentLink(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  GitHub, Google Drive 등의 링크를 입력할 수 있습니다.
                </p>
              </div>

              {assignment.deadlineInfo.isOverdue && assignment.deadlineInfo.canSubmitLate && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    마감일이 지났지만 지각 제출이 가능합니다. 제출하시겠습니까?
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !contentText.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {assignment.submissionStatus?.hasSubmitted ? '재제출' : '제출'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {assignment.status === 'closed'
                ? '이 과제는 마감되었습니다.'
                : assignment.deadlineInfo.isOverdue && !assignment.deadlineInfo.canSubmitLate
                ? '마감일이 지났으며, 지각 제출이 허용되지 않습니다.'
                : '현재 제출할 수 없는 상태입니다.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}