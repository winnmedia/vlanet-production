/**
 * Trending Videos API Route
 * 트렌딩 영상 목록을 반환하는 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingVideos } from '@/entities/video/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const videos = await getTrendingVideos(limit);

    return NextResponse.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending videos'
      },
      { status: 500 }
    );
  }
}