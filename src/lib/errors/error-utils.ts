import { ErrorCode } from '@/backend/middleware/error';

export const getErrorMessage = (code: ErrorCode): string => {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다',
    [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다',
    [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다',
    [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다',
    [ErrorCode.CONFLICT]: '요청이 충돌했습니다',
    [ErrorCode.VALIDATION_ERROR]: '입력값을 확인해주세요',
    [ErrorCode.RATE_LIMIT]: '요청 한도를 초과했습니다',
    [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다',
    [ErrorCode.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다',
    [ErrorCode.GATEWAY_TIMEOUT]: '요청 시간이 초과되었습니다',
  };

  return messages[code] || '알 수 없는 오류가 발생했습니다';
};

export const isRetryableError = (code: ErrorCode): boolean => {
  const retryableCodes = [
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.GATEWAY_TIMEOUT,
    ErrorCode.RATE_LIMIT,
  ];

  return retryableCodes.includes(code);
};

// 에러 복구 헬퍼
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (
        !isRetryableError(error?.error?.code) ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      // 지수 백오프: delay * 2^(attempt - 1)
      await new Promise(resolve =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }

  throw lastError;
};

// 에러 타입 가드
export const isApiError = (error: any): error is {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    errorId?: string;
  };
} => {
  return (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof error.error === 'object' &&
    'code' in error.error &&
    'message' in error.error
  );
};

// HTTP 상태 코드를 ErrorCode로 매핑
export const httpStatusToErrorCode = (status: number): ErrorCode => {
  const statusMap: Record<number, ErrorCode> = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.CONFLICT,
    422: ErrorCode.VALIDATION_ERROR,
    429: ErrorCode.RATE_LIMIT,
    500: ErrorCode.INTERNAL_SERVER_ERROR,
    503: ErrorCode.SERVICE_UNAVAILABLE,
    504: ErrorCode.GATEWAY_TIMEOUT,
  };

  return statusMap[status] || ErrorCode.INTERNAL_SERVER_ERROR;
};

// 사용자 친화적인 에러 메시지 생성
export const formatErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.error.message || getErrorMessage(error.error.code);
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '알 수 없는 오류가 발생했습니다';
};

// 에러 로깅 헬퍼
export const logError = (
  error: any,
  context?: Record<string, any>
): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: isApiError(error) ? error.error : error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // 프로덕션에서는 에러 리포팅 서비스로 전송
  // TODO: Sentry, LogRocket 등 에러 리포팅 서비스 연동
};