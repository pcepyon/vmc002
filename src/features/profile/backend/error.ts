import { AppError } from '@/backend/http/error';

export const ProfileErrors = {
  PROFILE_ALREADY_EXISTS: new AppError(
    'PROFILE_ALREADY_EXISTS',
    '이미 프로필이 존재합니다',
    409
  ),

  INVALID_ROLE: new AppError(
    'INVALID_ROLE',
    '유효하지 않은 역할입니다',
    400
  ),

  PROFILE_UPDATE_FAILED: new AppError(
    'PROFILE_UPDATE_FAILED',
    '프로필 업데이트에 실패했습니다',
    500
  ),

  PROFILE_NOT_FOUND: new AppError(
    'PROFILE_NOT_FOUND',
    '프로필을 찾을 수 없습니다',
    404
  ),

  UNAUTHORIZED_ACCESS: new AppError(
    'UNAUTHORIZED_ACCESS',
    '인증되지 않은 접근입니다',
    401
  ),

  TERMS_AGREEMENT_FAILED: new AppError(
    'TERMS_AGREEMENT_FAILED',
    '약관 동의 저장에 실패했습니다',
    500
  )
};