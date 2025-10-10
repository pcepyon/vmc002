import { createMiddleware } from 'hono/factory';
import { match, P } from 'ts-pattern';
import { z } from 'zod';
import {
  contextKeys,
  type AppEnv,
  type AppLogger,
} from '@/backend/hono/context';

// 에러 타입 정의
export enum ErrorCode {
  // Client errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
}

// AppError 클래스
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 에러 ID 생성
const generateErrorId = () => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const errorBoundary = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    try {
      await next();
    } catch (error) {
      const logger = c.get(contextKeys.logger) as AppLogger | undefined;
      const errorId = generateErrorId();

      // 에러 로깅 (개선)
      logger?.error?.({
        errorId,
        error,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
      });

      // 에러 타입별 처리
      const response = match(error)
        // AppError 처리
        .with(P.instanceOf(AppError), (err) =>
          c.json(
            {
              error: {
                code: err.code,
                message: err.message,
                details: err.details,
                errorId,
              },
            },
            err.statusCode as any
          )
        )
        // Zod 검증 에러 처리
        .with(P.instanceOf(z.ZodError), (err) =>
          c.json(
            {
              error: {
                code: ErrorCode.VALIDATION_ERROR,
                message: '입력값이 올바르지 않습니다',
                details: err.format(),
                errorId,
              },
            },
            400
          )
        )
        // 기본 Error 처리
        .with(P.instanceOf(Error), (err) =>
          c.json(
            {
              error: {
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                message: err.message,
                errorId,
              },
            },
            500
          )
        )
        // 알 수 없는 에러
        .otherwise(() =>
          c.json(
            {
              error: {
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                message: '알 수 없는 오류가 발생했습니다',
                errorId,
              },
            },
            500
          )
        );

      return response;
    }
  });

// Rate Limiting 미들웨어
const rateLimitMap = new Map<string, number[]>();

export const rateLimit = (limit: number = 100, window: number = 60000) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const windowStart = now - window;

    // 해당 IP의 요청 시간 기록
    const requests = rateLimitMap.get(ip) || [];
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= limit) {
      throw new AppError(
        ErrorCode.RATE_LIMIT,
        '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.',
        429
      );
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);

    // 오래된 엔트리 정리 (메모리 관리)
    if (rateLimitMap.size > 1000) {
      const oldestAllowed = now - window * 2;
      for (const [key, times] of rateLimitMap.entries()) {
        if (times[times.length - 1] < oldestAllowed) {
          rateLimitMap.delete(key);
        }
      }
    }

    await next();
  });
