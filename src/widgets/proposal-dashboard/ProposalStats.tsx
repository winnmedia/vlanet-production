/**
 * ProposalStats Widget
 * 제안 통계 위젯 - 대시보드용
 */

import { Card } from '@/shared/ui/card'
import {
  Send,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { getProposalStatsByUser, formatResponseRate } from '@/entities/proposal'
import type { ProfileRow } from '@/entities/user'

interface ProposalStatsProps {
  user: ProfileRow
  className?: string
}

export async function ProposalStats({
  user,
  className
}: ProposalStatsProps) {
  const stats = await getProposalStatsByUser(user.id)

  const statsCards = [
    {
      title: '보낸 제안',
      value: stats.total_sent,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `대기 중: ${stats.pending_sent}개`
    },
    {
      title: '받은 제안',
      value: stats.total_received,
      icon: Inbox,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `대기 중: ${stats.pending_received}개`
    },
    {
      title: '수락된 제안',
      value: stats.accepted,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: '성사된 협업'
    },
    {
      title: '거절된 제안',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '학습 기회'
    }
  ]

  return (
    <div className={className}>
      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 추가 인사이트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 응답률 카드 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">응답률</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {formatResponseRate(stats.response_rate)}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.response_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.response_rate, 100)}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              받은 제안 중 {stats.total_received > 0 &&
                `${Math.round((stats.accepted + stats.rejected) / stats.total_received * 100)}%`}에 응답했습니다
            </p>
          </div>
        </Card>

        {/* 활동 요약 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">활동 요약</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">전체 제안</span>
              <span className="font-medium text-gray-900">
                {(stats.total_sent + stats.total_received).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">성공한 협업</span>
              <span className="font-medium text-green-600">
                {stats.accepted}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">대기 중</span>
              <span className="font-medium text-orange-600">
                {stats.pending_sent + stats.pending_received}
              </span>
            </div>

            {stats.total_sent + stats.total_received > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  성공률: {Math.round(stats.accepted / (stats.total_sent + stats.total_received) * 100)}%
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 도움말 카드 */}
      {(stats.total_sent + stats.total_received) === 0 && (
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-blue-600 text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {user.role === 'FUNDER' ? '첫 제안을 보내보세요!' : '첫 제안을 받아보세요!'}
            </h3>
            <p className="text-blue-700 text-sm">
              {user.role === 'FUNDER'
                ? '마음에 드는 창작자를 찾아 협업 제안을 보내보세요.'
                : '매력적인 콘텐츠를 만들어 투자자의 관심을 끌어보세요.'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}