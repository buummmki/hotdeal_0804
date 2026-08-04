'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, categoryLabel } from '@/lib/types';
import type { DealWithSource, Source } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/format';

interface CrawlLog {
  id: number;
  source_id: string;
  status: string;
  found: number;
  inserted: number;
  updated: number;
  skipped: number;
  message: string | null;
  created_at: string;
}

const FILTERS = [
  { key: 'unreviewed', label: '검수 대기' },
  { key: 'noprice', label: '가격 미인식' },
  { key: 'hidden', label: '숨김 처리됨' },
];

export default function AdminPage() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState('unreviewed');
  const [deals, setDeals] = useState<DealWithSource[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (password: string, f: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin?filter=${f}`, {
          headers: { 'x-admin-password': password },
        });
        if (res.status === 401) {
          setError('비밀번호가 올바르지 않거나 ADMIN_PASSWORD 가 설정되지 않았습니다.');
          setAuthed(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setDeals(json.deals);
        setSources(json.sources);
        setLogs(json.logs);
        setAuthed(true);
        sessionStorage.setItem('adminpw', password);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    []
  );

  useEffect(() => {
    const saved = sessionStorage.getItem('adminpw');
    if (saved) {
      setPw(saved);
      load(saved, filter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify(body),
    });
    await load(pw, filter);
  };

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-lg font-bold">관리자</h1>
        <p className="mt-1 text-[13px] text-muted">
          <code className="rounded bg-line/50 px-1">.env.local</code> 의 ADMIN_PASSWORD 를
          입력하세요.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(pw, filter);
          }}
          className="mt-4 space-y-2"
        >
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '확인 중…' : '로그인'}
          </button>
        </form>
        {error && <p className="mt-3 text-[12px] text-accent">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">관리자</h1>
        <button
          onClick={() => act({ type: 'rescore' })}
          disabled={busy}
          className="rounded-lg border border-line px-3 py-2 text-[13px] hover:border-accent/50 disabled:opacity-50"
        >
          랭킹 재계산
        </button>
      </div>

      {/* 소스 상태 */}
      <section className="mt-5">
        <h2 className="mb-2 text-[14px] font-bold">수집 소스</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-line bg-card p-3"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">{s.name}</p>
                <p className="tnum text-[11px] text-muted">
                  {s.last_crawled_at ? `${timeAgo(s.last_crawled_at)} 수집` : '수집 이력 없음'} ·{' '}
                  {s.crawl_cycle}분 주기
                </p>
              </div>
              <button
                onClick={() => act({ type: 'source-active', id: s.id, value: !s.is_active })}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium ${
                  s.is_active
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-line/60 text-muted'
                }`}
              >
                {s.is_active ? '수집 중' : '중지'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 수집 로그 */}
      {logs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[14px] font-bold">최근 수집 로그</h2>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[560px] text-[12px]">
              <thead className="bg-line/30 text-muted">
                <tr>
                  {['시각', '소스', '상태', '발견', '신규', '갱신', '스킵', '메시지'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="tnum px-3 py-2 text-muted">{timeAgo(l.created_at)}</td>
                    <td className="px-3 py-2">{l.source_id}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          l.status === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : l.status === 'partial'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-accent'
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="tnum px-3 py-2">{l.found}</td>
                    <td className="tnum px-3 py-2">{l.inserted}</td>
                    <td className="tnum px-3 py-2">{l.updated}</td>
                    <td className="tnum px-3 py-2">{l.skipped}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-muted">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 딜 검수 */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <h2 className="mr-2 text-[14px] font-bold">딜 검수</h2>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); load(pw, f.key); }}
              className={`rounded-full px-3 py-1.5 text-[12px] ${
                filter === f.key ? 'bg-accent text-white' : 'border border-line text-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {deals.length === 0 ? (
          <p className="rounded-lg border border-line bg-card py-12 text-center text-[13px] text-muted">
            해당 항목이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {deals.map((d) => (
              <div key={d.id} className="rounded-lg border border-line bg-card p-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <span style={{ color: d.source?.color ?? undefined }}>{d.source?.name}</span>
                  <span className="tnum">{timeAgo(d.published_at)}</span>
                  <span className="tnum">댓글 {d.comment_count}</span>
                  <span className="tnum">점수 {d.rank_score}</span>
                  {d.is_hidden && <span className="text-accent">숨김</span>}
                  {d.is_pinned && <span className="text-accent">고정</span>}
                </div>

                <p className="mt-1 text-[14px] font-medium leading-snug">{d.title}</p>

                <p className="tnum mt-1 text-[13px] font-bold text-accent">
                  {formatPrice(d.price_text, d.price_value)}
                  {d.price_value === null && (
                    <span className="ml-2 text-[11px] font-normal text-amber-600 dark:text-amber-400">
                      가격 파싱 실패 — 파서 규칙 점검 필요
                    </span>
                  )}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <select
                    value={d.category}
                    onChange={(e) => act({ type: 'category', id: d.id, value: e.target.value })}
                    className="rounded-md border border-line bg-bg px-2 py-1.5 text-[12px]"
                  >
                    {CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </select>

                  <select
                    value={d.status}
                    onChange={(e) => act({ type: 'status', id: d.id, value: e.target.value })}
                    className="rounded-md border border-line bg-bg px-2 py-1.5 text-[12px]"
                  >
                    <option value="normal">판매 중</option>
                    <option value="soldout">품절</option>
                    <option value="expired">종료</option>
                  </select>

                  <button
                    onClick={() => act({ type: 'pin', id: d.id, value: !d.is_pinned })}
                    className="rounded-md border border-line px-2.5 py-1.5 text-[12px] hover:border-accent/50"
                  >
                    {d.is_pinned ? '고정 해제' : '상단 고정'}
                  </button>
                  <button
                    onClick={() => act({ type: 'hide', id: d.id, value: !d.is_hidden })}
                    className="rounded-md border border-line px-2.5 py-1.5 text-[12px] hover:border-accent/50"
                  >
                    {d.is_hidden ? '노출' : '숨김'}
                  </button>
                  <button
                    onClick={() => act({ type: 'review', id: d.id, value: true })}
                    className="rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white"
                  >
                    검수 완료
                  </button>
                  <Link
                    href={`/deal/${d.id}`}
                    target="_blank"
                    className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-muted hover:text-fg"
                  >
                    미리보기 ↗
                  </Link>
                  <a
                    href={d.source_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="rounded-md border border-line px-2.5 py-1.5 text-[12px] text-muted hover:text-fg"
                  >
                    원문 ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
        <strong>보안 안내</strong> — 이 관리자 화면은 단일 비밀번호로만 보호됩니다. 실서비스
        전환 시 Supabase Auth 기반 계정·역할 관리로 교체하세요. 자세한 내용은 README 의 &ldquo;관리자
        인증 강화&rdquo; 항목을 참고하세요.
      </p>
    </main>
  );
}
