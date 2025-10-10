'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, FileText, Clock, TrendingUp } from 'lucide-react';
import type { GradingStats } from '../lib/dto';

interface GradingStatsProps {
  stats: GradingStats;
}

export function GradingStatsCard({ stats }: GradingStatsProps) {
  const gradedPercentage = stats.total > 0
    ? (stats.graded / stats.total) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            전체 제출
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="mt-2">
            <Progress value={gradedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.graded}/{stats.total} 채점 완료
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            미채점
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ungraded}</div>
          <p className="text-xs text-muted-foreground">
            채점 대기 중
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            제출률
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.submissionRate}%</div>
          <p className="text-xs text-muted-foreground">
            수강생 대비
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            평균 점수
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageScore !== null
              ? Math.round(stats.averageScore)
              : '-'}
          </div>
          <p className="text-xs text-muted-foreground">
            지각: {stats.late}건
          </p>
        </CardContent>
      </Card>
    </div>
  );
}