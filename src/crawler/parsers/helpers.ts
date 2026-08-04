/** 파서 공통 유틸 */

export function absoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/** "[123]", "(45)", "댓글5개", "45" 등에서 숫자만 */
export function parseCount(text: string | undefined): number {
  if (!text) return 0;
  const m = text.match(/(\d[\d,]*)/);
  return m ? Number(m[1].replace(/,/g, '')) : 0;
}

/**
 * 커뮤니티 목록의 시간 표기 파싱.
 *
 *  "2026-08-04 07:35:40" → 그대로 (시각 보존)
 *  "26.08.04 14:19:27"   → 2026-08-04 14:19:27
 *  "14:19:27" / "14:19"  → 오늘 그 시각 (미래면 어제로 보정)
 *  "08-04"               → 올해 08-04 (미래면 작년)
 *  "3분 전" / "2시간 전"  → now - n
 *  "방금"                → now
 */
export function parseKoreanDate(text: string | undefined): Date {
  const now = new Date();
  if (!text) return now;
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return now;

  // 방금 / 조금 전
  if (/^(방금|지금|조금\s*전)/.test(t)) return now;

  // n분 전 / n시간 전 / n일 전
  const rel = t.match(/(\d+)\s*(초|분|시간|일|주)\s*전/);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2];
    const ms =
      unit === '초' ? 1_000 :
      unit === '분' ? 60_000 :
      unit === '시간' ? 3_600_000 :
      unit === '일' ? 86_400_000 :
      604_800_000; // 주
    return new Date(now.getTime() - n * ms);
  }

  // 날짜 + 시각 (구분자 . - / 모두 허용)
  const full = t.match(
    /(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (full) {
    const y = Number(full[1]);
    return new Date(
      y < 100 ? 2000 + y : y,
      Number(full[2]) - 1,
      Number(full[3]),
      Number(full[4]),
      Number(full[5]),
      Number(full[6] ?? 0)
    );
  }

  // 시각만: HH:MM 또는 HH:MM:SS
  const hm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hm) {
    const d = new Date(now);
    d.setHours(Number(hm[1]), Number(hm[2]), Number(hm[3] ?? 0), 0);
    if (d.getTime() > now.getTime() + 60_000) d.setDate(d.getDate() - 1); // 자정 넘김 보정
    return d;
  }

  // 날짜만: YY.MM.DD / YYYY-MM-DD
  const ymd = t.match(/^(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (ymd) {
    const y = Number(ymd[1]);
    return new Date(y < 100 ? 2000 + y : y, Number(ymd[2]) - 1, Number(ymd[3]));
  }

  // 월일만: MM-DD / MM.DD
  const md = t.match(/^(\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (md) {
    const d = new Date(now.getFullYear(), Number(md[1]) - 1, Number(md[2]));
    if (d > now) d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  const parsed = new Date(t);
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}

export function cleanText(s: string | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

/** 같은 externalId 가 여러 번 나오는 목록(BEST 블록 등) 정리 */
export function dedupeById<T extends { externalId: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.externalId)) continue;
    seen.add(it.externalId);
    out.push(it);
  }
  return out;
}
