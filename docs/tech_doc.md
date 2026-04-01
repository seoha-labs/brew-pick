# Brew Pick - Technical Document

## 주요 기술적 결정 사항

### 1. GitHub Pages + Firebase 조합

GitHub Pages는 정적 파일만 호스팅하므로 서버 로직이 필요한 부분은 Firebase로 해결한다.

| 역할 | 담당 |
|------|------|
| SPA 호스팅 | GitHub Pages |
| DB | Firestore |
| 인증 | Firebase Auth (Google OAuth, @ten1010.io 제한) |
| 크롤링 | GitHub Actions (빌드 시 실행, JSON 정적 파일) |

**주의**: GitHub Pages는 SPA 라우팅을 네이티브 지원하지 않는다.
→ `404.html`에 리다이렉트 스크립트를 넣거나, HashRouter를 사용한다.
→ 간단함을 위해 **HashRouter** 사용 권장.

### 2. Google OAuth + 도메인 제한

Firebase Auth가 Google OAuth를 네이티브 지원하므로 서버 로직이 불필요하다.

```typescript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const ALLOWED_DOMAIN = 'ten1010.io';

const login = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // 회사 도메인 계정만 힌트로 표시
  provider.setCustomParameters({ hd: ALLOWED_DOMAIN });

  const result = await signInWithPopup(auth, provider);
  const email = result.user.email ?? '';

  // 클라이언트 도메인 검증
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await auth.signOut();
    throw new Error('회사 계정(@ten1010.io)으로만 로그인 가능합니다.');
  }
};
```

Firestore Security Rules에서도 이중 검증:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAllowedDomain() {
      return request.auth != null
        && request.auth.token.email.matches('.*@ten1010\\.io$');
    }

    match /rooms/{roomId} {
      allow read: if isAllowedDomain();
      allow create: if isAllowedDomain();
      allow update: if isAllowedDomain()
        && resource.data.creatorId == request.auth.uid;

      match /votes/{voteId} {
        allow read: if isAllowedDomain();
        allow write: if isAllowedDomain()
          && voteId == request.auth.uid;
      }
    }
  }
}
```

### 3. 12시간 유효시간 처리

배치 삭제 대신 쿼리 시점에 필터링:

```typescript
// Firestore 쿼리
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

const activeRooms = query(
  collection(db, 'rooms'),
  where('createdAt', '>', Timestamp.fromDate(twelveHoursAgo)),
  orderBy('createdAt', 'desc')
);
```

투표 가능 여부 판단:
```typescript
const canVote = (room: Room): boolean => {
  if (room.isClosed) return false;
  const elapsed = Date.now() - room.createdAt.toMillis();
  return elapsed < 12 * 60 * 60 * 1000;
};
```

### 4. 1인 1표 보장

Firestore 문서 ID를 사용자 UID로 설정하면 자연스럽게 1인 1표가 보장된다:

```typescript
// votes 서브컬렉션에서 문서 ID = userId
await setDoc(
  doc(db, 'rooms', roomId, 'votes', userId),
  { userId, userName, menuItemId, menuItemName, votedAt: serverTimestamp() }
);
```
- 같은 사용자가 다시 투표하면 `setDoc`이 기존 문서를 덮어쓰므로 투표 변경도 자연스럽게 처리됨.

### 5. 비밀번호 처리

Cloud Function에서 해시하여 저장하는 것이 이상적이나, 간단한 MVP이므로:
- 방 생성 시 비밀번호를 Firestore에 평문으로 저장 (내부용 도구이므로)
- 방 입장 시 클라이언트에서 비교
- Firestore Security Rules로 비밀번호 필드는 방장만 읽기 가능하도록 제한

> 추후 보안 강화가 필요하면 Cloud Function을 통한 해시 비교로 전환

### 6. 메뉴 크롤링 (GitHub Actions)

Cloud Functions 대신 GitHub Actions에서 Node.js 스크립트로 크롤링한다.
결과는 `public/data/` 하위에 JSON 파일로 저장되어 빌드 시 정적 파일로 포함된다.

```yaml
# .github/workflows/crawl-menus.yml
on:
  workflow_dispatch:        # 수동 트리거
  schedule:
    - cron: '0 0 * * 1'    # 매주 월요일 실행

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx ts-node scripts/crawl-menus.ts
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update menu data'
          file_pattern: 'public/data/*.json'
```

앱에서는 정적 JSON을 fetch:
```typescript
const loadMenu = async (franchiseId: string): Promise<MenuItem[]> => {
  const res = await fetch(`/data/${franchiseId}.json`);
  return res.json();
};
```

크롤링 대상:

#### 이디야 (`https://ediya.com/contents/drink.html`)
- AJAX 기반 페이지네이션 구조
- "더보기+" 버튼이 `show_more()` → `/inc/ajax_brand.php` 호출
- 파라미터: `gubun=menu_more`, `product_cate` (카테고리), `page` (페이지)
- 카테고리 필터: `change_cate()` 함수, 체크박스 `name='chkList'`
- 이미지 경로: `/files/menu/` 하위
- **크롤링 전략**: `ajax_brand.php`를 page 파라미터 증가시키며 반복 호출, 빈 응답이 올 때까지 수집

```typescript
// 이디야 크롤링 예시
const crawlEdiya = async (): Promise<MenuItem[]> => {
  const items: MenuItem[] = [];
  let page = 1;

  while (true) {
    const res = await fetch('https://ediya.com/inc/ajax_brand.php', {
      method: 'POST',
      body: new URLSearchParams({
        gubun: 'menu_more',
        product_cate: '7', // 음료 카테고리
        page: String(page),
      }),
    });
    const html = await res.text();
    if (!html.trim()) break;

    // cheerio로 HTML 파싱하여 메뉴명, 이미지 추출
    const parsed = parseEdiyaHtml(html);
    items.push(...parsed);
    page++;
  }

  return items;
};
```

#### 투썸플레이스 (`https://mo.twosome.co.kr/mn/menuInfoList.do`)
- AJAX JSON API 구조
- 탭 전환 시 `POST /mn/menuInfoListAjax.json` 호출
- 파라미터: `grtCd` (대분류), `midCd` (소분류), `pageNum` (페이지)
- 수집 대상 탭: NEW, 커피, 음료, 티/티라떼
- 메뉴 항목 구조: `menu-title`, 이미지 CDN `https://mcdn.twosome.co.kr`
- **크롤링 전략**: 대상 `grtCd` 목록을 순회하며 JSON API 호출, 무한스크롤 방식이므로 pageNum 증가시키며 수집

```typescript
// 투썸플레이스 크롤링 예시
const TWOSOME_TABS = [
  { grtCd: 'NEW', name: 'NEW' },
  { grtCd: '1', name: '커피' },
  { grtCd: '2', name: '음료' },
  { grtCd: '3', name: '티/티라떼' },
];

const crawlTwosome = async (): Promise<MenuItem[]> => {
  const items: MenuItem[] = [];

  for (const tab of TWOSOME_TABS) {
    let pageNum = 1;

    while (true) {
      const res = await fetch(
        'https://mo.twosome.co.kr/mn/menuInfoListAjax.json',
        {
          method: 'POST',
          body: new URLSearchParams({
            grtCd: tab.grtCd,
            pageNum: String(pageNum),
          }),
        }
      );
      const data = await res.json();
      if (!data.menuList?.length) break;

      items.push(
        ...data.menuList.map((m: any) => ({
          name: m.menuNm,
          category: tab.name,
          imageUrl: `https://mcdn.twosome.co.kr${m.imgPath}`,
        }))
      );
      pageNum++;
    }
  }

  return items;
};

### 7. 실시간 업데이트

Firestore `onSnapshot`을 활용하여 투표 현황을 실시간으로 반영:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'rooms', roomId, 'votes'),
    (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data() as Vote);
      setVotes(votes);
    }
  );
  return unsubscribe;
}, [roomId]);
```

### 8. GitHub Pages 배포

GitHub Actions를 사용한 자동 배포:

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```
