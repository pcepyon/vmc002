'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SubmissionResponse } from '../lib/dto';

interface SubmissionStatusProps {
  submission: SubmissionResponse | null;
  deadline: Date;
}

export function SubmissionStatus({ submission, deadline }: SubmissionStatusProps) {
  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">제출 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>아직 제출하지 않았습니다</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            마감일: {new Date(deadline).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (submission.status) {
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'resubmission_required':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'graded':
        return <Badge variant="default">채점완료</Badge>;
      case 'resubmission_required':
        return <Badge variant="secondary">재제출 요청</Badge>;
      default:
        return <Badge variant="outline">제출됨</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">제출 상태</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusBadge()}
              {submission.is_late && (
                <Badge variant="destructive">
                  <Clock className="mr-1 h-3 w-3" />
                  지각
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              버전 {submission.version}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">제출 시간:</span>{' '}
              {new Date(submission.submitted_at).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(submission.submitted_at), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>

          {submission.score !== null && (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">점수:</span>{' '}
                <span className="text-lg font-bold">{submission.score}</span> / 100
              </p>
            </div>
          )}

          {submission.feedback && (
            <div className="space-y-2">
              <p className="text-sm font-medium">피드백:</p>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            </div>
          )}

          {submission.status === 'resubmission_required' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                강사가 재제출을 요청했습니다. 피드백을 확인하고 다시 제출해주세요.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}