'use client';

import { useDeadlineStatus } from '@/features/assignment/hooks/useDeadlineStatus';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface DeadlineTimerProps {
  deadline: string | Date;
  onExpire?: () => void;
  showSeconds?: boolean;
  variant?: 'inline' | 'block';
  className?: string;
}

export function DeadlineTimer({
  deadline,
  onExpire,
  showSeconds = false,
  variant = 'inline',
  className
}: DeadlineTimerProps) {
  const { formattedTime, isExpired, urgencyLevel } = useDeadlineStatus(deadline);

  // 만료 시 콜백 호출
  if (isExpired && onExpire) {
    onExpire();
  }

  const colorClasses = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-gray-600 dark:text-gray-400'
  };

  const bgClasses = {
    high: 'bg-red-50 dark:bg-red-950',
    medium: 'bg-yellow-50 dark:bg-yellow-950',
    low: 'bg-gray-50 dark:bg-gray-950'
  };

  if (variant === 'block') {
    return (
      <div
        className={cn(
          'p-3 rounded-lg flex items-center gap-2',
          bgClasses[isExpired ? 'high' : urgencyLevel],
          className
        )}
      >
        <Clock className={cn('h-4 w-4', colorClasses[isExpired ? 'high' : urgencyLevel])} />
        <span className={cn('font-medium', colorClasses[isExpired ? 'high' : urgencyLevel])}>
          {formattedTime}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Clock className={cn('h-4 w-4', colorClasses[isExpired ? 'high' : urgencyLevel])} />
      <span className={cn('text-sm', colorClasses[isExpired ? 'high' : urgencyLevel])}>
        {formattedTime}
      </span>
    </div>
  );
}