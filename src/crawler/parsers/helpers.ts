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
 * 조회수 파싱. "1314", "1.5k", "4.6 M", "12,345" 모두 지원.
 * 퀘이사존은 1000 이상을 "1.5k" 로, 클리앙은 "4.6 M" 으로 축약해 표기합니다.
 */
export function parseViewCount(text: string | undefined): number {
  if (!text) return 0;
  const t = text.replace(/\s+/g, '').toLowerCase();
  const m = t.match(/([\d,.]+)\s*([km])?/);
  if (!m) return 0;
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return 0;
  const mult = m[2] === 'm' ? 1_000_000 : m[2] === 'k' ? 1_000 : 1;
  return Math.round(n * mult);
}

const KST_OFFSET_MS = 9 * 3_600_000;

/**
 * KST 달력값(연·월·일·시·분·초)을 실제 시각(UTC 기준 Date)으로 변환.
 *
 * ⚠️ new Date(y, m, d, ...) 를 쓰면 안 됩니다. 그 생성자는 "실행 환경의 시간대"로
 *    해석하는데, 로컬은 KST 라 맞아 보이지만 Vercel 함수는 UTC 로 돌아서
 *    한국시간 게시글이 9시간 미래로 저장됩니다.
 */
function fromKst(y: number, month: number, day: number, h = 0, mi = 0, s = 0): Date {
  return new Date(Date.UTC(y, month - 1, day, h, mi, s) - KST_OFFSET_MS);
}

/** 지금을 KST 달력으로 본 연/월/일 */
function kstToday(now: Date) {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: k.getUTCFullYear(), month: k.getUTCMonth() + 1, day: k.getUTCDate() };
}

/**
 * 커뮤니티 목록의 시간 표기 파싱. 표기는 모두 한국시간(KST) 기준으로 해석합니다.
 *
 *  "2026-08-04 07:35:40" → 그대로 (시각 보존)
 *  "26.08.04 14:19:27"   → 2026-08-04 14:19:27 KST
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
    return fromKst(
      y < 100 ? 2000 + y : y,
      Number(full[2]),
      Number(full[3]),
      Number(full[4]),
      Number(full[5]),
      Number(full[6] ?? 0)
    );
  }

  // 시각만: HH:MM 또는 HH:MM:SS
  const hm = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hm) {
    const { y, month, day } = kstToday(now);
    let d = fromKst(y, month, day, Number(hm[1]), Number(hm[2]), Number(hm[3] ?? 0));
    // 아직 오지 않은 시각이면 어제 글
    if (d.getTime() > now.getTime() + 60_000) d = new Date(d.getTime() - 86_400_000);
    return d;
  }

  // 날짜만: YY.MM.DD / YYYY-MM-DD
  const ymd = t.match(/^(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (ymd) {
    const y = Number(ymd[1]);
    return fromKst(y < 100 ? 2000 + y : y, Number(ymd[2]), Number(ymd[3]));
  }

  // 월일만: MM-DD / MM.DD
  const md = t.match(/^(\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (md) {
    const { y } = kstToday(now);
    let d = fromKst(y, Number(md[1]), Number(md[2]));
    if (d > now) d = fromKst(y - 1, Number(md[1]), Number(md[2])); // 연말연시 보정
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
