import { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { AppError } from './error';

/**
 * 표준 응답 형식
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * 성공 응답 헬퍼
 */
export function success<T>(
  c: Context<AppEnv>,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };

  return c.json(response, statusCode as any);
}

/**
 * 실패 응답 헬퍼
 */
export function failure(
  c: Context<AppEnv>,
  error: AppError | Error | unknown,
  statusCode?: number
): Response {
  const logger = c.get('logger');

  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    logger?.error('Unhandled error:', error);
    appError = new AppError(
      'INTERNAL_ERROR',
      error.message || '서버 오류가 발생했습니다',
      500
    );
  } else {
    logger?.error('Unknown error:', error);
    appError = new AppError(
      'UNKNOWN_ERROR',
      '알 수 없는 오류가 발생했습니다',
      500
    );
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  return c.json(response, (statusCode || appError.statusCode) as any);
}

/**
 * 범용 응답 헬퍼
 */
export function respond<T>(
  c: Context<AppEnv>,
  result: { data?: T; error?: AppError | Error }
): Response {
  if (result.error) {
    return failure(c, result.error);
  }
  return success(c, result.data);
}
