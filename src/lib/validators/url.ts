import { z } from 'zod';

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export const urlValidator = z
  .string()
  .optional()
  .refine(
    (val) => !val || isValidUrl(val),
    { message: '올바른 URL 형식을 입력해주세요' }
  );

export function normalizeUrl(url: string): string {
  if (!url) return '';

  // http/https가 없으면 추가
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}