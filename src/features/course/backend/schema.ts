import { z } from 'zod';

// 난이도 enum
export const DifficultyLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

// 코스 상태 enum
export const CourseStatus = z.enum(['draft', 'published', 'archived']);
export type CourseStatus = z.infer<typeof CourseStatus>;

// 정렬 옵션
export const SortBy = z.enum(['latest', 'popular']);
export type SortBy = z.infer<typeof SortBy>;

// 코스 목록 조회 쿼리 스키마
export const CourseListQuerySchema = z.object({
  category: z.string().optional(),
  difficulty: DifficultyLevel.optional(),
  sort: SortBy.optional().default('latest'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
});

export type CourseListQuery = z.infer<typeof CourseListQuerySchema>;

// 코스 응답 스키마
export const CourseResponseSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  difficulty: DifficultyLevel,
  status: CourseStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // 추가 정보
  instructorName: z.string().optional(),
  enrollmentCount: z.number().optional(),
  averageRating: z.number().optional()
});

export type CourseResponse = z.infer<typeof CourseResponseSchema>;

// 코스 상세 스키마
export const CourseDetailSchema = CourseResponseSchema.extend({
  curriculum: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    order: z.number()
  })).optional(),
  isEnrolled: z.boolean().optional()
});

export type CourseDetail = z.infer<typeof CourseDetailSchema>;

// 코스 목록 응답 스키마
export const CourseListResponseSchema = z.object({
  courses: z.array(CourseResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export type CourseListResponse = z.infer<typeof CourseListResponseSchema>;