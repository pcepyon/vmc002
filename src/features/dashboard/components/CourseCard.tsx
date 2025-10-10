'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { DashboardCourse } from '../lib/dto'

interface CourseCardProps {
  course: DashboardCourse
  isLearner?: boolean
}

export const CourseCard = ({ course, isLearner = false }: CourseCardProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
          <Badge className={getDifficultyColor(course.difficulty)}>
            {course.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.category && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.category}</span>
            </div>
          )}
          {course.student_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.student_count}명</span>
            </div>
          )}
        </div>

        {isLearner && course.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}

        {!isLearner && (
          <Badge className={getStatusColor(course.status)}>
            {course.status === 'draft' && '임시저장'}
            {course.status === 'published' && '게시됨'}
            {course.status === 'archived' && '보관됨'}
          </Badge>
        )}

        <div className="flex gap-2">
          {isLearner ? (
            <Link href={`/my-courses/${course.id}`} className="w-full">
              <Button variant="default" className="w-full">
                학습 계속하기
              </Button>
            </Link>
          ) : (
            <Link href={`/manage/courses/${course.id}/edit`} className="w-full">
              <Button variant="outline" className="w-full">
                코스 관리
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}