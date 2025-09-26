/**
 * XSS 방어 및 입력 검증 유틸리티
 * 사용자 입력 데이터의 보안 처리를 담당합니다
 */

import { z } from 'zod';

// 위험한 HTML 태그 패턴
const DANGEROUS_HTML_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gis,
  /<iframe[^>]*>.*?<\/iframe>/gis,
  /<object[^>]*>.*?<\/object>/gis,
  /<embed[^>]*>.*?<\/embed>/gis,
  /<link[^>]*>/gis,
  /<meta[^>]*>/gis,
  /<style[^>]*>.*?<\/style>/gis,
  /javascript:/gis,
  /data:text\/html/gis,
  /vbscript:/gis,
  /on\w+\s*=/gis, // onclick, onload 등 이벤트 핸들러
];

// 위험한 프로토콜 패턴
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/',
  'file:',
];

// SQL Injection 패턴
const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\;)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute))/gi,
  /(script|iframe|object|embed|link|meta|style)/gi,
];

/**
 * 기본 HTML 새니타이제이션
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 위험한 HTML 패턴 제거
  DANGEROUS_HTML_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  // HTML 엔티티 인코딩
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * URL 새니타이제이션 및 검증
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const cleanInput = input.trim().toLowerCase();

  // 위험한 프로토콜 체크
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (cleanInput.startsWith(protocol)) {
      return '';
    }
  }

  // 허용된 프로토콜만 통과
  if (
    !cleanInput.startsWith('http://') &&
    !cleanInput.startsWith('https://') &&
    !cleanInput.startsWith('mailto:') &&
    !cleanInput.startsWith('/') &&
    !cleanInput.startsWith('#')
  ) {
    return '';
  }

  return input.trim();
}

/**
 * 파일명 새니타이제이션
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  return filename
    .replace(/[^\w\s.-]/g, '') // 안전한 문자만 허용
    .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    .replace(/\.+/g, '.') // 연속된 점 제거
    .substring(0, 255); // 길이 제한
}

/**
 * SQL Injection 방어를 위한 기본 검증
 */
export function validateForSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * 사용자 이름 검증 및 새니타이제이션
 */
export const userNameSchema = z
  .string()
  .min(2, '사용자 이름은 최소 2자 이상이어야 합니다')
  .max(50, '사용자 이름은 50자를 초과할 수 없습니다')
  .regex(
    /^[a-zA-Z0-9가-힣\s._-]+$/,
    '사용자 이름에는 특수문자를 사용할 수 없습니다'
  )
  .transform(sanitizeHtml);

/**
 * 이메일 검증
 */
export const emailSchema = z
  .string()
  .email('올바른 이메일 형식이 아닙니다')
  .max(254, '이메일은 254자를 초과할 수 없습니다')
  .transform((email) => email.toLowerCase().trim());

/**
 * 비디오 제목 검증
 */
export const videoTitleSchema = z
  .string()
  .min(1, '제목을 입력해주세요')
  .max(200, '제목은 200자를 초과할 수 없습니다')
  .transform(sanitizeHtml);

/**
 * 비디오 설명 검증
 */
export const videoDescriptionSchema = z
  .string()
  .max(5000, '설명은 5000자를 초과할 수 없습니다')
  .transform(sanitizeHtml)
  .optional();

/**
 * 댓글 내용 검증
 */
export const commentContentSchema = z
  .string()
  .min(1, '댓글을 입력해주세요')
  .max(1000, '댓글은 1000자를 초과할 수 없습니다')
  .transform(sanitizeHtml);

/**
 * URL 검증
 */
export const urlSchema = z
  .string()
  .url('올바른 URL 형식이 아닙니다')
  .transform(sanitizeUrl)
  .refine(
    (url) => url !== '',
    '안전하지 않은 URL입니다'
  );

/**
 * 파일 업로드 검증
 */
export function validateFileUpload(file: File) {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const maxSize = 500 * 1024 * 1024; // 500MB

  // MIME 타입 검증
  if (!allowedTypes.includes(file.type)) {
    throw new Error('지원하지 않는 파일 형식입니다');
  }

  // 파일 크기 검증
  if (file.size > maxSize) {
    throw new Error('파일 크기가 너무 큽니다');
  }

  // 파일명 검증
  const sanitizedName = sanitizeFilename(file.name);
  if (!sanitizedName || sanitizedName === 'untitled') {
    throw new Error('유효하지 않은 파일명입니다');
  }

  return {
    isValid: true,
    sanitizedName,
  };
}

/**
 * CSP 위반 로깅
 */
export function logCspViolation(report: any) {
  // 프로덕션에서만 로깅
  if (process.env.NODE_ENV === 'production') {
    console.warn('CSP 위반 감지:', {
      documentUri: report['document-uri'],
      blockedUri: report['blocked-uri'],
      violatedDirective: report['violated-directive'],
      timestamp: new Date().toISOString(),
    });

    // 실제 프로덕션에서는 모니터링 서비스로 전송
    // 예: Sentry, DataDog 등
  }
}

/**
 * 입력값 안전성 종합 검증
 */
export function sanitizeUserInput<T extends string>(
  input: T,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    checkSqlInjection?: boolean;
  } = {}
): string {
  const {
    allowHtml = false,
    maxLength = 1000,
    checkSqlInjection = true,
  } = options;

  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // 길이 제한
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // SQL Injection 검증
  if (checkSqlInjection && !validateForSqlInjection(sanitized)) {
    throw new Error('보안 위험이 감지된 입력입니다');
  }

  // HTML 새니타이제이션
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }

  return sanitized;
}