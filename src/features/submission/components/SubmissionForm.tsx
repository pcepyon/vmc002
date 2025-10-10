'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Save } from 'lucide-react';
import { useSubmissionForm } from '../hooks/useSubmissionForm';
import { useSubmitAssignment } from '../hooks/useSubmitAssignment';
import { useCanSubmit } from '../hooks/useSubmissionStatus';
import { normalizeUrl } from '@/lib/validators/url';
import type { SubmissionResponse } from '../lib/dto';

interface SubmissionFormProps {
  assignmentId: string;
  courseId: string;
  deadline: Date;
  allowLate: boolean;
  allowResubmission: boolean;
  previousSubmission?: SubmissionResponse | null;
  onCancel?: () => void;
}

export function SubmissionForm({
  assignmentId,
  courseId,
  deadline,
  allowLate,
  allowResubmission,
  previousSubmission,
  onCancel,
}: SubmissionFormProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { form, isDirty, clearDraft, saveDraft } = useSubmissionForm(assignmentId);
  const submitMutation = useSubmitAssignment(assignmentId, courseId);
  const { data: canSubmitData } = useCanSubmit(assignmentId);

  const isLate = canSubmitData?.isLate || false;
  const canSubmit = canSubmitData?.canSubmit !== false;

  const onSubmit = form.handleSubmit(() => {
    setShowConfirmDialog(true);
  });

  const handleConfirmedSubmit = async () => {
    const values = form.getValues();
    const normalizedValues = {
      ...values,
      content_link: values.content_link ? normalizeUrl(values.content_link) : '',
    };

    try {
      await submitMutation.mutateAsync(normalizedValues);
      clearDraft();
      setShowConfirmDialog(false);
    } catch (error) {
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        {canSubmitData?.message && (
          <Alert variant={isLate ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{canSubmitData.message}</AlertDescription>
          </Alert>
        )}

        {previousSubmission && (
          <Alert>
            <AlertDescription>
              이전 제출 버전: {previousSubmission.version} (
              {new Date(previousSubmission.submitted_at).toLocaleString()})
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="content_text">
            답변 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="content_text"
            {...form.register('content_text')}
            placeholder="과제 답변을 입력해주세요"
            className="min-h-[200px]"
            disabled={!canSubmit}
          />
          {form.formState.errors.content_text && (
            <p className="text-sm text-red-500">
              {form.formState.errors.content_text.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_link">참고 링크 (선택)</Label>
          <Input
            id="content_link"
            type="url"
            {...form.register('content_link')}
            placeholder="https://example.com"
            disabled={!canSubmit}
          />
          {form.formState.errors.content_link && (
            <p className="text-sm text-red-500">
              {form.formState.errors.content_link.message}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={!canSubmit || submitMutation.isPending}
            className="flex-1"
          >
            {submitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {previousSubmission && allowResubmission
              ? '재제출하기'
              : '제출하기'}
          </Button>

          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={submitMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              임시저장
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={submitMutation.isPending}
            >
              취소
            </Button>
          )}
        </div>

        {isDirty && (
          <p className="text-sm text-muted-foreground">
            자동 저장이 활성화되어 있습니다
          </p>
        )}
      </form>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과제를 제출하시겠습니까?</DialogTitle>
            <DialogDescription>
              {isLate && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    현재 마감 시간이 지났습니다. 지각 제출로 처리됩니다.
                  </AlertDescription>
                </Alert>
              )}
              <p className="mt-4">
                제출 후에는 {allowResubmission ? '수정이 가능' : '수정이 불가능'}
                합니다.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowConfirmDialog(false)}
              disabled={submitMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmedSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}