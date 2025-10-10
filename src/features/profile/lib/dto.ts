// 백엔드 스키마 재노출 (프론트엔드에서 사용)
export type {
  UserRole,
  CompleteProfileRequest,
  ProfileResponse,
  ProfileStatus,
  TermsAgreement
} from '../backend/schema';

export { UserRole as UserRoleEnum } from '../backend/schema';