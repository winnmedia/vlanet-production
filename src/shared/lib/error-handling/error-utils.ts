import * as Sentry from '@sentry/nextjs';

/**
 * 에러 타입 정의
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  isOperational?: boolean;
}

/**
 * 에러 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UI = 'ui',
  EXTERNAL_API = 'external_api',
}

/**
 * 커스텀 에러 클래스들
 */
export class ValidationError extends Error implements AppError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly statusCode = 400;
  public readonly isOperational = true;

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error implements AppError {
  public readonly code = 'NETWORK_ERROR';
  public readonly statusCode = 500;
  public readonly isOperational = true;

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class BusinessLogicError extends Error implements AppError {
  public readonly code = 'BUSINESS_LOGIC_ERROR';
  public readonly statusCode = 400;
  public readonly isOperational = true;

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  public readonly code = 'UNAUTHORIZED';
  public readonly statusCode = 401;
  public readonly isOperational = true;

  constructor(message: string = '인증이 필요합니다', public context?: Record<string, any>) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  public readonly code = 'FORBIDDEN';
  public readonly statusCode = 403;
  public readonly isOperational = true;

  constructor(message: string = '권한이 없습니다', public context?: Record<string, any>) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * 에러 심각도 결정
 */
export function getErrorSeverity(error: Error | AppError): ErrorSeverity {
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
    return ErrorSeverity.HIGH;
  }

  if (error instanceof NetworkError) {
    return ErrorSeverity.MEDIUM;
  }

  if (error instanceof ValidationError || error instanceof BusinessLogicError) {
    return ErrorSeverity.LOW;
  }

  // Unknown errors are treated as critical
  return ErrorSeverity.CRITICAL;
}

/**
 * 에러 카테고리 결정
 */
export function getErrorCategory(error: Error | AppError): ErrorCategory {
  if (error instanceof ValidationError) {
    return ErrorCategory.VALIDATION;
  }

  if (error instanceof UnauthorizedError) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (error instanceof ForbiddenError) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (error instanceof NetworkError) {
    return ErrorCategory.NETWORK;
  }

  if (error instanceof BusinessLogicError) {
    return ErrorCategory.BUSINESS_LOGIC;
  }

  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return ErrorCategory.NETWORK;
  }

  return ErrorCategory.SYSTEM;
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof ValidationError) {
    return error.message || '입력 데이터를 확인해주세요.';
  }

  if (error instanceof NetworkError) {
    return '네트워크 연결을 확인해주세요.';
  }

  if (error instanceof UnauthorizedError) {
    return '로그인이 필요합니다.';
  }

  if (error instanceof ForbiddenError) {
    return '이 작업을 수행할 권한이 없습니다.';
  }

  if (error instanceof BusinessLogicError) {
    return error.message || '처리 중 문제가 발생했습니다.';
  }

  // 기본 메시지
  return '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * Sentry에 에러 보고
 */
export function reportError(
  error: Error | AppError,
  context?: Record<string, any>,
  user?: { id?: string; username?: string; email?: string }
) {
  const severity = getErrorSeverity(error);
  const category = getErrorCategory(error);

  Sentry.withScope((scope) => {
    // 사용자 정보 설정 (민감한 정보 제외)
    if (user) {
      scope.setUser({
        id: user.id,
        username: user.username,
        // 이메일은 보안을 위해 제외
      });
    }

    // 태그 설정
    scope.setTag('severity', severity);
    scope.setTag('category', category);
    scope.setTag('errorCode', (error as AppError).code || 'UNKNOWN');

    // 컨텍스트 설정
    if (context) {
      scope.setContext('errorContext', context);
    }

    if ((error as AppError).context) {
      scope.setContext('appErrorContext', (error as AppError).context);
    }

    // 레벨 설정
    const sentryLevel = severity === ErrorSeverity.CRITICAL ? 'fatal' :
                       severity === ErrorSeverity.HIGH ? 'error' :
                       severity === ErrorSeverity.MEDIUM ? 'warning' : 'info';

    scope.setLevel(sentryLevel);

    // 에러 캡처
    Sentry.captureException(error);
  });

  // 개발 환경에서는 콘솔에도 출력
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${category}] ${severity}:`, error, context);
  }
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: Error | AppError): boolean {
  // Network 에러는 재시도 가능
  if (error instanceof NetworkError) {
    return true;
  }

  // 5xx 서버 에러는 재시도 가능
  if ((error as AppError).statusCode && (error as AppError).statusCode! >= 500) {
    return true;
  }

  // Timeout 에러는 재시도 가능
  if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
    return true;
  }

  return false;
}

/**
 * 에러 로깅 (개발/디버그용)
 */
export function logError(
  error: Error | AppError,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    const severity = getErrorSeverity(error);
    const category = getErrorCategory(error);

    console.group(`🚨 Error [${category}] - ${severity}`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    if (context) {
      console.error('Context:', context);
    }
    if ((error as AppError).context) {
      console.error('App Context:', (error as AppError).context);
    }
    console.groupEnd();
  }
}

/**
 * 안전한 에러 처리 wrapper
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  fallback?: T,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));

    // 에러 보고
    reportError(appError);

    // 커스텀 에러 핸들러 호출
    onError?.(appError);

    // Fallback 값 반환 또는 null
    return fallback ?? null;
  }
}