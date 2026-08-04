/** 파서 공통 유틸 */

export function absoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/** "[123]", "(45)", "45" 등에서 숫자만 */
export function parseCount(text: string | undefined): number {
  if (!text) return 0;
  const m = text.match(/(\d[\d,]*)/);
  return m ? Number(m[1].replace(/,/g, '')) : 0;
}

/**
 * 커뮤니티 목록의 시간 표기 파싱
 *  "14:32"        → 오늘 14:32 (미래면 어제로 보정)
 *  "25/08/02"     → 2025-08-02
 *  "08-02"        → 올해 08-02
 *  "3분 전"       → now - 3분
 */
export function parseKoreanDate(text: string | undefined): Date {
  const now = new Date();
  if (!text) return now;
  const t = text.trim();

  const rel = t.match(/(\d+)\s*(분|시간|일)\s*전/);
  if (rel) {
    const n = Number(rel[1]);
    const ms = rel[2] === '분' ? 60_000 : rel[2] === '시간' ? 3_600_000 : 86_400_000;
    return new Date(now.getTime() - n * ms);
  }

  const hm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const d = new Date(now);
    d.setHours(Number(hm[1]), Number(hm[2]), 0, 0);
    if (d > now) d.setDate(d.getDate() - 1); // 자정 넘김 보정
    return d;
  }

  const ymd = t.match(/(\d{2,4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    return new Date(y < 100 ? 2000 + y : y, Number(ymd[2]) - 1, Number(ymd[3]));
  }

  const md = t.match(/^(\d{1,2})[.\-/](\d{1,2})$/);
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
