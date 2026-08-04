-- ============================================================
-- 핫딜 집계 웹앱 - 스키마
-- Supabase SQL Editor에 이 파일 전체를 붙여넣고 실행하세요.
-- ============================================================

create extension if not exists "pg_trgm";      -- 제목 유사도 기반 중복 판별
create extension if not exists "unaccent";     -- 검색 정규화

-- ------------------------------------------------------------
-- source : 수집 출처
-- ------------------------------------------------------------
create table if not exists public.source (
  id            text primary key,                       -- 'ppomppu', 'ruliweb' ...
  name          text not null,                          -- '뽐뿌'
  type          text not null default 'community'
                check (type in ('community','mall','affiliate')),
  base_url      text not null,
  list_url      text,                                   -- 실제 크롤링 진입 URL
  is_active     boolean not null default true,
  crawl_cycle   integer not null default 10,            -- 분
  category_map  jsonb not null default '{}'::jsonb,     -- {"컴퓨터":"pc", ...}
  color         text default '#64748b',                 -- 배지 색
  last_crawled_at timestamptz,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- deal : 수집된 딜
-- ------------------------------------------------------------
create table if not exists public.deal (
  id            uuid primary key default gen_random_uuid(),
  source_id     text not null references public.source(id) on delete cascade,
  source_url    text not null,
  external_id   text,                                   -- 원문 게시글 번호
  title         text not null,
  title_norm    text,                                   -- 중복 판별용 정규화 제목
  summary       text,
  price_text    text,                                   -- 원문 그대로 ('무료', '109,000원')
  price_value   numeric,                                -- 숫자 추출값 (정렬/필터용)
  currency      text default 'KRW',
  shipping_text text,
  shipping_free boolean,
  category      text not null default 'etc',
  tags          text[] not null default '{}',
  image_url     text,
  buy_url       text,                                   -- 실제 구매처 (있으면)
  comment_count integer not null default 0,
  reaction_score numeric not null default 0,
  view_score    numeric not null default 0,
  quality_score numeric not null default 0,
  freshness_score numeric not null default 0,
  rank_score    numeric not null default 0,
  admin_boost   numeric not null default 0,             -- 운영 보정 (+상단고정 / -강등)
  is_pinned     boolean not null default false,
  is_hidden     boolean not null default false,         -- 노출 제어
  is_reviewed   boolean not null default false,         -- 검수 완료 여부
  status        text not null default 'normal'
                check (status in ('normal','soldout','expired')),
  published_at  timestamptz not null default now(),
  collected_at  timestamptz not null default now(),
  checked_at    timestamptz,
  updated_at    timestamptz not null default now(),
  unique (source_id, external_id)
);

-- ------------------------------------------------------------
-- comment_snapshot : 시점별 반응 추이
-- ------------------------------------------------------------
create table if not exists public.comment_snapshot (
  id            bigserial primary key,
  deal_id       uuid not null references public.deal(id) on delete cascade,
  comment_count integer not null default 0,
  view_count    integer,
  checked_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- crawl_log : 수집 실패/재시도 추적
-- ------------------------------------------------------------
create table if not exists public.crawl_log (
  id          bigserial primary key,
  source_id   text references public.source(id) on delete cascade,
  status      text not null check (status in ('success','partial','failed')),
  found       integer not null default 0,
  inserted    integer not null default 0,
  updated     integer not null default 0,
  skipped     integer not null default 0,
  message     text,
  duration_ms integer,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 인덱스
-- ------------------------------------------------------------
create index if not exists deal_rank_idx      on public.deal (rank_score desc) where is_hidden = false;
create index if not exists deal_published_idx on public.deal (published_at desc) where is_hidden = false;
create index if not exists deal_comment_idx   on public.deal (comment_count desc) where is_hidden = false;
create index if not exists deal_category_idx  on public.deal (category, rank_score desc) where is_hidden = false;
create index if not exists deal_source_idx    on public.deal (source_id, published_at desc);
create index if not exists deal_status_idx    on public.deal (status);
create index if not exists deal_title_trgm    on public.deal using gin (title gin_trgm_ops);
create index if not exists deal_titlenorm_trgm on public.deal using gin (title_norm gin_trgm_ops);
create index if not exists snapshot_deal_idx  on public.comment_snapshot (deal_id, checked_at desc);

-- ------------------------------------------------------------
-- 제목 정규화 (중복 판별용)
--  - 대괄호 말머리, 공백, 특수문자, 가격 표기 제거
-- ------------------------------------------------------------
create or replace function public.normalize_title(t text)
returns text language sql immutable as $$
  select regexp_replace(
           lower(regexp_replace(coalesce(t,''), '\[[^\]]*\]', '', 'g')),
           '[^a-z0-9가-힣]', '', 'g');
$$;

-- ------------------------------------------------------------
-- 랭킹 점수 계산
--   rank_score = reaction*0.5 + view*0.2 + freshness*0.2 + quality*0.1 + admin_boost
--   freshness 는 24시간 반감기 지수 감쇠
-- ------------------------------------------------------------
create or replace function public.compute_rank_scores()
returns void language plpgsql as $$
begin
  update public.deal d set
    freshness_score = 100 * exp(-0.0289 * greatest(extract(epoch from (now() - d.published_at)) / 3600, 0)),
    reaction_score  = least(100, ln(1 + d.comment_count) * 22),
    quality_score   = (case when d.price_value is not null then 40 else 0 end)
                    + (case when d.image_url  is not null then 30 else 0 end)
                    + (case when d.summary    is not null then 15 else 0 end)
                    + (case when d.shipping_text is not null then 15 else 0 end)
  where d.is_hidden = false;

  update public.deal d set
    rank_score = round(
        d.reaction_score  * 0.5
      + d.view_score      * 0.2
      + d.freshness_score * 0.2
      + d.quality_score   * 0.1
      + d.admin_boost
      + (case when d.status = 'soldout' then -30
              when d.status = 'expired' then -60 else 0 end)
    , 2),
    updated_at = now()
  where d.is_hidden = false;
end;
$$;

-- ------------------------------------------------------------
-- 중복 후보 탐색 : 같은 제목 유사도 0.6 이상 + 48시간 이내
-- ------------------------------------------------------------
create or replace function public.find_duplicates(p_deal_id uuid, p_threshold real default 0.6)
returns table (id uuid, title text, source_id text, similarity real)
language sql stable as $$
  select d.id, d.title, d.source_id, similarity(d.title_norm, t.title_norm) as sim
  from public.deal d, (select title_norm, published_at from public.deal where id = p_deal_id) t
  where d.id <> p_deal_id
    and d.published_at between t.published_at - interval '48 hours'
                           and t.published_at + interval '48 hours'
    and similarity(d.title_norm, t.title_norm) >= p_threshold
  order by sim desc
  limit 20;
$$;

-- ------------------------------------------------------------
-- title_norm 자동 채우기
-- ------------------------------------------------------------
create or replace function public.deal_before_write()
returns trigger language plpgsql as $$
begin
  new.title_norm := public.normalize_title(new.title);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists deal_before_write_trg on public.deal;
create trigger deal_before_write_trg
  before insert or update of title on public.deal
  for each row execute function public.deal_before_write();

-- ------------------------------------------------------------
-- 검색 RPC (제목 + 요약, 카테고리 동시 필터)
-- ------------------------------------------------------------
create or replace function public.search_deals(
  p_query text,
  p_category text default null,
  p_limit int default 24,
  p_offset int default 0
)
returns setof public.deal language sql stable as $$
  select *
  from public.deal
  where is_hidden = false
    and (p_category is null or category = p_category)
    and (title ilike '%' || p_query || '%' or summary ilike '%' || p_query || '%')
  order by
    similarity(title, p_query) desc,
    rank_score desc
  limit p_limit offset p_offset;
$$;

-- ------------------------------------------------------------
-- RLS : 공개 읽기만 허용. 쓰기는 service_role 키로만.
-- ------------------------------------------------------------
alter table public.deal             enable row level security;
alter table public.source           enable row level security;
alter table public.comment_snapshot enable row level security;
alter table public.crawl_log        enable row level security;

drop policy if exists "public read deals" on public.deal;
create policy "public read deals" on public.deal
  for select using (is_hidden = false);

drop policy if exists "public read sources" on public.source;
create policy "public read sources" on public.source
  for select using (true);

drop policy if exists "public read snapshots" on public.comment_snapshot;
create policy "public read snapshots" on public.comment_snapshot
  for select using (true);

-- crawl_log 는 정책 없음 = 익명 접근 전면 차단 (service_role 만 접근)
