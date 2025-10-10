import { z } from 'zod';

// 과제 상태 enum
export const AssignmentStatus = z.enum(['draft', 'published', 'closed']);
export type AssignmentStatus = z.infer<typeof AssignmentStatus>;

// 제출물 상태 enum
export const SubmissionStatus = z.enum(['submitted', 'graded', 'resubmission_required']);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

// 과제 응답 스키마
export const AssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().datetime(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  status: AssignmentStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;

// 과제 상세 스키마
export const AssignmentDetailSchema = AssignmentResponseSchema.extend({
  courseName: z.string().optional(),
  canSubmit: z.boolean(),
  submissionStatus: z.object({
    hasSubmitted: z.boolean(),
    submission: z.object({
      id: z.string().uuid(),
      contentText: z.string(),
      contentLink: z.string().nullable(),
      submittedAt: z.string().datetime(),
      isLate: z.boolean(),
      score: z.number().nullable(),
      feedback: z.string().nullable(),
      status: SubmissionStatus,
      version: z.number()
    }).nullable()
  }).optional(),
  deadlineInfo: z.object({
    isOverdue: z.boolean(),
    timeRemaining: z.string().nullable(),
    canSubmitLate: z.boolean()
  })
});

export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;

// 과제 목록 스키마
export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentResponseSchema.extend({
    submissionStatus: z.enum(['not_submitted', 'submitted', 'graded', 'resubmission_required']).optional()
  }))
});

export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

// 과제 접근 권한 스키마
export const AssignmentAccessSchema = z.object({
  hasAccess: z.boolean(),
  isEnrolled: z.boolean(),
  isPublished: z.boolean(),
  reason: z.string().optional()
});

export type AssignmentAccess = z.infer<typeof AssignmentAccessSchema>;

// 과제 생성 스키마
export const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  due_date: z.string().datetime(),
  weight: z.number().min(0).max(100).default(0),
  allow_late: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

// 과제 수정 스키마
export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();

export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

// 과제 게시 검증 스키마
export const PublishValidationSchema = z.object({
  title: z.string().min(1),
  due_date: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    '마감일은 현재 시간 이후여야 합니다'
  ),
});