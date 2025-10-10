'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GradeSubmissionSchema, type GradeSubmissionDto, type SubmissionForGrading } from '../lib/dto';
import { useGradeMutation } from '../hooks/useGradeMutation';

interface GradingModalProps {
  submission: SubmissionForGrading;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const QUICK_SCORES = [100, 90, 80, 70, 60];

const FEEDBACK_TEMPLATES = {
  excellent: '훌륭한 과제입니다! 모든 요구사항을 충족했습니다.',
  good: '좋은 시도입니다. 다음 부분을 개선하면 더 좋을 것 같습니다:',
  needsWork: '기본 요구사항은 충족했으나 다음 부분이 부족합니다:',
  incomplete: '제출이 불완전합니다. 다음 부분을 보완해주세요:',
};

export function GradingModal({
  submission,
  open,
  onOpenChange,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: GradingModalProps) {
  const [requestResubmission, setRequestResubmission] = useState(false);

  const gradeMutation = useGradeMutation();

  const form = useForm<GradeSubmissionDto>({
    resolver: zodResolver(GradeSubmissionSchema),
    defaultValues: {
      score: submission.score || 0,
      feedback: submission.feedback || '',
      request_resubmission: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await gradeMutation.mutateAsync({
        submissionId: submission.id,
        data: {
          ...data,
          request_resubmission: requestResubmission,
        },
      });

      onOpenChange(false);

      // 다음 제출물로 이동
      if (hasNext && onNext) {
        setTimeout(onNext, 500);
      }
    } catch (error) {
      // Error handled by mutation
    }
  });

  const applyTemplate = (template: string) => {
    const currentFeedback = form.getValues('feedback');
    form.setValue('feedback', currentFeedback
      ? `${currentFeedback}\n\n${template}`
      : template
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>과제 채점</DialogTitle>
          <DialogDescription>
            제출자: {submission.user_name} ({submission.user_email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제출 정보 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    제출 시간: {new Date(submission.submitted_at).toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({formatDistanceToNow(new Date(submission.submitted_at), {
                      addSuffix: true,
                      locale: ko,
                    })})
                  </span>
                  {submission.is_late && (
                    <Badge variant="destructive">
                      <Clock className="mr-1 h-3 w-3" />
                      지각
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">버전 {submission.version}</Badge>
              </div>

              {/* 제출 내용 */}
              <div className="space-y-4">
                <div>
                  <Label>답변 내용</Label>
                  <div className="mt-2 rounded-lg bg-muted p-4 max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">
                      {submission.content_text}
                    </p>
                  </div>
                </div>

                {submission.content_link && (
                  <div>
                    <Label>참고 링크</Label>
                    <div className="mt-2">
                      <a
                        href={submission.content_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        {submission.content_link}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 점수 입력 */}
          <div className="space-y-2">
            <Label htmlFor="score">
              점수: <span className="text-lg font-bold">{form.watch('score')}</span> / 100
            </Label>
            <Slider
              id="score"
              min={0}
              max={100}
              step={1}
              value={[form.watch('score')]}
              onValueChange={(value) => form.setValue('score', value[0])}
              className="py-4"
            />
            <div className="flex gap-2 mt-2">
              {QUICK_SCORES.map((score) => (
                <Button
                  key={score}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => form.setValue('score', score)}
                >
                  {score}
                </Button>
              ))}
            </div>
          </div>

          {/* 피드백 입력 */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              피드백 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyTemplate(FEEDBACK_TEMPLATES.excellent)}
              >
                우수
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyTemplate(FEEDBACK_TEMPLATES.good)}
              >
                양호
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyTemplate(FEEDBACK_TEMPLATES.needsWork)}
              >
                보통
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => applyTemplate(FEEDBACK_TEMPLATES.incomplete)}
              >
                미흡
              </Button>
            </div>
            <Textarea
              id="feedback"
              {...form.register('feedback')}
              placeholder="학습자에게 전달할 피드백을 입력하세요"
              className="min-h-[120px]"
            />
            {form.formState.errors.feedback && (
              <p className="text-sm text-red-500">
                {form.formState.errors.feedback.message}
              </p>
            )}
          </div>

          {/* 재제출 요청 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="request_resubmission"
              checked={requestResubmission}
              onCheckedChange={(checked) =>
                setRequestResubmission(checked as boolean)
              }
            />
            <Label
              htmlFor="request_resubmission"
              className="text-sm font-normal cursor-pointer"
            >
              재제출 요청하기 (학습자가 과제를 다시 제출할 수 있습니다)
            </Label>
          </div>

          <DialogFooter className="gap-2">
            {hasPrevious && (
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                disabled={gradeMutation.isPending}
              >
                이전
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={gradeMutation.isPending}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={gradeMutation.isPending}
            >
              {gradeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              채점 완료
              {hasNext && ' & 다음'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}