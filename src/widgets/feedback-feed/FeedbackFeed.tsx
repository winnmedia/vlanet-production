/**
 * 실시간 피드백 피드 위젯
 * 최근 댓글과 펀딩 제안을 표시
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  MessageCircle,
  DollarSign,
  Clock,
  ExternalLink,
  Check,
  X,
  Eye,
  ChevronRight,
  Building,
  User,
  Bell,
  Star
} from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  videoTitle: string;
  videoId: string;
  createdAt: string;
}

interface FundingProposal {
  id: string;
  funder: {
    name: string;
    company: string;
    avatar?: string;
  };
  amount: number;
  videoTitle: string;
  videoId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface FeedbackFeedProps {
  comments: Comment[];
  proposals: FundingProposal[];
  loading?: boolean;
  className?: string;
}

/**
 * 댓글 아이템 컴포넌트
 */
function CommentItem({ comment }: { comment: Comment }) {
  const timeAgo = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex space-x-3 p-3 hover:bg-secondary-50 rounded-lg transition-colors">
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        {comment.user.avatar ? (
          <Image
            src={comment.user.avatar}
            alt={comment.user.name}
            width={32}
            height={32}
            className="rounded-full object-cover"
            priority={false}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-primary-600" />
          </div>
        )}
      </div>

      {/* 댓글 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-secondary-900 truncate">
            {comment.user.name}
          </span>
          <span className="text-xs text-secondary-500">
            {timeAgo}
          </span>
        </div>

        <p className="text-sm text-secondary-700 line-clamp-2 mb-2">
          "{comment.content}"
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary-500 truncate">
            {comment.videoTitle}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-auto text-secondary-400 hover:text-primary-600"
          >
            <ExternalLink size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 펀딩 제안 아이템 컴포넌트
 */
function ProposalItem({ proposal }: { proposal: FundingProposal }) {
  const [isResponding, setIsResponding] = useState(false);

  const handleAccept = () => {
    setIsResponding(true);
    // API 호출 로직
    setTimeout(() => setIsResponding(false), 1000);
  };

  const handleReject = () => {
    setIsResponding(true);
    // API 호출 로직
    setTimeout(() => setIsResponding(false), 1000);
  };

  const timeAgo = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* 회사/투자자 정보 */}
          <div className="flex-shrink-0">
            {proposal.funder.avatar ? (
              <Image
                src={proposal.funder.avatar}
                alt={proposal.funder.name}
                width={40}
                height={40}
                className="rounded-full object-cover"
                priority={false}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            ) : (
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Building size={16} className="text-primary-600" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-secondary-900 truncate">
                {proposal.funder.company}
              </h4>
              {proposal.status === 'pending' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                  <Bell size={10} className="mr-1" />
                  대기중
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-500">
              {proposal.funder.name} • {timeAgo}
            </p>
          </div>
        </div>

        {/* 제안 금액 */}
        <div className="text-right">
          <div className="flex items-center text-primary-600 font-bold">
            <DollarSign size={14} className="mr-1" />
            {proposal.amount.toLocaleString()}원
          </div>
          <div className="flex items-center text-xs text-secondary-500 mt-1">
            <Star size={10} className="mr-1" />
            <span>펀딩 제안</span>
          </div>
        </div>
      </div>

      {/* 대상 영상 */}
      <div className="mb-3">
        <p className="text-sm text-secondary-600 line-clamp-1">
          <span className="text-secondary-500">대상 영상:</span> {proposal.videoTitle}
        </p>
      </div>

      {/* 제안 메시지 */}
      <div className="mb-4">
        <p className="text-sm text-secondary-700 line-clamp-2">
          "{proposal.message}"
        </p>
      </div>

      {/* 액션 버튼 */}
      {proposal.status === 'pending' && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isResponding}
            className="text-xs"
          >
            <X size={12} className="mr-1" />
            거절
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAccept}
            disabled={isResponding}
            className="text-xs"
          >
            <Check size={12} className="mr-1" />
            검토
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs p-2"
          >
            <Eye size={12} />
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * 로딩 스켈레톤
 */
function CommentSkeleton() {
  return (
    <div className="flex space-x-3 p-3 animate-pulse">
      <div className="w-8 h-8 bg-secondary-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-secondary-200 rounded w-1/3" />
        <div className="h-3 bg-secondary-200 rounded w-full" />
        <div className="h-2 bg-secondary-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function ProposalSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary-200 rounded-full" />
          <div className="space-y-1">
            <div className="h-3 bg-secondary-200 rounded w-20" />
            <div className="h-2 bg-secondary-200 rounded w-16" />
          </div>
        </div>
        <div className="h-4 bg-secondary-200 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-secondary-200 rounded w-full" />
        <div className="h-3 bg-secondary-200 rounded w-3/4" />
      </div>
    </Card>
  );
}

/**
 * 메인 피드백 피드 컴포넌트
 */
export function FeedbackFeed({ comments, proposals, loading = false, className }: FeedbackFeedProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'proposals'>('comments');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 최근 댓글 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <MessageCircle size={18} className="mr-2 text-primary-600" />
            최근 댓글
          </h3>
          <Button variant="ghost" size="sm" className="text-sm text-secondary-600 hover:text-primary-600">
            전체 보기
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>

        <Card className="divide-y divide-secondary-100">
          {loading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </>
          ) : comments.length > 0 ? (
            <>
              {comments.slice(0, 10).map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </>
          ) : (
            <div className="p-6 text-center text-secondary-500">
              <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">아직 댓글이 없습니다</p>
            </div>
          )}
        </Card>
      </div>

      {/* 펀딩 제안 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
            <DollarSign size={18} className="mr-2 text-success-600" />
            펀딩 제안
          </h3>
          <Button variant="ghost" size="sm" className="text-sm text-secondary-600 hover:text-primary-600">
            전체 보기
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
                <ProposalSkeleton key={i} />
              ))}
            </>
          ) : proposals.length > 0 ? (
            <>
              {proposals.slice(0, 3).map((proposal) => (
                <ProposalItem key={proposal.id} proposal={proposal} />
              ))}
            </>
          ) : (
            <Card className="p-6 text-center text-secondary-500">
              <DollarSign size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">아직 펀딩 제안이 없습니다</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}