import { z } from 'zod';

// 채점 요청 스키마
export const GradeSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1, '피드백을 입력해주세요').max(5000),
  request_resubmission: z.boolean().optional().default(false),
});

// 일괄 채점 스키마
export const BatchGradeSchema = z.object({
  submissions: z.array(z.object({
    id: z.string().uuid(),
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
  })),
});

// 채점 필터 스키마
export const GradingFilterSchema = z.object({
  status: z.enum(['all', 'ungraded', 'graded', 'late']).optional(),
  sortBy: z.enum(['submitted_at', 'name', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 제출물 상세 스키마 (채점용)
export const SubmissionForGradingSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  user_email: z.string(),
  content_text: z.string(),
  content_link: z.string().nullable(),
  submitted_at: z.string(),
  is_late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  version: z.number(),
});

// 채점 통계 스키마
export const GradingStatsSchema = z.object({
  total: z.number(),
  graded: z.number(),
  ungraded: z.number(),
  late: z.number(),
  averageScore: z.number().nullable(),
  submissionRate: z.number(),
});

// 채점 대기열 스키마
export const GradingQueueSchema = z.object({
  assignments: z.array(z.object({
    id: z.string().uuid(),
    course_id: z.string().uuid(),
    course_title: z.string(),
    title: z.string(),
    due_date: z.string(),
    ungraded_count: z.number(),
    total_submissions: z.number(),
  })),
});

export type GradeSubmissionDto = z.infer<typeof GradeSubmissionSchema>;
export type BatchGradeDto = z.infer<typeof BatchGradeSchema>;
export type GradingFilter = z.infer<typeof GradingFilterSchema>;
export type SubmissionForGrading = z.infer<typeof SubmissionForGradingSchema>;
export type GradingStats = z.infer<typeof GradingStatsSchema>;
export type GradingQueue = z.infer<typeof GradingQueueSchema>;