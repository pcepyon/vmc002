'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { PendingSubmission } from '../lib/dto'

interface PendingSubmissionsCardProps {
  submissions: PendingSubmission[]
}

export const PendingSubmissionsCard = ({ submissions }: PendingSubmissionsCardProps) => {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            미채점 제출물
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            채점 대기 중인 제출물이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            미채점 제출물
          </CardTitle>
          <Badge variant="destructive">
            {submissions.length}개 대기 중
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.slice(0, 5).map((submission) => (
          <div
            key={submission.submission_id}
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {submission.assignment_title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {submission.course_title}
                  </p>
                </div>
                {submission.is_late && (
                  <Badge variant="outline" className="text-orange-600">
                    지각 제출
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{submission.learner_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(submission.submitted_at), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </span>
                </div>
              </div>

              <Link
                href={`/manage/courses/${submission.course_id}/assignments/${submission.assignment_id}/submissions`}
              >
                <Button size="sm" className="w-full">
                  채점하기
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {submissions.length > 5 && (
          <div className="text-center pt-2">
            <Link href="/manage/submissions">
              <Button variant="ghost" size="sm">
                모두 보기 ({submissions.length}개)
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}