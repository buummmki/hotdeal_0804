export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export function formatPrice(text: string | null, value: number | null): string {
  if (text) return text;
  if (value === 0) return '무료';
  if (value != null) return `${value.toLocaleString('ko-KR')}원`;
  return '가격 미표기';
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export const STATUS_LABEL: Record<string, string> = {
  normal: '',
  soldout: '품절',
  expired: '종료',
};
