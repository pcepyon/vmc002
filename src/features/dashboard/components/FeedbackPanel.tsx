'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { Feedback } from '../lib/dto'

interface FeedbackPanelProps {
  feedback: Feedback[]
}

export const FeedbackPanel = ({ feedback }: FeedbackPanelProps) => {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-blue-100 text-blue-800'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            최근 피드백
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 받은 피드백이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          최근 피드백
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedback.map((item) => (
          <div
            key={item.submission_id}
            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{item.assignment_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.course_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.score !== null && (
                    <Badge className={getScoreBadgeColor(item.score)}>
                      <Star className="h-3 w-3 mr-1" />
                      {item.score}점
                    </Badge>
                  )}
                  {item.status === 'resubmission_required' && (
                    <Badge variant="outline" className="text-orange-600">
                      재제출 요청
                    </Badge>
                  )}
                </div>
              </div>

              {item.feedback && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.feedback}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.graded_at), {
                    addSuffix: true,
                    locale: ko
                  })}
                </span>
                <Link
                  href={`/my-courses/${item.course_id}/assignments/${item.assignment_id}/feedback`}
                >
                  <Button size="sm" variant="ghost">
                    자세히 보기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}