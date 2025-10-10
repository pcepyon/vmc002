/**
 * 애플리케이션 에러 클래스
 * 비즈니스 로직 에러를 표준화된 형태로 관리
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

/**
 * 공통 에러 정의
 */
export const CommonErrors = {
  INTERNAL_SERVER_ERROR: new AppError(
    'INTERNAL_SERVER_ERROR',
    '서버 내부 오류가 발생했습니다',
    500
  ),

  BAD_REQUEST: new AppError(
    'BAD_REQUEST',
    '잘못된 요청입니다',
    400
  ),

  UNAUTHORIZED: new AppError(
    'UNAUTHORIZED',
    '인증이 필요합니다',
    401
  ),

  FORBIDDEN: new AppError(
    'FORBIDDEN',
    '접근 권한이 없습니다',
    403
  ),

  NOT_FOUND: new AppError(
    'NOT_FOUND',
    '요청한 리소스를 찾을 수 없습니다',
    404
  ),

  VALIDATION_ERROR: new AppError(
    'VALIDATION_ERROR',
    '입력값 검증에 실패했습니다',
    422
  ),

  CONFLICT: new AppError(
    'CONFLICT',
    '리소스 충돌이 발생했습니다',
    409
  )
};