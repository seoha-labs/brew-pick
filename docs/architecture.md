# Brew Pick - Architecture

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| Frontend | React + TypeScript | 요구사항 |
| 빌드 | Vite | 빠른 빌드, GitHub Pages 배포 용이 |
| 호스팅 | GitHub Pages | 요구사항 (정적 호스팅) |
| DB | Firebase Firestore | 요구사항 (서버리스, 실시간) |
| 인증 | Firebase Auth + Google OAuth | Google Workspace 도메인 제한 (@ten1010.io) |
| 크롤링 | GitHub Actions + Node.js 스크립트 | 빌드 시 크롤링 → JSON 정적 파일 |
| 스타일링 | CSS Modules 또는 Tailwind CSS | 가벼운 스타일링 |

## 시스템 구성도

```
┌─────────────────────────────────────────────┐
│              GitHub Pages                    │
│         (React SPA - Static)                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│              Firebase                         │
│                                               │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Auth        │  │  Firestore           │   │
│  │  (Google     │  │  - rooms             │   │
│  │   OAuth)     │  │  - votes             │   │
│  └─────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│              GitHub Actions                   │
│  - 메뉴 크롤링 스크립트 (빌드 시 실행)         │
│  - 결과를 public/data/*.json 으로 저장         │
│  - GitHub Pages 배포                          │
└──────────────────────────────────────────────┘
```

## Firestore 데이터 모델

### `rooms` 컬렉션
```typescript
interface Room {
  id: string;
  name: string;              // 방 이름 (예: "오늘의커피")
  creatorId: string;         // 방장 UID
  creatorName: string;       // 방장 이름
  franchiseId: string;       // 선택된 프랜차이즈 ID
  franchiseName: string;     // 프랜차이즈 이름
  password?: string;         // 비밀번호 (해시 저장, optional)
  isClosed: boolean;         // 투표 조기 종료 여부
  createdAt: Timestamp;      // 생성 시각 (12시간 유효 기준)
}
```

### `rooms/{roomId}/votes` 서브컬렉션
```typescript
interface Vote {
  id: string;                // 문서 ID = 사용자 UID (1인 1표 보장)
  userId: string;
  userName: string;
  menuItemId: string;        // 선택한 메뉴 ID
  menuItemName: string;      // 선택한 메뉴 이름
  temperature: 'ICE' | 'HOT'; // 아이스/핫 선택
  votedAt: Timestamp;
}
```

### 정적 데이터 (JSON 파일, Firestore 아님)

프랜차이즈 및 메뉴 데이터는 GitHub Actions에서 크롤링하여 정적 JSON으로 관리한다.

```typescript
// public/data/franchises.json
interface Franchise {
  id: string;
  name: string;              // "이디야", "투썸플레이스"
  logoUrl?: string;
}

// public/data/ediya.json, public/data/twosome.json
interface MenuItem {
  id: string;
  franchiseId: string;
  name: string;              // 음료 이름
  category?: string;         // 카테고리 (커피, 논커피 등)
  imageUrl?: string;         // 음료 이미지 URL
}
```

## 인증 플로우

```
1. 사용자가 "Google로 로그인" 클릭
2. Firebase Auth signInWithPopup(GoogleAuthProvider) 호출
3. Google 로그인 팝업 표시
4. 사용자 로그인 완료
5. 클라이언트에서 이메일 도메인 검증 (@ten1010.io)
6. 도메인 불일치 시 즉시 로그아웃 + 에러 메시지
7. 도메인 일치 시 로그인 완료, 방 목록으로 이동
```

- 서버 로직 불필요 (Firebase Auth가 Google OAuth를 네이티브 지원)
- 도메인 제한은 클라이언트 + Firestore Security Rules 양쪽에서 검증

## 크롤링 전략

- GitHub Actions에서 Node.js 스크립트로 실행
- 크롤링 결과를 `public/data/ediya.json`, `public/data/twosome.json`으로 저장
- 빌드 시 정적 파일로 포함되어 GitHub Pages에 배포
- 메뉴 갱신: GitHub Actions에서 수동 트리거 또는 주간 스케줄로 재크롤링

## 보안 규칙 (Firestore)

```
- rooms: @ten1010.io 도메인 인증된 사용자만 읽기/생성 가능
- rooms/{roomId}: 방장만 수정(종료) 가능
- rooms/{roomId}/votes: @ten1010.io 도메인 인증된 사용자만 읽기, 자기 투표만 생성/수정
```
