/**
 * Proposal Entity API
 * 제안 시스템 데이터베이스 접근 함수들
 */

import { createServerClient } from '../../shared/api/supabase/server'
import type {
  Proposal,
  ProposalWithAuthor,
  ProposalMessage,
  ProposalMessageWithAuthor,
  Notification,
  CreateProposalData,
  UpdateProposalData,
  CreateMessageData,
  ProposalListOptions,
  MessageListOptions,
  NotificationListOptions,
  ProposalsResponse,
  MessagesResponse,
  NotificationsResponse,
  ProposalActionResult,
  MessageActionResult,
  NotificationActionResult,
  ProposalStats
} from './types'

/**
 * 제안 목록 조회 (발신/수신별)
 */
export async function getProposalsByUser(
  options: ProposalListOptions
): Promise<ProposalsResponse> {
  const supabase = await createServerClient()
  const {
    user_id,
    role,
    status,
    limit = 10,
    offset = 0,
    sort = 'newest',
    search
  } = options

  try {
    let query = supabase
      .from('proposals')
      .select(`
        id,
        funder_id,
        creator_id,
        video_id,
        subject,
        message,
        budget_range,
        timeline,
        status,
        responded_at,
        response_message,
        created_at,
        updated_at,
        funder:profiles!funder_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        creator:profiles!creator_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        video:videos (
          id,
          title,
          thumbnail_url
        )
      `)

    // 역할에 따른 필터링
    if (role === 'FUNDER') {
      query = query.eq('funder_id', user_id)
    } else {
      query = query.eq('creator_id', user_id)
    }

    // 상태 필터링
    if (status) {
      query = query.eq('status', status)
    }

    // 검색 기능
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query = query.or(`subject.ilike.${searchTerm},message.ilike.${searchTerm}`)
    }

    // 정렬
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'updated':
        query = query.order('updated_at', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: proposals, error, count } = await query

    if (error) {
      console.error('Error fetching proposals:', error)
      throw error
    }

    // 읽지 않은 메시지 수 조회 (각 제안별)
    const proposalsWithUnreadCount = await Promise.all(
      (proposals || []).map(async (proposal: any) => {
        const { count: unreadCount } = await supabase
          .from('proposal_messages')
          .select('id', { count: 'exact' })
          .eq('proposal_id', proposal.id)
          .eq('is_read', false)
          .neq('sender_id', user_id) // 자신이 보낸 메시지는 제외

        return {
          ...proposal,
          unread_messages_count: unreadCount || 0
        } as ProposalWithAuthor
      })
    )

    // 전체 개수 조회
    let totalCount = count || 0
    if (count === null) {
      const { count: exactCount } = await supabase
        .from('proposals')
        .select('id', { count: 'exact' })
        .eq(role === 'FUNDER' ? 'funder_id' : 'creator_id', user_id)

      totalCount = exactCount || 0
    }

    return {
      proposals: proposalsWithUnreadCount,
      total_count: totalCount,
      has_more: offset + limit < totalCount
    }
  } catch (error) {
    console.error('Failed to fetch proposals:', error)
    return {
      proposals: [],
      total_count: 0,
      has_more: false
    }
  }
}

/**
 * 제안 ID로 단일 제안 조회
 */
export async function getProposalById(proposalId: string): Promise<ProposalWithAuthor | null> {
  const supabase = await createServerClient()

  try {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        id,
        funder_id,
        creator_id,
        video_id,
        subject,
        message,
        budget_range,
        timeline,
        status,
        responded_at,
        response_message,
        created_at,
        updated_at,
        funder:profiles!funder_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        creator:profiles!creator_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        video:videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .eq('id', proposalId)
      .single()

    if (error) {
      console.error('Error fetching proposal:', error)
      return null
    }

    return proposal as unknown as ProposalWithAuthor
  } catch (error) {
    console.error('Failed to fetch proposal:', error)
    return null
  }
}

/**
 * 제안 생성
 */
export async function createProposal(data: CreateProposalData): Promise<ProposalActionResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // Funder 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'FUNDER') {
      return { success: false, error: 'Funder만 제안을 생성할 수 있습니다.' }
    }

    // 제안 생성
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        funder_id: user.id,
        creator_id: data.creator_id,
        video_id: data.video_id,
        subject: data.subject.trim(),
        message: data.message.trim(),
        budget_range: data.budget_range?.trim() || null,
        timeline: data.timeline?.trim() || null
      })
      .select(`
        id,
        funder_id,
        creator_id,
        video_id,
        subject,
        message,
        budget_range,
        timeline,
        status,
        responded_at,
        response_message,
        created_at,
        updated_at,
        funder:profiles!funder_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        creator:profiles!creator_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        video:videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating proposal:', insertError)
      return { success: false, error: '제안 생성에 실패했습니다.' }
    }

    return {
      success: true,
      proposal: proposal as unknown as ProposalWithAuthor
    }
  } catch (error) {
    console.error('Failed to create proposal:', error)
    return { success: false, error: '제안 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 제안 수정 (상태 변경 포함)
 */
export async function updateProposal(
  proposalId: string,
  data: UpdateProposalData
): Promise<ProposalActionResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 상태 변경인 경우 응답 시간 설정
    const updateData: any = { ...data }
    if (data.status && ['ACCEPTED', 'REJECTED'].includes(data.status)) {
      updateData.responded_at = new Date().toISOString()
    }

    // 제안 수정 (RLS 정책에 의해 자동으로 권한 체크됨)
    const { data: proposal, error: updateError } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select(`
        id,
        funder_id,
        creator_id,
        video_id,
        subject,
        message,
        budget_range,
        timeline,
        status,
        responded_at,
        response_message,
        created_at,
        updated_at,
        funder:profiles!funder_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        creator:profiles!creator_id!inner (
          id,
          username,
          avatar_url,
          role
        ),
        video:videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating proposal:', updateError)
      if (updateError.code === 'PGRST116') {
        return { success: false, error: '제안을 찾을 수 없거나 수정 권한이 없습니다.' }
      }
      return { success: false, error: '제안 수정에 실패했습니다.' }
    }

    return {
      success: true,
      proposal: proposal as unknown as ProposalWithAuthor
    }
  } catch (error) {
    console.error('Failed to update proposal:', error)
    return { success: false, error: '제안 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 제안 삭제 (Funder만 가능)
 */
export async function deleteProposal(proposalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 제안 삭제 (RLS 정책에 의해 자동으로 권한 체크됨)
    const { error: deleteError } = await supabase
      .from('proposals')
      .delete()
      .eq('id', proposalId)

    if (deleteError) {
      console.error('Error deleting proposal:', deleteError)
      if (deleteError.code === 'PGRST116') {
        return { success: false, error: '제안을 찾을 수 없거나 삭제 권한이 없습니다.' }
      }
      return { success: false, error: '제안 삭제에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to delete proposal:', error)
    return { success: false, error: '제안 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 제안별 메시지 목록 조회
 */
export async function getMessagesByProposal(
  options: MessageListOptions
): Promise<MessagesResponse> {
  const supabase = await createServerClient()
  const { proposal_id, limit = 20, offset = 0, mark_as_read = false } = options

  try {
    let query = supabase
      .from('proposal_messages')
      .select(`
        id,
        proposal_id,
        sender_id,
        content,
        attachment_url,
        attachment_name,
        is_read,
        created_at,
        updated_at,
        sender:profiles!sender_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .eq('proposal_id', proposal_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: messages, error, count } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      throw error
    }

    // 읽음 처리 (자신이 보내지 않은 메시지만)
    if (mark_as_read) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('proposal_messages')
          .update({ is_read: true })
          .eq('proposal_id', proposal_id)
          .neq('sender_id', user.id)
          .eq('is_read', false)
      }
    }

    const totalCount = count || 0

    return {
      messages: (messages || []) as unknown as ProposalMessageWithAuthor[],
      total_count: totalCount,
      has_more: offset + limit < totalCount
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return {
      messages: [],
      total_count: 0,
      has_more: false
    }
  }
}

/**
 * 메시지 생성
 */
export async function createMessage(data: CreateMessageData): Promise<MessageActionResult> {
  const supabase = await createServerClient()

  try {
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 메시지 생성
    const { data: message, error: insertError } = await supabase
      .from('proposal_messages')
      .insert({
        proposal_id: data.proposal_id,
        sender_id: user.id,
        content: data.content.trim(),
        attachment_url: data.attachment_url || null,
        attachment_name: data.attachment_name || null
      })
      .select(`
        id,
        proposal_id,
        sender_id,
        content,
        attachment_url,
        attachment_name,
        is_read,
        created_at,
        updated_at,
        sender:profiles!sender_id!inner (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating message:', insertError)
      return { success: false, error: '메시지 작성에 실패했습니다.' }
    }

    return {
      success: true,
      message: message as unknown as ProposalMessageWithAuthor
    }
  } catch (error) {
    console.error('Failed to create message:', error)
    return { success: false, error: '메시지 작성 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자별 알림 목록 조회
 */
export async function getNotificationsByUser(
  options: NotificationListOptions
): Promise<NotificationsResponse> {
  const supabase = await createServerClient()
  const { user_id, type, is_read, limit = 20, offset = 0 } = options

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)

    // 타입 필터링
    if (type) {
      query = query.eq('type', type)
    }

    // 읽음 상태 필터링
    if (typeof is_read === 'boolean') {
      query = query.eq('is_read', is_read)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }

    // 읽지 않은 알림 수 조회
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user_id)
      .eq('is_read', false)

    const totalCount = count || 0

    return {
      notifications: notifications || [],
      total_count: totalCount,
      unread_count: unreadCount || 0,
      has_more: offset + limit < totalCount
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return {
      notifications: [],
      total_count: 0,
      unread_count: 0,
      has_more: false
    }
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationActionResult> {
  const supabase = await createServerClient()

  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: '알림 읽음 처리에 실패했습니다.' }
    }

    return {
      success: true,
      notification: notification as Notification
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return { success: false, error: '알림 읽음 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자별 제안 통계 조회
 */
export async function getProposalStatsByUser(userId: string): Promise<ProposalStats> {
  const supabase = await createServerClient()

  try {
    // 발신한 제안 통계
    const { data: sentProposals } = await supabase
      .from('proposals')
      .select('status')
      .eq('funder_id', userId)

    // 수신한 제안 통계
    const { data: receivedProposals } = await supabase
      .from('proposals')
      .select('status')
      .eq('creator_id', userId)

    const totalSent = sentProposals?.length || 0
    const totalReceived = receivedProposals?.length || 0

    const pendingSent = sentProposals?.filter(p => p.status === 'PENDING').length || 0
    const pendingReceived = receivedProposals?.filter(p => p.status === 'PENDING').length || 0

    const accepted = [...(sentProposals || []), ...(receivedProposals || [])]
      .filter(p => p.status === 'ACCEPTED').length

    const rejected = [...(sentProposals || []), ...(receivedProposals || [])]
      .filter(p => p.status === 'REJECTED').length

    const respondedProposals = receivedProposals?.filter(p =>
      p.status === 'ACCEPTED' || p.status === 'REJECTED'
    ).length || 0

    const responseRate = totalReceived > 0
      ? Math.round((respondedProposals / totalReceived) * 100)
      : 0

    return {
      total_sent: totalSent,
      total_received: totalReceived,
      pending_sent: pendingSent,
      pending_received: pendingReceived,
      accepted,
      rejected,
      response_rate: responseRate
    }
  } catch (error) {
    console.error('Failed to get proposal stats:', error)
    return {
      total_sent: 0,
      total_received: 0,
      pending_sent: 0,
      pending_received: 0,
      accepted: 0,
      rejected: 0,
      response_rate: 0
    }
  }
}