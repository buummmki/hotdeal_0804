# 핫딜모아 — 실시간 특가 집계 웹앱

Next.js 15 (App Router) + Supabase(Postgres) + Vercel 기준으로 구현한 핫딜 집계 서비스입니다.
설계서(`algumon-reference-structure.md`)의 IA·데이터 모델·랭킹 로직·수집 파이프라인을 실제 코드로 옮겼습니다.

**Supabase 키가 없어도 바로 실행됩니다.** 키가 없으면 샘플 딜 40건으로 화면이 렌더링되고,
`.env.local`에 키를 넣는 순간 자동으로 실제 DB로 전환됩니다.

---

## 1. 바로 실행해서 화면 보기

```bash
npm install
npm run dev
```

→ http://localhost:3000

상단에 "샘플 데이터로 표시 중" 배너가 뜨면 정상입니다.

---

## 2. Supabase 키 어디서 찾나요

**General settings 페이지에는 키가 없습니다.** 별도 페이지입니다.

가장 빠른 방법은 대시보드 상단의 **Connect** 버튼입니다. Project URL과 키가 한 화면에 나옵니다.

개별로 찾으려면 **Settings → API Keys** (General 바로 아래 항목이 아니라 `Configuration` 그룹 안):

```
https://supabase.com/dashboard/project/<프로젝트ID>/settings/api-keys
```

3가지를 복사합니다.

| 대시보드 표기 | 넣을 환경변수 | 성격 |
|---|---|---|
| **Project URL** (Connect 다이얼로그 또는 Settings → Data API) | `NEXT_PUBLIC_SUPABASE_URL` | 공개 |
| **Publishable key** (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 (브라우저 노출 OK) |
| **Secret key** (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` | **비밀 — 절대 노출 금지** |

> **키 체계가 바뀌었습니다.** 기존 JWT 형식 `anon` / `service_role` 키는 **2026년 말 지원 종료**
> 예정이고, 새 형식인 `sb_publishable_...` / `sb_secret_...` 이 후속입니다. 지금 시작한다면
> 새 형식을 쓰세요. API Keys 탭에 publishable 키가 없으면 **Create new API Keys**를 누르면 됩니다.
> 레거시 키는 같은 페이지의 **Legacy API Keys** 탭에 있고, 둘은 동시에 작동합니다.
>
> 환경변수 이름은 편의상 기존 이름을 그대로 뒀습니다. 어떤 형식의 키를 넣든 코드는 동일하게 동작합니다.
>
> **secret 키는 RLS를 전부 우회**합니다. 서버(크롤러·관리자 API)에서만 쓰고 깃에 커밋하지 마세요.
> 참고로 secret 키는 브라우저 User-Agent가 감지되면 Supabase가 401로 거부하므로, 실수로
> 클라이언트에 넣으면 조용히 새는 게 아니라 바로 실패합니다.

`.env.example`을 복사해 `.env.local`을 만들고 채웁니다.

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxx
CRON_SECRET=아무거나-긴-랜덤-문자열
ADMIN_PASSWORD=관리자-비밀번호
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 리전 메모

현재 프로젝트는 **South Asia (Mumbai, `ap-south-1`)** 입니다. 개발·테스트 단계에서는 문제
없지만, 한국 사용자 대상으로 정식 오픈할 때는 서울(`ap-northeast-2`)로 옮기는 것을 검토하세요.
딜 목록은 페이지마다 여러 쿼리를 날리므로 왕복 지연이 그대로 누적됩니다.

리전은 생성 후 변경할 수 없어서, 옮기려면 서울 리전에 새 프로젝트를 만들고 백업을 복원하는
(Restore to a new project) 절차를 거칩니다. 데이터가 쌓이기 전일수록 비용이 적습니다.

**성능이 답답하게 느껴지면 리전부터 의심하세요.** 쿼리나 인덱스 문제로 오해하기 쉬운 지점입니다.

---

## 3. DB 만들기

Supabase 대시보드 → **SQL Editor** → **New query**에 아래 순서로 붙여넣고 **Run**.

1. `supabase/01_schema.sql` — 테이블, 인덱스, RLS, 랭킹 함수
2. `supabase/02_seed.sql` — 출처 5곳 + 샘플 딜 40건

`npm run dev`를 재시작하면 배너가 사라지고 실제 DB에서 읽습니다.

### 만들어지는 것

| 테이블 | 역할 |
|---|---|
| `source` | 수집 출처와 크롤링 주기, 카테고리 매핑 |
| `deal` | 딜 본체. 랭킹 점수 컬럼 포함 |
| `comment_snapshot` | 시점별 댓글 수 (반응 추이 분석용) |
| `crawl_log` | 수집 성공/실패 이력 |

| 함수 | 역할 |
|---|---|
| `compute_rank_scores()` | 전체 랭킹 점수 재계산 |
| `find_duplicates(deal_id)` | pg_trgm 유사도 기반 중복 후보 |
| `normalize_title(text)` | 말머리·특수문자 제거 정규화 |
| `search_deals(...)` | 제목+요약 검색 RPC |

**RLS 정책**: 익명 사용자는 `is_hidden = false`인 딜만 읽을 수 있고, 쓰기는 전부 차단됩니다.
`crawl_log`는 정책 자체가 없어 익명 접근이 완전히 막힙니다.

---

## 4. 랭킹 로직

```
rank_score = 반응 × 0.5 + 조회 × 0.2 + 신선도 × 0.2 + 품질 × 0.1 + 운영보정
```

- **신선도**: 24시간 반감기 지수 감쇠 `100 × exp(-0.0289 × 경과시간)`
- **반응**: `ln(1 + 댓글수) × 22` (상한 100) — 댓글 폭증 딜이 과점하지 않게 로그 스케일
- **품질**: 가격 40 + 이미지 30 + 요약 15 + 배송비 15
- **감점**: 품절 −30, 종료 −60
- **운영 보정**: 관리자가 상단 고정하면 +200

계수는 `supabase/01_schema.sql`의 `compute_rank_scores()`에서 조정하세요.
프론트 폴백(`src/lib/mock.ts`)도 같은 공식을 씁니다.

---

## 5. 크롤러

### 셀렉터 검증이 먼저입니다

`src/crawler/parsers/*.ts`의 CSS 셀렉터는 각 커뮤니티의 일반적인 마크업을 기준으로 쓴 **골격**입니다.
사이트는 예고 없이 HTML을 바꾸므로 **실제 수집 전에 반드시 검증**하세요.

```bash
npx tsx src/crawler/inspect.ts ppomppu
```

- 파싱된 항목과 정규화 결과 상위 5건을 출력합니다.
- **0건이 나오면** 해당 사이트의 목록 페이지를 브라우저 개발자 도구로 열어
  `SELECTORS` 상수를 실제 셀렉터로 교체하세요.

지원 대상: `ppomppu`, `ruliweb`, `clien`, `quasar`

### 수동 실행

```bash
npm run crawl            # 활성 소스 전체
npm run crawl ppomppu    # 특정 소스만
```

### 파이프라인

```
소스 순회 → HTML 수집(EUC-KR 자동 처리) → 파싱 → 정규화 → 중복 판별
  → 신규 insert / 기존 반응수치 update → 스냅샷 기록 → 랭킹 재계산 → 로그
```

**정규화**가 처리하는 것 (`src/crawler/normalize.ts`):

- 가격: `(198,000원/무료)` → `price_text='198,000원'`, `price_value=198000`
- 배송비: 괄호 안 `/` 뒤쪽을 배송비로 해석
- 카테고리: `source.category_map` 우선, 실패 시 제목 키워드 규칙 7종
- 태그: 대괄호 말머리 + 브랜드명 추출
- 상태: 제목에 "품절/마감/종료"가 있으면 자동 판정

**중복 판별** 2단계:

1. `(source_id, external_id)` DB 유니크 제약 — 같은 출처 재수집
2. 3-gram 자카드 유사도 0.62 이상 + 48시간 이내 + 가격 일치 — 교차 출처 중복

### 자동 실행 (Vercel Cron)

`vercel.json`에 이미 설정되어 있습니다.

```json
{ "crons": [
  { "path": "/api/cron/crawl",   "schedule": "*/10 * * * *" },
  { "path": "/api/cron/rescore", "schedule": "*/5 * * * *" }
]}
```

두 라우트 모두 `Authorization: Bearer $CRON_SECRET` 헤더를 검사합니다.
Vercel Cron은 이 헤더를 자동으로 붙여 보냅니다.

> **Hobby 플랜 주의**: Cron은 하루 최대 2회까지만 실행되고 함수 실행 시간은 60초입니다.
> 10분 주기로 돌리려면 Pro 플랜이 필요합니다. 무료로 유지하려면
> GitHub Actions의 `schedule` 워크플로에서 위 엔드포인트를 호출하거나
> Supabase `pg_cron` + Edge Function으로 옮기세요.

---

## 6. 관리자

`/admin` → `ADMIN_PASSWORD` 입력.

- 소스별 수집 on/off, 마지막 수집 시각
- 최근 수집 로그 20건 (발견/신규/갱신/스킵, 실패 메시지)
- 검수 대기 / 가격 미인식 / 숨김 처리 필터
- 딜별 카테고리 보정, 상태 변경, 상단 고정, 숨김, 검수 완료
- 랭킹 수동 재계산

### ⚠️ 관리자 인증 강화 (실서비스 전 필수)

현재는 단일 비밀번호를 헤더로 보내는 방식입니다. MVP 검증용으로는 충분하지만,
실서비스 전에는 아래로 교체하세요.

1. Supabase Auth로 관리자 계정 생성
2. `profiles` 테이블에 `role` 컬럼 추가
3. `deal`/`source`에 `role = 'admin'` 조건의 쓰기 RLS 정책 추가
4. `/api/admin`에서 세션 JWT 검증으로 전환하고 `service_role` 키 사용 중단

---

## 7. 배포

```bash
git init && git add . && git commit -m "init"
# GitHub에 푸시 후 Vercel에서 Import
```

Vercel → **Settings → Environment Variables**에 `.env.local`의 5개 값을 모두 등록합니다.
`NEXT_PUBLIC_SITE_URL`은 실제 도메인으로 바꾸세요 (sitemap·OG 태그에 쓰입니다).

---

## 8. 라우트

| 경로 | 설명 |
|---|---|
| `/` | 메인 랭킹. `?cat=pc&sort=latest&page=2` |
| `/deal/[id]` | 딜 상세. 개별 메타태그 + JSON-LD Product |
| `/search?q=` | 검색 (카테고리·정렬 병행 필터) |
| `/source` | 출처 목록 |
| `/source/[id]` | 출처별 모아보기 |
| `/admin` | 관리자 |
| `/guide`, `/privacy` | 정책 페이지 |
| `/sitemap.xml`, `/robots.txt` | 자동 생성 |

### SEO 처리

- 딜 상세마다 title/description/canonical 분리
- **품절·종료 딜은 `noindex`** (설계서의 "품절 페이지 인덱싱 정책")
- 검색 결과 페이지 `noindex` + robots.txt `Disallow: /search`
- JSON-LD `Product` + `Offer` (재고 상태 반영)
- sitemap에 카테고리·출처·딜 상세 최대 1000건

---

## 9. 법적 체크리스트 — 공개 전 확인

크롤링 서비스라 화면보다 이쪽이 실제 리스크입니다.

- [ ] 각 사이트 `robots.txt`와 이용약관 확인. 명시적으로 금지한 곳은 소스에서 제외
- [ ] 제목·링크·가격 같은 **사실 정보만** 수집. 본문 전문 복제 금지 (현재 코드는 제목만 저장)
- [ ] User-Agent에 연락 가능한 주소 명시 (`src/crawler/pipeline.ts`의 `UA` 상수를 실제 값으로 교체)
- [ ] 요청 간격 유지 (기본 1.5초, `POLITE_DELAY_MS`)
- [ ] 중단 요청 수신 시 즉시 `is_active = false` 처리할 연락 창구 마련
- [ ] `/guide`, `/privacy`의 플레이스홀더를 실제 운영 주체·연락처로 교체
- [ ] 제휴 링크를 붙인다면 대가성 표시 (표시광고법)

---

## 10. 구조

```
src/
├─ app/
│  ├─ page.tsx                 메인 랭킹
│  ├─ deal/[id]/page.tsx       상세 + 메타 + JSON-LD
│  ├─ search/page.tsx          검색
│  ├─ source/[id]/page.tsx     출처별
│  ├─ admin/page.tsx           관리자
│  ├─ api/cron/crawl           수집 크론
│  ├─ api/cron/rescore         점수 재계산 크론
│  ├─ api/admin                관리자 액션
│  ├─ sitemap.ts, robots.ts
│  └─ guide, privacy, error, not-found
├─ components/
│  ├─ Header, DealCard, Badges, Tabs, Sidebar, Pagination, MockNotice
├─ lib/
│  ├─ supabase.ts   공개/서비스 클라이언트
│  ├─ queries.ts    쿼리 레이어 (Supabase ↔ mock 자동 전환)
│  ├─ types.ts      타입 + 카테고리/정렬 정의
│  ├─ format.ts     상대시간·가격 포맷
│  └─ mock.ts       폴백 샘플 데이터
└─ crawler/
   ├─ pipeline.ts   수집 → 정규화 → 중복판별 → 저장
   ├─ normalize.ts  가격·배송비·카테고리·태그 추출
   ├─ inspect.ts    셀렉터 검증 도구
   ├─ run.ts        수동 실행
   └─ parsers/      출처별 파서
```

---

## 11. 다음 단계 (설계서 2차 확장)

우선순위 순.

1. **셀렉터 검증 + 실수집** — `inspect.ts`로 4개 소스 확인 후 크론 활성화
2. **품절 자동 감지** — 상세 페이지 주기 재방문, `comment_snapshot` 증가 정체 감지
3. **관리자 인증 강화** — Supabase Auth 전환 (위 6절)
4. **키워드 알림** — `keyword_alert` 테이블 + 텔레그램 Bot API
5. **회원 관심 카테고리** — Supabase Auth + `user_preference`
6. **출처별 신뢰도 점수** — 삭제율·품절율 기반, `rank_score`에 반영
7. **인기 키워드 차트** — `deal.tags` 집계

---

## 검증 상태

- ✅ `tsc --noEmit` 통과
- ✅ `next build` 성공 (11개 페이지 생성)
- ✅ `/`, `/search`, `/source/[id]`, `/deal/[id]`, `/robots.txt` 런타임 렌더링 확인 (mock 모드)
- ⬜ 실제 Supabase 연결 — 키 입력 후 확인 필요
- ⬜ 크롤러 셀렉터 — 실제 사이트로 검증 필요 (`inspect.ts`)

> Next.js는 15.5.22를 사용합니다. 14.2.15에는 공개된 보안 취약점이 있어 패치된 라인으로 올렸습니다.
