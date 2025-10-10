'use client'

import { useInstructorDashboard } from '../hooks'
import { StatsCard } from './StatsCard'
import { CourseCard } from './CourseCard'
import { PendingSubmissionsCard } from './PendingSubmissionsCard'
import { ActivityItem } from './ActivityItem'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Plus,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export const InstructorDashboard = () => {
  const { data, isLoading, error } = useInstructorDashboard()

  if (isLoading) {
    return <InstructorDashboardSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          대시보드 데이터를 불러오는 중 오류가 발생했습니다.
          잠시 후 다시 시도해 주세요.
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">강사 대시보드</h1>
          <p className="text-muted-foreground">
            코스 관리와 학생 활동을 모니터링하세요
          </p>
        </div>
        <Link href="/manage/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 코스 만들기
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="전체 학생 수"
          value={data.statistics.total_students}
          icon={Users}
          description="모든 코스의 학생"
        />
        <StatsCard
          title="활성 코스"
          value={data.statistics.active_courses}
          icon={BookOpen}
          description={`총 ${data.statistics.total_courses}개 중`}
        />
        <StatsCard
          title="미채점 제출물"
          value={data.statistics.pending_submissions}
          icon={FileText}
          description="채점 대기 중"
        />
        <StatsCard
          title="평균 점수"
          value={data.statistics.average_score ?? '-'}
          icon={TrendingUp}
          description="전체 과제 평균"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Courses and Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                내 코스
              </h2>
              <Link href="/manage/courses">
                <Button variant="ghost" size="sm">
                  모두 보기
                </Button>
              </Link>
            </div>

            {data.my_courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.my_courses.slice(0, 4).map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isLearner={false}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    아직 생성한 코스가 없습니다
                  </p>
                  <Link href="/manage/courses/new">
                    <Button>첫 코스 만들기</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                코스 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    임시저장 코스
                  </span>
                  <span className="font-medium">
                    {data.statistics.courses_by_status.draft}개
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    게시된 코스
                  </span>
                  <span className="font-medium">
                    {data.statistics.courses_by_status.published}개
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    보관된 코스
                  </span>
                  <span className="font-medium">
                    {data.statistics.courses_by_status.archived}개
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    제출률
                  </span>
                  <span className="font-medium">
                    {data.statistics.submission_rate}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pending Submissions and Activities */}
        <div className="space-y-6">
          {/* Pending Submissions */}
          <PendingSubmissionsCard submissions={data.pending_submissions} />

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.recent_activities.length > 0 ? (
                data.recent_activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  최근 활동이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader component
const InstructorDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}