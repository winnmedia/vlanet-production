# VideoPlanet 디자인 시스템 & 브랜드 가이드 v1.0.0

> AI 창작자와 투자자를 연결하는 혁신적인 플랫폼의 디자인 철학과 브랜드 아이덴티티

## 🎯 브랜드 핵심 가치

### 미션
**"Prompt to Profit"** - AI 창작자의 상상력을 비즈니스 기회로 전환

### 비전
모든 AI 창작자가 자신의 재능을 상업적 성공으로 이끌 수 있는 세상

### 핵심 가치
- **혁신 (Innovation)**: AI 기술의 창의적 활용
- **연결 (Connection)**: 창작자와 투자자의 가교
- **신뢰 (Trust)**: 투명하고 안전한 거래 환경
- **성장 (Growth)**: 함께 성장하는 생태계

---

## 🎨 디자인 원칙

### 1. 창작자 중심 (Creator-First)
- 창작물이 돋보이는 디자인
- 방해 요소 최소화
- 직관적인 업로드 프로세스

### 2. 프로페셔널 (Professional)
- 투자자에게 신뢰감을 주는 UI
- 체계적인 정보 구조
- 비즈니스 친화적 톤

### 3. 접근성 (Accessible)
- 모든 사용자가 쉽게 사용
- 명확한 네비게이션
- 반응형 디자인

### 4. 일관성 (Consistent)
- 통일된 디자인 언어
- 예측 가능한 인터랙션
- 브랜드 아이덴티티 유지

---

## 🎨 색상 시스템

### 주요 색상 (Primary Colors)
```scss
// VLANET 브랜드 색상
$primary-500: #0059db;  // 밝은 블루 - 주요 액션, 링크
$primary-600: #004ac1;  // 진한 블루 - 호버 상태, 강조

// 그라데이션
$gradient-primary: linear-gradient(135deg, #0059db 0%, #004ac1 100%);
$gradient-hover: linear-gradient(135deg, #0066ff 0%, #0052d9 100%);
```

### 보조 색상 (Secondary Colors)
```scss
// 뉴트럴 (Neutral)
$gray-50:  #f8fafc;  // 배경
$gray-100: #f1f5f9;  // 카드 배경
$gray-500: #64748b;  // 보조 텍스트
$gray-900: #0f172a;  // 메인 텍스트

// 시맨틱 (Semantic)
$success: #22c55e;   // 성공, 온라인
$warning: #f59e0b;   // 경고, 주의
$danger:  #ef4444;   // 에러, 삭제
$info:    #3b82f6;   // 정보, 알림
```

### 색상 사용 가이드
- **Primary Blue**: CTA 버튼, 중요 링크, 선택된 상태
- **Gray Scale**: 텍스트, 배경, 구분선
- **Semantic Colors**: 상태 표시, 피드백 메시지

---

## 📝 타이포그래피

### 폰트 패밀리
```css
--font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### 텍스트 스케일
| 용도 | 크기 | 굵기 | 행간 |
|------|------|------|------|
| Display | 48px | 700 | 1.2 |
| Heading 1 | 36px | 700 | 1.3 |
| Heading 2 | 30px | 600 | 1.3 |
| Heading 3 | 24px | 600 | 1.4 |
| Body Large | 18px | 400 | 1.6 |
| Body | 16px | 400 | 1.6 |
| Caption | 14px | 400 | 1.5 |
| Small | 12px | 400 | 1.5 |

---

## 🧩 UI 컴포넌트 스타일

### 버튼 (Buttons)

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #0059db 0%, #004ac1 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 89, 219, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: #004ac1;
  border: 2px solid #0059db;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
}
```

### 카드 (Cards)
```css
.project-card {
  background: white;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 입력 필드 (Input Fields)
```css
.input-field {
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: all 0.2s;
}

.input-field:focus {
  border-color: #0059db;
  box-shadow: 0 0 0 3px rgba(0, 89, 219, 0.1);
}
```

---

## 💬 마케팅 문구 & 카피라이팅

### 🏠 메인 페이지

#### 헤로 섹션
**메인 헤드라인**
> "AI 창작물이 비즈니스로 진화하는 곳"

**서브 헤드라인**
> "당신의 AI 작품을 투자 기회로 연결하는 국내 최초 플랫폼"

**CTA 버튼**
- Creator: "내 작품 업로드하기"
- Funder: "인재 발굴 시작하기"

#### 가치 제안 (Value Proposition)

**창작자를 위한 메시지**
- 제목: "창작에만 집중하세요"
- 설명: "복잡한 비즈니스는 VLANET이 연결해드립니다"
- 포인트:
  - ✓ 간편한 포트폴리오 관리
  - ✓ 투자자 직접 매칭
  - ✓ 안전한 협업 환경

**투자자를 위한 메시지**
- 제목: "미래의 콘텐츠를 먼저 만나세요"
- 설명: "검증된 AI 창작자와 혁신적인 IP를 발굴하세요"
- 포인트:
  - ✓ 큐레이션된 작품
  - ✓ 창작자 프로필 확인
  - ✓ 직접 제안 시스템

---

### 👤 온보딩 페이지

#### 역할 선택
**페이지 타이틀**
> "VLANET에서 당신의 역할은?"

**Creator 카드**
- 제목: "AI 창작자"
- 설명: "AI로 만든 영상을 공유하고 투자 기회를 찾아보세요"
- 아이콘: 🎨

**Funder 카드**
- 제목: "콘텐츠 투자자"
- 설명: "재능 있는 창작자를 발굴하고 협업을 제안하세요"
- 아이콘: 💼

#### 프로필 설정
**안내 메시지**
> "거의 다 왔어요! 프로필을 완성하고 시작하세요"

**입력 필드 플레이스홀더**
- 사용자명: "@당신의_창작자명"
- 소개: "어떤 스타일의 작품을 만드시나요?"
- 회사 (Funder): "소속 회사 또는 단체명"

---

### 📹 업로드 페이지

**페이지 헤드라인**
> "당신의 AI 작품을 세상에 선보이세요"

**업로드 영역**
> "영상을 드래그하거나 클릭하여 업로드"
> "MP4 형식, 최대 200MB, 2분 이내"

**폼 라벨**
- 제목: "작품 제목"
- 설명: "작품 스토리와 제작 과정을 소개해주세요"
- 장르: "어떤 장르인가요?"
- 스타일: "비주얼 스타일을 선택하세요"
- AI 도구: "사용한 AI 툴을 알려주세요"

**업로드 버튼**
- 진행 중: "업로드 중... {percent}%"
- 완료: "업로드 완료!"

---

### 🏠 피드 페이지

**섹션 타이틀**
- Featured: "VLANET's PICK 🌟"
- 최신: "방금 올라온 작품"
- 인기: "주목받는 작품"

**빈 상태 메시지**
> "아직 작품이 없어요. 첫 번째 창작자가 되어보세요!"

**필터/정렬**
- "최신순"
- "인기순"
- "모든 장르"
- "모든 스타일"

---

### 📧 제안 시스템

**연락하기 버튼**
> "창작자에게 제안하기"

**제안 모달 타이틀**
> "{창작자명}님께 협업을 제안하세요"

**제안 폼**
- 제목: "제안 제목을 입력하세요"
- 메시지: "구체적인 협업 내용과 비전을 공유해주세요"
- 예산: "예상 예산 범위 (선택)"
- 일정: "프로젝트 일정 (선택)"

**제안 상태**
- PENDING: "검토 대기 중"
- ACCEPTED: "수락됨 ✅"
- REJECTED: "거절됨"

---

### 💼 대시보드

**Creator 대시보드**
- 타이틀: "내 포트폴리오"
- 탭: "작품 관리 | 받은 제안 | 통계"
- 빈 상태: "첫 작품을 업로드하고 투자자를 만나보세요"

**Funder 대시보드**
- 타이틀: "제안 관리"
- 탭: "보낸 제안 | 관심 창작자 | 저장한 작품"
- 빈 상태: "흥미로운 창작자를 발견하고 제안을 보내보세요"

---

## 🔄 인터랙션 패턴

### 마이크로 인터랙션

#### 좋아요 애니메이션
```css
@keyframes heart-burst {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.like-button.active {
  animation: heart-burst 0.3s ease;
  color: #ef4444;
}
```

#### 업로드 진행 표시
```css
.upload-progress {
  background: linear-gradient(90deg,
    #0059db 0%,
    #004ac1 var(--progress),
    #e2e8f0 var(--progress));
  transition: all 0.3s ease;
}
```

### 로딩 상태

#### 스켈레톤 스크린
```css
.skeleton {
  background: linear-gradient(90deg,
    #f1f5f9 25%,
    #e2e8f0 50%,
    #f1f5f9 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 피드백 메시지

#### 토스트 알림
- 성공: "✓ {액션}이(가) 완료되었습니다"
- 에러: "⚠ {문제}가 발생했습니다. 다시 시도해주세요"
- 정보: "ℹ {정보 메시지}"

---

## 📱 반응형 디자인 브레이크포인트

```scss
// 모바일 우선 접근
$mobile: 0px;      // 기본
$tablet: 768px;    // 태블릿
$desktop: 1024px;  // 데스크톱
$wide: 1280px;     // 와이드 스크린

// 사용 예시
@media (min-width: $tablet) {
  .container { max-width: 768px; }
}

@media (min-width: $desktop) {
  .container { max-width: 1024px; }
}

@media (min-width: $wide) {
  .container { max-width: 1280px; }
}
```

---

## 🎯 UX 플로우

### Creator 여정 (Creator Journey)

```
1. 발견 → 2. 가입 → 3. 온보딩 → 4. 업로드 → 5. 관리 → 6. 성장
```

1. **발견**: 랜딩 페이지에서 가치 인식
2. **가입**: Google 계정으로 간편 가입
3. **온보딩**: Creator 역할 선택 및 프로필 설정
4. **업로드**: 첫 작품 업로드 (가이드 제공)
5. **관리**: 대시보드에서 작품 및 제안 관리
6. **성장**: 투자자와 연결되어 비즈니스 기회 창출

### Funder 여정 (Funder Journey)

```
1. 탐색 → 2. 가입 → 3. 온보딩 → 4. 발굴 → 5. 제안 → 6. 협업
```

1. **탐색**: 메인 피드에서 작품 둘러보기
2. **가입**: 관심 창작자 발견 시 가입
3. **온보딩**: Funder 역할 선택 및 회사 정보 입력
4. **발굴**: 필터링과 큐레이션으로 창작자 발견
5. **제안**: 관심 창작자에게 협업 제안
6. **협업**: 수락된 제안으로 비즈니스 시작

---

## 🚫 에러 상태 & 빈 상태

### 404 페이지
**타이틀**: "페이지를 찾을 수 없어요"
**설명**: "요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다"
**CTA**: "홈으로 돌아가기"

### 500 에러
**타이틀**: "일시적인 오류가 발생했어요"
**설명**: "잠시 후 다시 시도해주세요"
**CTA**: "새로고침"

### 빈 상태 일러스트레이션
- 검색 결과 없음: "검색 결과가 없어요. 다른 키워드로 시도해보세요"
- 작품 없음: "아직 업로드된 작품이 없어요"
- 제안 없음: "받은 제안이 없어요. 작품을 더 업로드해보세요"

---

## 📊 성능 지표 (UX Metrics)

### 목표 지표
- **첫 로딩 시간**: < 3초
- **인터랙션 응답**: < 100ms
- **페이지 전환**: < 300ms
- **업로드 성공률**: > 95%

### 사용성 목표
- **온보딩 완료율**: > 80%
- **첫 업로드까지 시간**: < 5분
- **제안 응답률**: > 60%

---

## ✅ 접근성 체크리스트

### WCAG 2.1 AA 준수
- [ ] 모든 이미지에 대체 텍스트
- [ ] 키보드만으로 모든 기능 사용 가능
- [ ] 색상 대비 4.5:1 이상
- [ ] 포커스 인디케이터 명확
- [ ] 스크린 리더 호환
- [ ] 폼 라벨 연결
- [ ] 에러 메시지 명확
- [ ] 시간 제한 조절 가능

---

## 🎭 톤 & 매너

### 브랜드 보이스
- **전문적이면서 친근한**: 비즈니스 신뢰감 + 창작자 친화적
- **간결하고 명확한**: 불필요한 수식어 제거
- **격려하고 지원하는**: 창작자의 성장을 응원
- **혁신적이고 미래지향적**: AI 시대를 선도

### 문체 가이드
- ✅ 존댓말 사용 ("~하세요", "~됩니다")
- ✅ 능동형 문장 선호
- ✅ 전문 용어는 쉽게 설명
- ❌ 과도한 영어 표현 지양
- ❌ 명령조 지양

---

## 🚀 구현 우선순위

### Phase별 디자인 구현

#### Phase 0 (기초)
- VLANET 로고 컴포넌트
- 색상 시스템 설정
- 기본 버튼, 입력 필드
- 로그인 페이지 디자인

#### Phase 1 (온보딩)
- 역할 선택 카드
- 프로필 설정 폼
- 진행 표시기

#### Phase 2 (업로드)
- 드래그 앤 드롭 영역
- 업로드 진행 표시
- 비디오 플레이어

#### Phase 3 (피드)
- 프로젝트 카드
- 그리드 레이아웃
- 필터/정렬 UI

#### Phase 4 (상호작용)
- 좋아요 애니메이션
- 댓글 UI
- 토스트 알림

#### Phase 5 (제안)
- 제안 모달
- 제안 카드
- 상태 배지

---

## 📝 개발자를 위한 구현 가이드

### Tailwind CSS 클래스 매핑

```javascript
// 버튼 스타일
const buttonStyles = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg',
  secondary: 'bg-white text-primary-600 border-2 border-primary-500',
  disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed'
};

// 카드 스타일
const cardStyles = {
  default: 'bg-white rounded-xl shadow-sm hover:shadow-md transition-all',
  featured: 'bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-500'
};

// 텍스트 스타일
const textStyles = {
  h1: 'text-4xl font-bold text-gray-900',
  h2: 'text-3xl font-semibold text-gray-800',
  body: 'text-base text-gray-600 leading-relaxed',
  caption: 'text-sm text-gray-500'
};
```

### 애니메이션 유틸리티

```javascript
// 페이드 인 애니메이션
const fadeIn = 'animate-fade-in opacity-0';

// 슬라이드 업 애니메이션
const slideUp = 'animate-slide-up transform translate-y-4';

// 스켈레톤 로딩
const skeleton = 'bg-gray-200 animate-pulse rounded';
```

---

## 🔄 업데이트 로그

- **v1.0.0** (2024.12): 초기 디자인 시스템 수립
  - VLANET 브랜드 색상 적용
  - 기본 컴포넌트 스타일 정의
  - 마케팅 문구 작성

---

**문서 버전**: 1.0.0
**최종 수정**: 2024년 12월
**다음 리뷰**: MVP 런칭 후