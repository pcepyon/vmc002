'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SubmissionStatus = 'not_submitted' | 'submitted' | 'late' | 'graded' | 'resubmission_required';

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function SubmissionStatusBadge({ status, className }: SubmissionStatusBadgeProps) {
  const statusConfig = {
    not_submitted: {
      label: '미제출',
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-700'
    },
    submitted: {
      label: '제출됨',
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-700'
    },
    late: {
      label: '지각 제출',
      variant: 'default' as const,
      className: 'bg-orange-100 text-orange-700'
    },
    graded: {
      label: '채점 완료',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700'
    },
    resubmission_required: {
      label: '재제출 필요',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-700'
    }
  };

  const config = statusConfig[status] || statusConfig.not_submitted;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}