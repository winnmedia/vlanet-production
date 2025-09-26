/**
 * VLANET 헬스 체크 API 엔드포인트
 * 배포 후 서비스 상태 확인 및 모니터링용
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // VLANET 애플리케이션 상태 체크
    const healthData = {
      status: 'healthy',
      service: 'VLANET',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      checks: {
        database: await checkDatabase(),
        memory: checkMemory(),
        disk: await checkDisk(),
      },
    };

    // 모든 체크가 성공했는지 확인
    const allHealthy = Object.values(healthData.checks).every(
      (check: any) => check.status === 'healthy'
    );

    return NextResponse.json(healthData, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * 데이터베이스 연결 상태 확인
 */
async function checkDatabase() {
  try {
    // Supabase 연결 상태 확인 (간단한 쿼리)
    if (typeof window === 'undefined') {
      // 서버 사이드에서만 실행
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: response.headers.get('x-response-time') || 'unknown',
        message: response.ok ? 'Database connection successful' : 'Database connection failed',
      };
    }

    return {
      status: 'healthy',
      message: 'Database check skipped (client-side)',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database check failed',
    };
  }
}

/**
 * 메모리 사용량 확인
 */
function checkMemory() {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryUsagePercent = Math.round((usedMemoryMB / totalMemoryMB) * 100);

    // 메모리 사용률이 90% 이상이면 경고
    const status = memoryUsagePercent > 90 ? 'unhealthy' : 'healthy';

    return {
      status,
      usage: {
        used: `${usedMemoryMB}MB`,
        total: `${totalMemoryMB}MB`,
        percent: `${memoryUsagePercent}%`,
      },
      message: status === 'healthy' ? 'Memory usage normal' : 'High memory usage detected',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

/**
 * 디스크 공간 확인 (간단 버전)
 */
async function checkDisk() {
  try {
    // Node.js 환경에서 기본적인 파일 시스템 체크
    const fs = await import('fs');
    const stats = await fs.promises.stat(process.cwd());

    return {
      status: 'healthy',
      message: 'Disk access successful',
      workingDirectory: process.cwd(),
      accessible: stats.isDirectory(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Disk check failed',
    };
  }
}

// HEAD 요청도 지원 (로드 밸런서에서 자주 사용)
export const HEAD = GET;