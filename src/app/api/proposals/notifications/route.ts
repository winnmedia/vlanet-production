/**
 * Notifications API Route
 * 사용자 알림 목록을 반환하는 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsByUser } from '@/entities/proposal/api';
import { createServerClient } from '@/shared/api/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await getNotificationsByUser(user.id, { limit, offset });

    return NextResponse.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications'
      },
      { status: 500 }
    );
  }
}