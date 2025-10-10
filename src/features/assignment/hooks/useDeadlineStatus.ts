'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function useDeadlineStatus(deadline: string | Date) {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date();
    const difference = deadlineDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [isExpired, setIsExpired] = useState(timeLeft.total <= 0);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);

      if (left.total <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineDate]);

  const getUrgencyLevel = (): 'high' | 'medium' | 'low' => {
    const hoursLeft = timeLeft.total / (1000 * 60 * 60);
    if (hoursLeft < 1) return 'high';
    if (hoursLeft < 24) return 'medium';
    return 'low';
  };

  const getFormattedTime = (): string => {
    if (isExpired) return '마감됨';

    if (timeLeft.days > 0) {
      return `${timeLeft.days}일 ${timeLeft.hours}시간 남음`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}시간 ${timeLeft.minutes}분 남음`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}분 ${timeLeft.seconds}초 남음`;
    } else {
      return `${timeLeft.seconds}초 남음`;
    }
  };

  return {
    timeLeft,
    isExpired,
    urgencyLevel: getUrgencyLevel(),
    formattedTime: getFormattedTime()
  };
}