# Brew Pick - Task List

## Phase 1: 프로젝트 초기 설정

- [x] Vite + React + TypeScript 프로젝트 생성
- [x] Firebase 프로젝트 설정 (Firestore, Auth) — Spark 무료 요금제
- [x] GitHub Pages 배포 설정 (GitHub Actions CI/CD)
- [x] 프로젝트 디렉토리 구조 생성

## Phase 2: 인증

- [x] Firebase Auth Google 로그인 제공업체 활성화
- [x] Google OAuth 로그인 구현 (signInWithPopup)
- [x] 프론트엔드 로그인 페이지 UI
- [x] 로그인/로그아웃 상태 관리 (React Context)
- [x] 인증 가드 (미로그인 시 리다이렉트)

## Phase 3: 메뉴 크롤링

- [x] 이디야 메뉴 크롤링 스크립트 (`scripts/crawl-menus.ts`)
- [x] 투썸플레이스 메뉴 크롤링 스크립트
- [x] 크롤링 결과 JSON 저장 (`public/data/*.json`)
- [x] GitHub Actions 크롤링 워크플로우 (수동 트리거 + 주간 스케줄)
- [x] `public/data/franchises.json` 초기 데이터 생성

## Phase 4: 방 관리

- [x] 방 생성 페이지 UI (이름, 비밀번호, 프랜차이즈 그리드 선택)
- [x] 방 목록 페이지 UI (12시간 필터링, 잠금/종료 표시, 카운트다운)
- [x] 방 입장 로직 (비밀번호 검증 모달)
- [x] 방장 기능: 투표 조기 종료
- [x] Firestore Security Rules 작성

## Phase 5: 투표

- [x] 투표 페이지 UI (카테고리별 그룹핑, 음료 선택)
- [x] ICE/HOT 토글 (투썸플레이스만, 이디야는 메뉴명에 포함)
- [x] 1인 1표 보장 (문서 ID = userId)
- [x] 투표 변경 가능
- [x] 종료된 방 투표 비활성화
- [x] Firestore 실시간 구독 (onSnapshot)

## Phase 6: 결과

- [x] 주문 요약 테이블 (메뉴별 ICE/HOT 수량, 합계)
- [x] 주문 상세 (음료별 투표자 그룹핑, 이름 가나다순 정렬)
- [x] 실시간 업데이트

## Phase 7: 테스트

- [x] formatTime 유틸 테스트 (6개)
- [x] rooms 서비스 테스트 — isRoomExpired, canVote, getRemainingTime (9개)
- [x] menu 서비스 테스트 — loadFranchises, loadMenu (2개)
- [x] LoginPage 컴포넌트 테스트 (3개)
- [x] 빌드 통과 확인

## 디렉토리 구조

```
brew-pick/
├── docs/                      # 계획서
├── scripts/                    # 크롤링 스크립트
│   └── crawl-menus.ts
├── public/
│   └── data/                  # 크롤링 결과 JSON
│       ├── franchises.json
│       ├── ediya.json
│       └── twosome.json
├── src/                        # React App
│   ├── components/
│   │   └── common/            # Header, AuthGuard, PasswordModal
│   ├── contexts/              # AuthContext
│   ├── hooks/                 # useRemainingTime
│   ├── pages/                 # LoginPage, RoomListPage, CreateRoomPage, RoomPage
│   ├── services/              # firebase, auth, rooms, votes, menu
│   ├── test/                  # 테스트 setup
│   ├── types/                 # TypeScript 타입 정의
│   ├── App.tsx
│   └── main.tsx
├── .github/workflows/         # deploy.yml, crawl-menus.yml
├── firestore.rules
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 페이지 라우팅

| 경로 | 페이지 | 인증 필요 |
|------|--------|-----------|
| `/` | 방 목록으로 리다이렉트 | O |
| `/rooms` | 방 목록 | O |
| `/rooms/new` | 방 생성 | O |
| `/rooms/:id` | 투표 + 결과 | O |
