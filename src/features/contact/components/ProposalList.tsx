/**
 * ProposalList Component
 * 제안 목록 표시 컴포넌트
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '../../../shared/ui/button'
import { Card } from '../../../shared/ui/card'
import {
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  getProposalStatusText,
  getProposalStatusColor,
  formatProposalTime,
  formatBudgetRange,
  getProposalSummary,
  getProposalStatusOptions
} from '../../../entities/proposal'
import type { ProposalWithAuthor, ProposalStatus } from '../../../entities/proposal'
import type { ProfileRow } from '../../../entities/user'

interface ProposalListProps {
  proposals: ProposalWithAuthor[]
  currentUser: ProfileRow | null
  role: 'FUNDER' | 'CREATOR'
  totalCount: number
  hasMore: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  onRefresh?: () => void
  onStatusFilter?: (status: ProposalStatus | 'ALL') => void
  onSearch?: (query: string) => void
  className?: string
}

export function ProposalList({
  proposals,
  currentUser,
  role,
  totalCount,
  hasMore,
  isLoading = false,
  onLoadMore,
  onRefresh,
  onStatusFilter,
  onSearch,
  className
}: ProposalListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ProposalStatus | 'ALL'>('ALL')

  const statusOptions = getProposalStatusOptions()

  // 검색 핸들러
  const handleSearch = () => {
    onSearch?.(searchQuery)
  }

  // 상태 필터 핸들러
  const handleStatusFilter = (status: ProposalStatus | 'ALL') => {
    setSelectedStatus(status)
    onStatusFilter?.(status)
  }

  // 제안 카드 컴포넌트
  const ProposalCard = ({ proposal }: { proposal: ProposalWithAuthor }) => {
    const counterpart = role === 'FUNDER' ? proposal.creator : proposal.funder
    const hasUnreadMessages = proposal.unread_messages_count && proposal.unread_messages_count > 0

    return (
      <Card key={proposal.id} className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                href={`/dashboard/proposals` as any}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {proposal.subject}
              </Link>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getProposalStatusColor(proposal.status)}`}
              >
                {getProposalStatusText(proposal.status)}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                  {counterpart.username.charAt(0).toUpperCase()}
                </div>
                <span>
                  {role === 'FUNDER' ? '받는 사람' : '보낸 사람'}: {counterpart.username}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatProposalTime(proposal.created_at)}</span>
              </div>
            </div>

            {/* 제안 요약 */}
            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
              {getProposalSummary(proposal, 150)}
            </p>

            {/* 추가 정보 */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {proposal.budget_range && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{formatBudgetRange(proposal.budget_range)}</span>
                </div>
              )}
              {proposal.timeline && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{proposal.timeline}</span>
                </div>
              )}
              {proposal.video && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <Link
                    href={`/video/${proposal.video.id}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {proposal.video.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnreadMessages && (
              <div className="flex items-center space-x-1 text-primary-600">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {proposal.unread_messages_count}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 응답 메시지 (있는 경우) */}
        {proposal.response_message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-1">
              {role === 'FUNDER' ? '응답' : '나의 응답'}:
            </p>
            <p className="text-sm text-gray-600">{proposal.response_message}</p>
            {proposal.responded_at && (
              <p className="text-xs text-gray-400 mt-1">
                {formatProposalTime(proposal.responded_at)}
              </p>
            )}
          </div>
        )}
      </Card>
    )
  }

  if (!currentUser) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* 헤더 및 필터 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {role === 'FUNDER' ? '보낸 제안' : '받은 제안'}
            </h2>
            <p className="text-gray-600 mt-1">
              총 {totalCount}개의 제안
            </p>
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          )}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex space-x-4">
          {onSearch && (
            <div className="flex-1 max-w-md">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목 또는 내용으로 검색..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  size="sm"
                  className="rounded-l-none border-l-0"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {onStatusFilter && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value as ProposalStatus | 'ALL')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 제안 목록 */}
      {proposals.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {role === 'FUNDER' ? '보낸 제안이 없습니다' : '받은 제안이 없습니다'}
          </h3>
          <p className="text-gray-600">
            {role === 'FUNDER'
              ? '마음에 드는 창작자에게 첫 제안을 보내보세요!'
              : '창작자 활동을 계속하시면 제안을 받을 수 있습니다.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}

          {/* 더보기 버튼 */}
          {hasMore && onLoadMore && (
            <div className="text-center pt-4">
              <Button
                onClick={onLoadMore}
                variant="outline"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  '더보기'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}