import { z } from 'zod';

// 사용자 역할 enum
export const UserRole = z.enum(['learner', 'instructor']);
export type UserRole = z.infer<typeof UserRole>;

// 프로필 완성 요청 스키마
export const CompleteProfileRequestSchema = z.object({
  role: UserRole,
  name: z.string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(100, '이름은 100자 이하여야 합니다'),
  phone: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)'),
  termsAgreed: z.boolean().refine(val => val === true, {
    message: '이용약관에 동의해야 합니다'
  })
});

export type CompleteProfileRequest = z.infer<typeof CompleteProfileRequestSchema>;

// 프로필 응답 스키마
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: UserRole,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

// 프로필 상태 스키마
export const ProfileStatusSchema = z.object({
  isComplete: z.boolean(),
  hasProfile: z.boolean(),
  profile: ProfileResponseSchema.nullable(),
  missingFields: z.array(z.string())
});

export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;

// 약관 동의 스키마
export const TermsAgreementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  agreedAt: z.string().datetime(),
  version: z.string()
});

export type TermsAgreement = z.infer<typeof TermsAgreementSchema>;