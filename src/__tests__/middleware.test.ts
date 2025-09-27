/**
 * 미들웨어 테스트
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

// Supabase 미들웨어 클라이언트 모킹
jest.mock('../shared/api/supabase/middleware', () => ({
  createMiddlewareClient: jest.fn()
}));

describe('Middleware', () => {
  let mockRequest: NextRequest;
  let mockSupabase: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 기본 응답 모킹
    mockResponse = {
      redirect: jest.fn()
    };

    // Supabase 클라이언트 모킹
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    };

    const { createMiddlewareClient } = require('../shared/api/supabase/middleware');
    createMiddlewareClient.mockReturnValue({
      supabase: mockSupabase,
      response: mockResponse
    });

    // 콘솔 로그 모킹
    console.log = jest.fn();
  });

  describe('Public Routes', () => {
    it('홈페이지는 인증 없이 접근 가능해야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: 'Not authenticated'
      });

      const result = await middleware(mockRequest);

      expect(result).toBe(mockResponse);
    });

    it('로그인 페이지는 인증 없이 접근 가능해야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/login');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: 'Not authenticated'
      });

      const result = await middleware(mockRequest);

      expect(result).toBe(mockResponse);
    });
  });

  describe('Protected Routes', () => {
    it('대시보드는 인증된 사용자만 접근 가능해야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/dashboard');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: 'Not authenticated'
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/login?redirect=%2Fdashboard', 'http://localhost:3001/')
      );
    });

    it('업로드 페이지는 인증된 사용자만 접근 가능해야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/upload');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: 'Not authenticated'
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/login?redirect=%2Fupload', 'http://localhost:3001/')
      );
    });
  });

  describe('Authenticated User Redirects', () => {
    it('인증된 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/login');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/dashboard', 'http://localhost:3001/')
      );
    });

    it('인증된 사용자가 회원가입 페이지에 접근하면 대시보드로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/signup');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/dashboard', 'http://localhost:3001/')
      );
    });
  });

  describe('Onboarding Flow', () => {
    it('프로필이 없는 인증된 사용자는 온보딩으로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/dashboard');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/onboarding', 'http://localhost:3001/')
      );
    });

    it('온보딩이 완료되지 않은 사용자는 온보딩으로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/dashboard');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          username: 'testuser',
          role: 'CREATOR',
          onboarding_completed: false
        },
        error: null
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/onboarding', 'http://localhost:3001/')
      );
    });

    it('온보딩이 완료된 사용자가 온보딩 페이지에 접근하면 대시보드로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/onboarding');
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          username: 'testuser',
          role: 'CREATOR',
          onboarding_completed: true
        },
        error: null
      });

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/dashboard', 'http://localhost:3001/')
      );
    });
  });

  describe('Static Files and API Routes', () => {
    it('정적 파일은 미들웨어를 건너뛰어야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/_next/static/css/app.css');

      const result = await middleware(mockRequest);

      expect(result).toBeUndefined();
    });

    it('API 라우트는 미들웨어를 건너뛰어야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/api/auth/callback');

      const result = await middleware(mockRequest);

      expect(result).toBeUndefined();
    });

    it('favicon은 미들웨어를 건너뛰어야 함', async () => {
      mockRequest = new NextRequest('http://localhost:3001/favicon.ico');

      const result = await middleware(mockRequest);

      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('미들웨어 오류 시 보호된 라우트는 로그인으로 리다이렉트', async () => {
      mockRequest = new NextRequest('http://localhost:3001/dashboard');
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await middleware(mockRequest);

      expect(Response.redirect).toHaveBeenCalledWith(
        new URL('/login?error=middleware_error', 'http://localhost:3001/')
      );
    });

    it('미들웨어 오류 시 공개 라우트는 정상 진행', async () => {
      mockRequest = new NextRequest('http://localhost:3001/');
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await middleware(mockRequest);

      expect(result).toBe(mockResponse);
    });
  });
});