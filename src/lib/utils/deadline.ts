export function isBeforeDeadline(deadline: Date): boolean {
  return new Date() < deadline;
}

export function calculateLateStatus(
  deadline: Date,
  allowLate: boolean
): { canSubmit: boolean; isLate: boolean; message?: string } {
  const now = new Date();

  if (now < deadline) {
    return { canSubmit: true, isLate: false };
  }

  if (allowLate) {
    return {
      canSubmit: true,
      isLate: true,
      message: '지각 제출입니다. 점수가 감점될 수 있습니다.'
    };
  }

  return {
    canSubmit: false,
    isLate: true,
    message: '마감일이 지났습니다.'
  };
}

export function getTimeRemaining(deadline: Date): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isOverdue: true,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days,
    hours,
    minutes,
    isOverdue: false,
  };
}

export function formatDeadlineMessage(deadline: Date): string {
  const remaining = getTimeRemaining(deadline);

  if (remaining.isOverdue) {
    return '마감일이 지났습니다';
  }

  if (remaining.days > 0) {
    return `${remaining.days}일 ${remaining.hours}시간 남음`;
  }

  if (remaining.hours > 0) {
    return `${remaining.hours}시간 ${remaining.minutes}분 남음`;
  }

  return `${remaining.minutes}분 남음`;
}