import { z } from 'zod';

// 제출 요청 스키마
export const SubmitAssignmentSchema = z.object({
  content_text: z.string().min(1, '답변을 입력해주세요').max(10000),
  content_link: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
});

// 제출 응답 스키마
export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  content_text: z.string(),
  content_link: z.string().nullable(),
  submitted_at: z.string(),
  is_late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  version: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 제출 이력 조회 스키마
export const SubmissionsListSchema = z.object({
  submissions: z.array(SubmissionResponseSchema),
  total: z.number(),
});

// 제출물 수정 스키마
export const UpdateSubmissionSchema = z.object({
  content_text: z.string().min(1, '답변을 입력해주세요').max(10000),
  content_link: z.string().url('올바른 URL 형식이 아닙니다').optional().or(z.literal('')),
});

export type SubmitAssignmentDto = z.infer<typeof SubmitAssignmentSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type SubmissionsList = z.infer<typeof SubmissionsListSchema>;
export type UpdateSubmissionDto = z.infer<typeof UpdateSubmissionSchema>;