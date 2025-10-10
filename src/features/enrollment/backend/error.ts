import { AppError } from '@/backend/http/error';

export const EnrollmentErrors = {
  ALREADY_ENROLLED: new AppError(
    'ALREADY_ENROLLED',
    '이미 수강 중인 코스입니다',
    409
  ),

  ENROLLMENT_NOT_FOUND: new AppError(
    'ENROLLMENT_NOT_FOUND',
    '수강 정보를 찾을 수 없습니다',
    404
  ),

  COURSE_NOT_AVAILABLE: new AppError(
    'COURSE_NOT_AVAILABLE',
    '수강신청이 불가능한 코스입니다',
    422
  ),

  UNAUTHORIZED_ENROLLMENT: new AppError(
    'UNAUTHORIZED_ENROLLMENT',
    '학습자만 수강신청이 가능합니다',
    403
  ),

  ENROLLMENT_FAILED: new AppError(
    'ENROLLMENT_FAILED',
    '수강신청에 실패했습니다',
    500
  ),

  UNENROLLMENT_FAILED: new AppError(
    'UNENROLLMENT_FAILED',
    '수강취소에 실패했습니다',
    500
  )
};