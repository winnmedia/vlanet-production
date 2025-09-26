/**
 * Error Handling Module
 * 에러 처리 관련 모든 기능을 제공하는 공용 모듈
 */

export { ErrorBoundary } from './ErrorBoundary';
export { AsyncErrorBoundary } from './AsyncErrorBoundary';
export {
  type AppError,
  ErrorSeverity,
  ErrorCategory,
  ValidationError,
  NetworkError,
  BusinessLogicError,
  UnauthorizedError,
  ForbiddenError,
  getErrorSeverity,
  getErrorCategory,
  getUserFriendlyMessage,
  reportError,
  isRetryableError,
  logError,
  safeExecute,
} from './error-utils';