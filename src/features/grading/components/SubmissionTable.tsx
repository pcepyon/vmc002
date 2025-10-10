'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { SubmissionForGrading } from '../lib/dto';
import { GradingModal } from './GradingModal';

interface SubmissionTableProps {
  submissions: SubmissionForGrading[];
  onRefresh?: () => void;
  allowBatchGrading?: boolean;
  onBatchGrade?: (ids: string[]) => void;
}

export function SubmissionTable({
  submissions,
  onRefresh,
  allowBatchGrading = false,
  onBatchGrade,
}: SubmissionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionForGrading | null>(null);
  const [gradingIndex, setGradingIndex] = useState<number>(-1);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const openGradingModal = (submission: SubmissionForGrading, index: number) => {
    setGradingSubmission(submission);
    setGradingIndex(index);
  };

  const handleNext = () => {
    if (gradingIndex < submissions.length - 1) {
      const nextSubmission = submissions[gradingIndex + 1];
      setGradingSubmission(nextSubmission);
      setGradingIndex(gradingIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (gradingIndex > 0) {
      const prevSubmission = submissions[gradingIndex - 1];
      setGradingSubmission(prevSubmission);
      setGradingIndex(gradingIndex - 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'resubmission_required':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge variant="default">채점완료</Badge>;
      case 'resubmission_required':
        return <Badge variant="secondary">재제출 요청</Badge>;
      default:
        return <Badge variant="outline">미채점</Badge>;
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        제출된 과제가 없습니다
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {allowBatchGrading && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === submissions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>학생</TableHead>
              <TableHead>제출 시간</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">점수</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission, index) => (
              <TableRow
                key={submission.id}
                className={submission.status === 'submitted' ? 'bg-muted/30' : ''}
              >
                {allowBatchGrading && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(submission.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(submission.id, checked as boolean)
                      }
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="font-medium">{submission.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {submission.user_email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.submitted_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    {submission.is_late && (
                      <Badge variant="destructive" className="w-fit">
                        <Clock className="mr-1 h-3 w-3" />
                        지각
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    {getStatusBadge(submission.status)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {submission.score !== null ? (
                    <span className="font-bold">{submission.score}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={submission.status === 'submitted' ? 'default' : 'outline'}
                    onClick={() => openGradingModal(submission, index)}
                  >
                    {submission.status === 'submitted' ? '채점하기' : '수정하기'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {allowBatchGrading && selectedIds.size > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size}개 선택됨
          </span>
          <Button
            onClick={() => onBatchGrade?.(Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
          >
            일괄 채점
          </Button>
        </div>
      )}

      {gradingSubmission && (
        <GradingModal
          submission={gradingSubmission}
          open={!!gradingSubmission}
          onOpenChange={(open) => {
            if (!open) {
              setGradingSubmission(null);
              setGradingIndex(-1);
              onRefresh?.();
            }
          }}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={gradingIndex < submissions.length - 1}
          hasPrevious={gradingIndex > 0}
        />
      )}
    </>
  );
}