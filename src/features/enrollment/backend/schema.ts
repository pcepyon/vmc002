import { z } from 'zod';

// 수강신청 응답 스키마
export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  enrolledAt: z.string().datetime(),
  progress: z.number().min(0).max(100)
});

export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;

// 내 수강 코스 스키마
export const MyEnrollmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  enrolledAt: z.string().datetime(),
  progress: z.number(),
  course: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    category: z.string().nullable(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    instructorName: z.string().optional()
  })
});

export type MyEnrollment = z.infer<typeof MyEnrollmentSchema>;

// 수강 상태 응답 스키마
export const EnrollmentStatusSchema = z.object({
  isEnrolled: z.boolean(),
  enrollment: EnrollmentResponseSchema.nullable()
});

export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;