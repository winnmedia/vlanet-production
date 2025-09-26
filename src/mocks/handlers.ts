/**
 * MSW API 핸들러
 * 테스트에서 사용할 API 응답을 정의합니다.
 */

import { http, HttpResponse } from 'msw'

// 모의 사용자 데이터
const mockUsers = [
  {
    id: 'user-1',
    username: 'testcreator',
    avatar_url: null,
    bio: '테스트 창작자입니다',
    role: 'CREATOR',
    company: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'testfunder',
    avatar_url: null,
    bio: '테스트 투자자입니다',
    role: 'FUNDER',
    company: 'Test Investment',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// 모의 영상 데이터
const mockVideos = [
  {
    id: 'video-1',
    creator_id: 'user-1',
    title: '테스트 AI 영상',
    description: '테스트용 AI 생성 영상입니다',
    video_url: 'https://example.com/video.mp4',
    thumbnail_url: 'https://example.com/thumbnail.jpg',
    duration: 120,
    file_size: 10485760,
    genre: ['애니메이션'],
    style: ['카툰'],
    ai_tools: ['Runway Gen-2'],
    tags: ['테스트', 'AI'],
    is_public: true,
    is_featured: false,
    status: 'published',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// 모의 댓글 데이터
const mockComments = [
  {
    id: 'comment-1',
    user_id: 'user-2',
    video_id: 'video-1',
    parent_id: null,
    content: '정말 훌륭한 작품이네요!',
    created_at: '2024-01-01T01:00:00Z',
    updated_at: '2024-01-01T01:00:00Z',
    author: mockUsers[1],
  },
]

// 모의 제안 데이터
const mockProposals = [
  {
    id: 'proposal-1',
    funder_id: 'user-2',
    creator_id: 'user-1',
    video_id: 'video-1',
    subject: '투자 제안드립니다',
    message: '귀하의 작품에 관심이 많습니다. 투자에 관해 논의해보실까요?',
    budget_range: '100만원~500만원',
    timeline: '2개월 내',
    status: 'PENDING',
    responded_at: null,
    response_message: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    funder: mockUsers[1],
    creator: mockUsers[0],
    video: mockVideos[0],
  },
]

export const handlers = [
  // 사용자 프로필 조회
  http.get('/api/profiles/:id', ({ params }) => {
    const user = mockUsers.find(u => u.id === params.id)
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: user })
  }),

  // 영상 목록 조회
  http.get('/api/videos', ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit')) || 10
    const offset = Number(url.searchParams.get('offset')) || 0

    const videos = mockVideos.slice(offset, offset + limit)
    return HttpResponse.json({
      data: videos,
      count: mockVideos.length,
    })
  }),

  // 영상 상세 조회
  http.get('/api/videos/:id', ({ params }) => {
    const video = mockVideos.find(v => v.id === params.id)
    if (!video) {
      return HttpResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({ data: video })
  }),

  // 영상 생성
  http.post('/api/videos', async ({ request }) => {
    const body = await request.json() as any
    const newVideo = {
      id: `video-${Date.now()}`,
      creator_id: body.creator_id,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockVideos.push(newVideo)
    return HttpResponse.json({ data: newVideo }, { status: 201 })
  }),

  // 댓글 목록 조회
  http.get('/api/videos/:videoId/comments', ({ params }) => {
    const comments = mockComments.filter(c => c.video_id === params.videoId)
    return HttpResponse.json({
      data: comments,
      count: comments.length,
    })
  }),

  // 댓글 생성
  http.post('/api/videos/:videoId/comments', async ({ request, params }) => {
    const body = await request.json() as any
    const newComment = {
      id: `comment-${Date.now()}`,
      video_id: params.videoId,
      user_id: body.user_id,
      content: body.content,
      parent_id: body.parent_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: mockUsers.find(u => u.id === body.user_id) || mockUsers[0],
    }
    mockComments.push(newComment)
    return HttpResponse.json({ data: newComment }, { status: 201 })
  }),

  // 제안 목록 조회
  http.get('/api/proposals', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const role = url.searchParams.get('role')

    let proposals = mockProposals
    if (userId && role === 'funder') {
      proposals = proposals.filter(p => p.funder_id === userId)
    } else if (userId && role === 'creator') {
      proposals = proposals.filter(p => p.creator_id === userId)
    }

    return HttpResponse.json({
      data: proposals,
      count: proposals.length,
    })
  }),

  // 제안 생성
  http.post('/api/proposals', async ({ request }) => {
    const body = await request.json() as any
    const newProposal = {
      id: `proposal-${Date.now()}`,
      ...body,
      status: 'PENDING',
      responded_at: null,
      response_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      funder: mockUsers.find(u => u.id === body.funder_id) || mockUsers[1],
      creator: mockUsers.find(u => u.id === body.creator_id) || mockUsers[0],
      video: mockVideos.find(v => v.id === body.video_id),
    }
    mockProposals.push(newProposal)
    return HttpResponse.json({ data: newProposal }, { status: 201 })
  }),

  // 제안 상태 업데이트
  http.patch('/api/proposals/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const proposalIndex = mockProposals.findIndex(p => p.id === params.id)

    if (proposalIndex === -1) {
      return HttpResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    mockProposals[proposalIndex] = {
      ...mockProposals[proposalIndex],
      ...body,
      updated_at: new Date().toISOString(),
      responded_at: body.status ? new Date().toISOString() : null,
    }

    return HttpResponse.json({ data: mockProposals[proposalIndex] })
  }),

  // 좋아요/반응 처리
  http.post('/api/videos/:videoId/reactions', async ({ params, request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      data: {
        id: `reaction-${Date.now()}`,
        user_id: body.user_id,
        video_id: params.videoId,
        type: body.type,
        created_at: new Date().toISOString(),
      }
    }, { status: 201 })
  }),

  // 알림 목록 조회
  http.get('/api/notifications', ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    const mockNotifications = [
      {
        id: 'notification-1',
        user_id: userId,
        type: 'NEW_PROPOSAL',
        title: '새로운 제안이 도착했습니다',
        message: 'testfunder님이 투자 제안을 보냈습니다',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]

    return HttpResponse.json({
      data: mockNotifications,
      count: mockNotifications.length,
    })
  }),

  // 파일 업로드 (Supabase Storage 모킹)
  http.post('/storage/v1/object/videos/*', async ({ request }) => {
    return HttpResponse.json({
      Key: 'videos/test-video.mp4',
      ETag: '"test-etag"',
    }, { status: 200 })
  }),

  // 에러 핸들링 테스트용
  http.get('/api/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),
]