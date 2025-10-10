import { z } from 'zod'

// Course Schema for dashboard
const DashboardCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  instructor_id: z.string().uuid(),
  instructor_name: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // For learner dashboard
  progress: z.number().min(0).max(100).optional(),
  enrolled_at: z.string().optional(),
  // For instructor dashboard
  student_count: z.number().optional(),
})

// Deadline Schema for learner
const DeadlineSchema = z.object({
  assignment_id: z.string().uuid(),
  assignment_title: z.string(),
  course_id: z.string().uuid(),
  course_title: z.string(),
  due_date: z.string(),
  weight: z.number().min(0).max(100),
  status: z.enum(['draft', 'published', 'closed']),
  submission_status: z.enum(['not_submitted', 'submitted', 'graded', 'resubmission_required']).optional(),
  is_late: z.boolean().optional(),
})

// Feedback Schema for learner
const FeedbackSchema = z.object({
  submission_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  assignment_title: z.string(),
  course_id: z.string().uuid(),
  course_title: z.string(),
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  graded_at: z.string(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
})

// Submission Schema for instructor
const PendingSubmissionSchema = z.object({
  submission_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  assignment_title: z.string(),
  course_id: z.string().uuid(),
  course_title: z.string(),
  user_id: z.string().uuid(),
  learner_name: z.string(),
  submitted_at: z.string(),
  is_late: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  content_text: z.string(),
  content_link: z.string().nullable(),
})

// Activity Schema for instructor
const ActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['enrollment', 'submission', 'course_update', 'assignment_update']),
  title: z.string(),
  description: z.string(),
  user_name: z.string().nullable(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
})

// Statistics Schema for instructor
const StatsSchema = z.object({
  total_students: z.number(),
  total_courses: z.number(),
  active_courses: z.number(),
  pending_submissions: z.number(),
  average_score: z.number().nullable(),
  submission_rate: z.number(),
  courses_by_status: z.object({
    draft: z.number(),
    published: z.number(),
    archived: z.number(),
  }),
})

// Learner Dashboard Response Schema
export const LearnerDashboardResponseSchema = z.object({
  enrolled_courses: z.array(DashboardCourseSchema),
  upcoming_deadlines: z.array(DeadlineSchema),
  recent_feedback: z.array(FeedbackSchema),
  overall_progress: z.number().min(0).max(100),
  stats: z.object({
    total_courses: z.number(),
    completed_assignments: z.number(),
    pending_assignments: z.number(),
    average_score: z.number().nullable(),
  }),
})

// Instructor Dashboard Response Schema
export const InstructorDashboardResponseSchema = z.object({
  my_courses: z.array(DashboardCourseSchema),
  pending_submissions: z.array(PendingSubmissionSchema),
  recent_activities: z.array(ActivitySchema),
  statistics: StatsSchema,
})

// Request Schema for dashboard data (usually just needs user context)
export const DashboardRequestSchema = z.object({
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
})

// Export types
export type DashboardCourse = z.infer<typeof DashboardCourseSchema>
export type Deadline = z.infer<typeof DeadlineSchema>
export type Feedback = z.infer<typeof FeedbackSchema>
export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>
export type Activity = z.infer<typeof ActivitySchema>
export type Stats = z.infer<typeof StatsSchema>
export type LearnerDashboardResponse = z.infer<typeof LearnerDashboardResponseSchema>
export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>
export type DashboardRequest = z.infer<typeof DashboardRequestSchema>