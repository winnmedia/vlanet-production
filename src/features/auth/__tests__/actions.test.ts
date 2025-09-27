/**
 * 인증 Server Actions 테스트
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { checkEmailExists } from '../actions';

// Supabase 모킹
jest.mock('../../../shared/api/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEmailExists', () => {
    it('존재하지 않는 이메일의 경우 false를 반환해야 함', async () => {
      const mockSupabase = require('../../../shared/api/supabase/server').createServerClient();
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      });

      const result = await checkEmailExists('test@example.com');

      expect(result).toEqual({
        exists: false,
        error: null
      });
    });

    it('존재하는 이메일의 경우 true를 반환해야 함', async () => {
      const mockSupabase = require('../../../shared/api/supabase/server').createServerClient();
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'user-123' },
        error: null
      });

      const result = await checkEmailExists('existing@example.com');

      expect(result).toEqual({
        exists: true,
        error: null
      });
    });

    it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
      const mockSupabase = require('../../../shared/api/supabase/server').createServerClient();
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await checkEmailExists('test@example.com');

      expect(result).toEqual({
        exists: false,
        error: 'Database connection failed'
      });
    });

    it('올바르지 않은 이메일 형식의 경우 에러를 반환해야 함', async () => {
      const result = await checkEmailExists('invalid-email');

      expect(result).toEqual({
        exists: false,
        error: '올바른 이메일 형식을 입력해주세요'
      });
    });

    it('빈 이메일의 경우 에러를 반환해야 함', async () => {
      const result = await checkEmailExists('');

      expect(result).toEqual({
        exists: false,
        error: '이메일을 입력해주세요'
      });
    });
  });
});