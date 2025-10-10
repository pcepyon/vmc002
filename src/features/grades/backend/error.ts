import { AppError } from '@/backend/http/error';

export const GradesErrors = {
  GRADES_ACCESS_DENIED: new AppError(
    'GRADES_ACCESS_DENIED',
    '본인의 성적만 조회할 수 있습니다',
    403
  ),

  FEEDBACK_NOT_FOUND: new AppError(
    'FEEDBACK_NOT_FOUND',
    '피드백을 찾을 수 없습니다',
    404
  ),

  NOT_ENROLLED: new AppError(
    'NOT_ENROLLED',
    '수강 중인 코스가 아닙니다',
    403
  ),

  SUBMISSION_NOT_FOUND: new AppError(
    'SUBMISSION_NOT_FOUND',
    '제출물을 찾을 수 없습니다',
    404
  ),

  GRADES_FETCH_FAILED: new AppError(
    'GRADES_FETCH_FAILED',
    '성적 정보를 불러오는데 실패했습니다',
    500
  ),

  INVALID_SUBMISSION_ACCESS: new AppError(
    'INVALID_SUBMISSION_ACCESS',
    '다른 학습자의 제출물에 접근할 수 없습니다',
    403
  ),
};