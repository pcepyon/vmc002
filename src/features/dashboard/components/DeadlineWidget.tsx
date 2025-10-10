'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { Deadline } from '../lib/dto'

interface DeadlineWidgetProps {
  deadlines: Deadline[]
}

export const DeadlineWidget = ({ deadlines }: DeadlineWidgetProps) => {
  const getStatusBadge = (deadline: Deadline) => {
    if (deadline.submission_status === 'submitted') {
      return <Badge variant="secondary">제출 완료</Badge>
    }
    if (deadline.submission_status === 'graded') {
      return <Badge className="bg-green-100 text-green-800">채점 완료</Badge>
    }
    if (deadline.submission_status === 'resubmission_required') {
      return <Badge className="bg-yellow-100 text-yellow-800">재제출 요청</Badge>
    }
    if (isPast(new Date(deadline.due_date))) {
      return <Badge variant="destructive">마감됨</Badge>
    }
    return <Badge variant="outline">미제출</Badge>
  }

  const isUrgent = (dueDate: string) => {
    const hoursLeft = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursLeft < 24 && hoursLeft > 0
  }

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            다가오는 과제
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            예정된 과제가 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          다가오는 과제
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadlines.map((deadline) => (
          <div
            key={deadline.assignment_id}
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-medium text-sm">{deadline.assignment_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.course_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isUrgent(deadline.due_date) && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span
                    className={`text-xs ${
                      isUrgent(deadline.due_date)
                        ? 'text-orange-600 font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatDistanceToNow(new Date(deadline.due_date), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(deadline)}
                {deadline.submission_status === 'not_submitted' &&
                  !isPast(new Date(deadline.due_date)) && (
                    <Link
                      href={`/my-courses/${deadline.course_id}/assignments/${deadline.assignment_id}`}
                    >
                      <Button size="sm" variant="outline">
                        제출하기
                      </Button>
                    </Link>
                  )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}