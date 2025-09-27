/**
 * Related Videos API Route
 * 관련 영상 목록을 반환하는 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRelatedVideos } from '@/entities/video/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video ID is required'
        },
        { status: 400 }
      );
    }

    const videos = await getRelatedVideos(videoId, limit);

    return NextResponse.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch related videos'
      },
      { status: 500 }
    );
  }
}