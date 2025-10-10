import { AppError } from '@/backend/http/error';

export const AssignmentErrors = {
  ASSIGNMENT_NOT_FOUND: new AppError(
    'ASSIGNMENT_NOT_FOUND',
    '과제를 찾을 수 없습니다',
    404
  ),

  ASSIGNMENT_NOT_PUBLISHED: new AppError(
    'ASSIGNMENT_NOT_PUBLISHED',
    '공개되지 않은 과제입니다',
    404
  ),

  NOT_ENROLLED_IN_COURSE: new AppError(
    'NOT_ENROLLED_IN_COURSE',
    '수강 등록이 필요합니다',
    403
  ),

  ASSIGNMENT_ACCESS_DENIED: new AppError(
    'ASSIGNMENT_ACCESS_DENIED',
    '과제 접근 권한이 없습니다',
    403
  ),

  ASSIGNMENT_FETCH_FAILED: new AppError(
    'ASSIGNMENT_FETCH_FAILED',
    '과제 정보를 불러오는데 실패했습니다',
    500
  ),

  ASSIGNMENT_CREATE_FAILED: new AppError(
    'ASSIGNMENT_CREATE_FAILED',
    '과제 생성에 실패했습니다',
    500
  ),

  ASSIGNMENT_UPDATE_FAILED: new AppError(
    'ASSIGNMENT_UPDATE_FAILED',
    '과제 수정에 실패했습니다',
    500
  ),

  ASSIGNMENT_DELETE_FAILED: new AppError(
    'ASSIGNMENT_DELETE_FAILED',
    '과제 삭제에 실패했습니다',
    500
  ),

  ASSIGNMENT_STATUS_CHANGE_FAILED: new AppError(
    'ASSIGNMENT_STATUS_CHANGE_FAILED',
    '과제 상태 변경에 실패했습니다',
    500
  ),

  INVALID_DUE_DATE: new AppError(
    'INVALID_DUE_DATE',
    '마감일은 현재 시간 이후여야 합니다',
    400
  ),

  CANNOT_MODIFY_PUBLISHED: new AppError(
    'CANNOT_MODIFY_PUBLISHED',
    '게시된 과제는 수정할 수 없습니다',
    400
  ),

  CANNOT_DELETE_WITH_SUBMISSIONS: new AppError(
    'CANNOT_DELETE_WITH_SUBMISSIONS',
    '제출물이 있는 과제는 삭제할 수 없습니다',
    400
  ),

  INVALID_STATUS_TRANSITION: new AppError(
    'INVALID_STATUS_TRANSITION',
    '잘못된 상태 전환입니다',
    400
  ),

  COURSE_NOT_OWNED: new AppError(
    'COURSE_NOT_OWNED',
    '본인의 코스가 아닙니다',
    403
  ),
};