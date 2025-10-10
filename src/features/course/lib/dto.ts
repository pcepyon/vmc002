// 백엔드 스키마 재노출 (프론트엔드에서 사용)
export type {
  DifficultyLevel,
  CourseStatus,
  SortBy,
  CourseListQuery,
  CourseResponse,
  CourseDetail,
  CourseListResponse
} from '../backend/schema';

export {
  DifficultyLevel as DifficultyLevelEnum,
  CourseStatus as CourseStatusEnum,
  SortBy as SortByEnum
} from '../backend/schema';