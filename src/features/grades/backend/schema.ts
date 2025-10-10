import { z } from 'zod';

// 성적 응답 스키마
export const GradeResponseSchema = z.object({
  course: z.object({
    id: z.string(),
    title: z.string(),
  }),
  assignments: z.array(z.object({
    id: z.string(),
    title: z.string(),
    due_date: z.string(),
    weight: z.number(),
    submission: z.object({
      id: z.string(),
      score: z.number().nullable(),
      status: z.enum(['submitted', 'graded', 'resubmission_required']),
      is_late: z.boolean(),
      feedback: z.string().nullable(),
      version: z.number(),
      submitted_at: z.string(),
    }).nullable(),
  })),
  summary: z.object({
    total_score: z.number(),
    submitted_count: z.number(),
    graded_count: z.number(),
    pending_count: z.number(),
    average_score: z.number(),
    letter_grade: z.string(),
  }),
});

export type GradeResponse = z.infer<typeof GradeResponseSchema>;

// 피드백 상세 스키마
export const FeedbackDetailSchema = z.object({
  submission: z.object({
    id: z.string(),
    content_text: z.string(),
    content_link: z.string().nullable(),
    submitted_at: z.string(),
    is_late: z.boolean(),
  }),
  grading: z.object({
    score: z.number().nullable(),
    feedback: z.string().nullable(),
    status: z.string(),
  }),
  assignment: z.object({
    title: z.string(),
    weight: z.number(),
    due_date: z.string(),
  }),
});

export type FeedbackDetail = z.infer<typeof FeedbackDetailSchema>;

// 성적 요약 스키마
export const GradeSummarySchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  totalScore: z.number(),
  letterGrade: z.string(),
  progress: z.number(),
  assignments: z.array(z.object({
    id: z.string(),
    title: z.string(),
    score: z.number().nullable(),
    weight: z.number(),
    status: z.enum(['not_submitted', 'submitted', 'graded', 'resubmission_required']),
  })),
});

export type GradeSummary = z.infer<typeof GradeSummarySchema>;

// 성적표 스키마
export const TranscriptSchema = z.object({
  student: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  courses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    instructor: z.string(),
    totalScore: z.number(),
    letterGrade: z.string(),
    completionDate: z.string().nullable(),
  })),
  generatedAt: z.string(),
});

export type Transcript = z.infer<typeof TranscriptSchema>;