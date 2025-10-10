'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  UserPlus,
  FileText,
  BookOpen,
  Edit3,
  LucideIcon
} from 'lucide-react'
import type { Activity } from '../lib/dto'

interface ActivityItemProps {
  activity: Activity
}

const getActivityIcon = (type: Activity['type']): LucideIcon => {
  switch (type) {
    case 'enrollment':
      return UserPlus
    case 'submission':
      return FileText
    case 'course_update':
      return BookOpen
    case 'assignment_update':
      return Edit3
    default:
      return FileText
  }
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const Icon = getActivityIcon(activity.type)

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="mt-1 p-2 bg-primary/10 rounded-lg">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground">
          {activity.user_name && `${activity.user_name} • `}
          {formatDistanceToNow(new Date(activity.timestamp), {
            addSuffix: true,
            locale: ko
          })}
        </p>
      </div>
    </div>
  )
}