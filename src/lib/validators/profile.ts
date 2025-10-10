import { z } from 'zod';

/**
 * 전화번호 검증 (한국 휴대폰 번호)
 */
export const phoneNumberValidator = z.string()
  .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (010-xxxx-xxxx)');

/**
 * 이름 검증
 */
export const nameValidator = z.string()
  .min(2, '이름은 2자 이상이어야 합니다')
  .max(50, '이름은 50자 이하여야 합니다');

/**
 * 전화번호 포맷팅 함수
 * 01012345678 -> 010-1234-5678
 */
export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '');

  if (numbers.length < 11) return value;

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 전화번호 유효성 확인
 */
export function isValidPhoneNumber(value: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(value);
}