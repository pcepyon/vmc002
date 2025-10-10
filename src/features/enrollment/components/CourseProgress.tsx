'use client';

import { Progress } from '@/components/ui/progress';

interface CourseProgressProps {
  progress: number;
  className?: string;
}

export const CourseProgress = ({ progress, className }: CourseProgressProps) => {
  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">진행률</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};