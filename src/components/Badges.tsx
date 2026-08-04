'use client';

import Link from 'next/link';
import type { DealStatus } from '@/lib/types';

export function SourceBadge({
  id, name, color,
}: {
  id: string;
  name: string;
  color?: string | null;
}) {
  return (
    <Link
      href={`/source/${id}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium
                 transition-opacity hover:opacity-70"
      style={{ color: color ?? undefined }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color ?? 'currentColor' }}
        aria-hidden
      />
      {name}
    </Link>
  );
}

export function StatusBadge({ status }: { status: DealStatus }) {
  if (status === 'normal') return null;
  const styles =
    status === 'soldout'
      ? 'bg-slate-500/15 text-slate-500 dark:text-slate-400'
      : 'bg-slate-400/10 text-slate-400';
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {status === 'soldout' ? '품절' : '종료'}
    </span>
  );
}

export function FreeShipBadge() {
  return (
    <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
      무료배송
    </span>
  );
}

export function HotBadge() {
  return (
    <span className="rounded bg-accent/12 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
      HOT
    </span>
  );
}
