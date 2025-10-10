'use client'

import { useLearnerDashboard } from '../hooks'
import { StatsCard } from './StatsCard'
import { CourseCard } from './CourseCard'
import { DeadlineWidget } from './DeadlineWidget'
import { FeedbackPanel } from './FeedbackPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BookOpen,
  Target,
  Clock,
  Trophy,
  AlertCircle
} from 'lucide-react'

export const LearnerDashboard = () => {
  const { data, isLoading, error } = useLearnerDashboard()

  if (isLoading) {
    return <LearnerDashboardSkeleton />
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
      <div>
        <h1 className="text-3xl font-bold">학습 대시보드</h1>
        <p className="text-muted-foreground">
          학습 진행 상황과 다가오는 과제를 확인하세요
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="수강 중인 코스"
          value={data.stats.total_courses}
          icon={BookOpen}
          description="총 등록 코스 수"
        />
        <StatsCard
          title="전체 진행률"
          value={`${data.overall_progress}%`}
          icon={Target}
          description="평균 학습 진행률"
        />
        <StatsCard
          title="완료한 과제"
          value={data.stats.completed_assignments}
          icon={Trophy}
          description="채점 완료된 과제"
        />
        <StatsCard
          title="평균 점수"
          value={data.stats.average_score ?? '-'}
          icon={Trophy}
          description="과제 평균 점수"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Courses and Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <DeadlineWidget deadlines={data.upcoming_deadlines} />

          {/* Enrolled Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              수강 중인 코스
            </h2>
            {data.enrolled_courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.enrolled_courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isLearner={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">
                  아직 등록한 코스가 없습니다
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Feedback */}
        <div className="space-y-6">
          <FeedbackPanel feedback={data.recent_feedback} />

          {/* Quick Stats */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              대기 중인 과제
            </h3>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  제출 대기 과제
                </span>
                <span className="text-2xl font-bold">
                  {data.stats.pending_assignments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader component
const LearnerDashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}