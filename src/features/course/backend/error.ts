import { AppError } from '@/backend/http/error';

export const CourseErrors = {
  COURSE_NOT_FOUND: new AppError(
    'COURSE_NOT_FOUND',
    '코스를 찾을 수 없습니다',
    404
  ),

  COURSE_NOT_PUBLISHED: new AppError(
    'COURSE_NOT_PUBLISHED',
    '공개되지 않은 코스입니다',
    403
  ),

  INVALID_FILTER_PARAMS: new AppError(
    'INVALID_FILTER_PARAMS',
    '잘못된 필터 파라미터입니다',
    400
  ),

  COURSE_LIST_FETCH_FAILED: new AppError(
    'COURSE_LIST_FETCH_FAILED',
    '코스 목록을 불러오는데 실패했습니다',
    500
  ),

  UNAUTHORIZED_ACCESS: new AppError(
    'UNAUTHORIZED_ACCESS',
    '접근 권한이 없습니다',
    403
  ),

  COURSE_CREATE_FAILED: new AppError(
    'COURSE_CREATE_FAILED',
    '코스 생성에 실패했습니다',
    500
  ),

  COURSE_UPDATE_FAILED: new AppError(
    'COURSE_UPDATE_FAILED',
    '코스 업데이트에 실패했습니다',
    500
  ),

  COURSE_PUBLISH_FAILED: new AppError(
    'COURSE_PUBLISH_FAILED',
    '코스 게시에 실패했습니다',
    500
  ),

  COURSE_ARCHIVE_FAILED: new AppError(
    'COURSE_ARCHIVE_FAILED',
    '코스 아카이브에 실패했습니다',
    500
  )
};