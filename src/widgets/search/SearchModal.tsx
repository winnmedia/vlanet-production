/**
 * 통합 검색 모달 컴포넌트
 * Command/Ctrl+K 단축키 지원 및 실시간 검색
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Film, User, Hash, Loader2, X } from 'lucide-react';
import { Card } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';

interface SearchResult {
  id: string;
  type: 'video' | 'creator' | 'tag';
  title: string;
  subtitle?: string;
  thumbnail?: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (!isOpen) {
          // 모달 열기 이벤트 발생
          window.dispatchEvent(new CustomEvent('openSearchModal'));
        }
      }

      // ESC 키로 모달 닫기
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }

      // 화살표 키 네비게이션
      if (isOpen && results.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (event.key === 'Enter') {
          event.preventDefault();
          const selectedResult = results[selectedIndex];
          if (selectedResult) {
            handleResultClick(selectedResult);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // 모달이 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 검색 함수 (디바운싱 적용)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 300)); // 시뮬레이션

      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'video',
          title: 'AI 생성 판타지 풍경',
          subtitle: 'john_creator · 조회수 1.2k',
          thumbnail: '/placeholder-thumbnail.jpg',
          url: '/video/1'
        },
        {
          id: '2',
          type: 'video',
          title: 'Future City Visualization',
          subtitle: 'ai_artist · 조회수 3.5k',
          thumbnail: '/placeholder-thumbnail.jpg',
          url: '/video/2'
        },
        {
          id: '3',
          type: 'creator',
          title: 'john_creator',
          subtitle: '12개 영상 · Creator',
          url: '/creator/john_creator'
        },
        {
          id: '4',
          type: 'tag',
          title: '#판타지',
          subtitle: '23개 영상',
          url: '/explore?tag=판타지'
        }
      ].filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setResults(mockResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('검색 오류:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 디바운싱된 검색
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  // 검색 결과 클릭 처리
  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url;
    onClose();
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'video':
        return <Film size={16} className="text-primary-500" />;
      case 'creator':
        return <User size={16} className="text-success-500" />;
      case 'tag':
        return <Hash size={16} className="text-orange-500" />;
      default:
        return <Search size={16} className="text-secondary-400" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'video':
        return '영상';
      case 'creator':
        return '창작자';
      case 'tag':
        return '태그';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black bg-opacity-50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 bg-white shadow-2xl border-primary-200/20">
        {/* 검색 입력 */}
        <div className="flex items-center p-4 border-b border-secondary-100">
          <Search size={20} className="text-secondary-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="영상, 창작자, 태그 검색... (Ctrl+K)"
            className="flex-1 text-lg bg-transparent outline-none placeholder-secondary-400"
          />
          {isSearching && (
            <Loader2 size={20} className="text-primary-500 animate-spin ml-2" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2 p-2"
          >
            <X size={16} />
          </Button>
        </div>

        {/* 검색 결과 */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            /* 빈 상태 */
            <div className="p-6 text-center">
              <Search size={32} className="text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-500 mb-2">무엇을 찾고 계세요?</p>
              <p className="text-sm text-secondary-400">
                영상 제목, 창작자명, 태그를 입력해보세요
              </p>
            </div>
          ) : results.length === 0 && !isSearching ? (
            /* 검색 결과 없음 */
            <div className="p-6 text-center">
              <Search size={32} className="text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-600 mb-2">
                '<span className="font-semibold">{query}</span>'에 대한 결과가 없습니다
              </p>
              <p className="text-sm text-secondary-400">
                다른 키워드로 다시 검색해보세요
              </p>
            </div>
          ) : (
            /* 검색 결과 목록 */
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-secondary-50 transition-colors ${
                    index === selectedIndex ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">
                    {getResultIcon(result.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium text-secondary-900 truncate">
                        {result.title}
                      </span>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-secondary-100 text-secondary-600 rounded">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-secondary-500 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        {results.length > 0 && (
          <div className="px-4 py-3 border-t border-secondary-100 bg-secondary-50">
            <div className="flex items-center justify-between text-xs text-secondary-500">
              <div className="flex items-center space-x-4">
                <span>↑↓ 이동</span>
                <span>Enter 선택</span>
                <span>Esc 닫기</span>
              </div>
              <span>{results.length}개 결과</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}