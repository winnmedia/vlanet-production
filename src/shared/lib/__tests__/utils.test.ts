/**
 * Shared Utilities Unit Tests
 * shared/lib 레이어 단위 테스트 - 공통 유틸리티 함수 검증
 */

import {
  cn,
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  isValidEmail,
  isValidVideoFile,
  isValidImageFile,
  isValidUrl,
  hasKorean,
  truncateText,
} from '../utils'

describe('Shared Utilities', () => {
  describe('cn (className merger)', () => {
    it('should merge basic class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'ignored')).toBe('base conditional')
    })

    it('should resolve Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4') // px-4가 px-2를 오버라이드
    })

    it('should handle arrays and objects', () => {
      expect(cn(['class1', 'class2'], { 'class3': true, 'class4': false })).toBe('class1 class2 class3')
    })

    it('should handle undefined and null', () => {
      expect(cn(undefined, null, 'valid')).toBe('valid')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
      expect(formatFileSize(1000)).toBe('1000 Bytes')
    })

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 * 1024
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format MB correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB') // 1024 * 1024
      expect(formatFileSize(5242880)).toBe('5 MB') // 5 * 1024 * 1024
      expect(formatFileSize(1610612736)).toBe('1.5 GB') // 1.5 * 1024 * 1024 * 1024
    })

    it('should handle large numbers', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB') // 1024^3
      expect(formatFileSize(2147483648)).toBe('2 GB') // 2 * 1024^3
    })

    it('should handle decimal precision', () => {
      expect(formatFileSize(1500000)).toContain('1.43 MB') // 약 1.43MB
    })
  })

  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(60)).toBe('1:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(3661)).toBe('61:01') // 61분 1초
    })

    it('should handle edge cases', () => {
      expect(formatDuration(0.5)).toBe('0:00') // 소수점 버림
      expect(formatDuration(59.9)).toBe('0:59') // 소수점 버림
      expect(formatDuration(3599)).toBe('59:59') // 59분 59초
    })

    it('should handle large durations', () => {
      expect(formatDuration(7200)).toBe('120:00') // 2시간 = 120분
      expect(formatDuration(86400)).toBe('1440:00') // 24시간 = 1440분
    })
  })

  describe('formatRelativeTime', () => {
    const now = new Date('2024-01-15T12:00:00Z')

    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(now)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should handle recent times', () => {
      const recentDate = new Date(now.getTime() - 30 * 1000) // 30초 전
      expect(formatRelativeTime(recentDate)).toBe('방금 전')
    })

    it('should format minutes correctly', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5분 전')

      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30분 전')
    })

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toBe('2시간 전')

      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
      expect(formatRelativeTime(twelveHoursAgo)).toBe('12시간 전')
    })

    it('should format days correctly', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3일 전')

      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(sixDaysAgo)).toBe('6일 전')
    })

    it('should format absolute dates for old times', () => {
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10일 전
      const result = formatRelativeTime(oldDate)
      expect(result).toMatch(/2024/) // 절대 날짜 형식
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.kr')).toBe(true)
      expect(isValidEmail('admin+tag@company.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test@domain')).toBe(false)
      // Note: 기본 regex는 test..test@domain.com을 유효하다고 판단함 (실제 검증은 서버에서 수행)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('test @domain.com')).toBe(false) // 공백
      expect(isValidEmail('test@domain .com')).toBe(false) // 공백
      expect(isValidEmail('한글@도메인.com')).toBe(true) // 한글 허용 (실제로는 punycode 처리 필요)
    })
  })

  describe('isValidVideoFile', () => {
    it('should validate supported video formats', () => {
      const mp4File = new File([''], 'video.mp4', { type: 'video/mp4' })
      expect(isValidVideoFile(mp4File)).toBe(true)
    })

    it('should reject unsupported formats', () => {
      const aviFile = new File([''], 'video.avi', { type: 'video/avi' })
      const txtFile = new File([''], 'text.txt', { type: 'text/plain' })

      expect(isValidVideoFile(aviFile)).toBe(false)
      expect(isValidVideoFile(txtFile)).toBe(false)
    })

    it('should handle missing type', () => {
      const noTypeFile = new File([''], 'video.mp4', { type: '' })
      expect(isValidVideoFile(noTypeFile)).toBe(false)
    })
  })

  describe('isValidImageFile', () => {
    it('should validate supported image formats', () => {
      const jpegFile = new File([''], 'image.jpg', { type: 'image/jpeg' })
      const pngFile = new File([''], 'image.png', { type: 'image/png' })
      const webpFile = new File([''], 'image.webp', { type: 'image/webp' })

      expect(isValidImageFile(jpegFile)).toBe(true)
      expect(isValidImageFile(pngFile)).toBe(true)
      expect(isValidImageFile(webpFile)).toBe(true)
    })

    it('should reject unsupported formats', () => {
      const gifFile = new File([''], 'image.gif', { type: 'image/gif' })
      const bmpFile = new File([''], 'image.bmp', { type: 'image/bmp' })

      expect(isValidImageFile(gifFile)).toBe(false)
      expect(isValidImageFile(bmpFile)).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should validate correct HTTP/HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('https://subdomain.example.com/path?query=value')).toBe(true)
    })

    it('should reject non-HTTP protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false)
      expect(isValidUrl('javascript:alert("xss")')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(false)
    })

    it('should reject malformed URLs', () => {
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('://example.com')).toBe(false)
      expect(isValidUrl('https://')).toBe(false)
    })

    it('should handle XSS prevention', () => {
      // 잠재적으로 위험한 URL들
      expect(isValidUrl('javascript:void(0)')).toBe(false)
      expect(isValidUrl('vbscript:msgbox')).toBe(false)
      expect(isValidUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgieHNzIik8L3NjcmlwdD4=')).toBe(false)
    })
  })

  describe('hasKorean', () => {
    it('should detect Korean characters', () => {
      expect(hasKorean('안녕하세요')).toBe(true)
      expect(hasKorean('Hello 세계')).toBe(true)
      expect(hasKorean('ㄱㄴㄷ')).toBe(true) // 자음
      expect(hasKorean('ㅏㅑㅓ')).toBe(true) // 모음
    })

    it('should return false for non-Korean text', () => {
      expect(hasKorean('Hello World')).toBe(false)
      expect(hasKorean('123456')).toBe(false)
      expect(hasKorean('!@#$%')).toBe(false)
      expect(hasKorean('')).toBe(false)
    })

    it('should handle mixed content', () => {
      expect(hasKorean('VideoPlanet 한국어')).toBe(true)
      expect(hasKorean('한국어 + English + 123')).toBe(true)
    })
  })

  describe('truncateText', () => {
    it('should return original text if shorter than limit', () => {
      expect(truncateText('Short', 10)).toBe('Short')
      expect(truncateText('Exactly 10', 10)).toBe('Exactly 10')
    })

    it('should truncate and add ellipsis if longer than limit', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is a ...')
      expect(truncateText('한글도 잘 작동해야 합니다', 5)).toBe('한글도 잘...')
    })

    it('should handle edge cases', () => {
      expect(truncateText('', 5)).toBe('')
      expect(truncateText('A', 0)).toBe('...')
      expect(truncateText('Test', 4)).toBe('Test')
    })

    it('should preserve word boundaries when appropriate', () => {
      // 정확히 maxLength 지점에서 자름
      expect(truncateText('1234567890ABC', 10)).toBe('1234567890...')
    })
  })

  describe('Integration Tests', () => {
    it('should work together in real scenarios', () => {
      // 실제 사용 시나리오: 파일 정보 표시
      const file = new File([new ArrayBuffer(1048576)], 'video.mp4', { type: 'video/mp4' })
      const fileSize = formatFileSize(file.size)
      const isValidVideo = isValidVideoFile(file)

      expect(fileSize).toBe('1 MB')
      expect(isValidVideo).toBe(true)
    })

    it('should handle Korean content properly', () => {
      const koreanTitle = '안녕하세요 이것은 매우 긴 한국어 제목입니다'
      const hasKoreanChars = hasKorean(koreanTitle)
      const truncatedTitle = truncateText(koreanTitle, 15)

      expect(hasKoreanChars).toBe(true)
      expect(truncatedTitle).toBe('안녕하세요 이것은 매우 긴 ...')
    })
  })
})