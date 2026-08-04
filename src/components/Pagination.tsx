import Link from 'next/link';

export default function Pagination({
  page, total, perPage, basePath, query,
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const window = 2;
  const start = Math.max(1, page - window);
  const end = Math.min(pages, page + window);
  const items = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn =
    'min-w-9 rounded-lg border border-line px-3 py-2 text-center text-sm transition-colors hover:border-accent/50';

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="페이지">
      {page > 1 && <Link href={href(page - 1)} className={`${btn} text-muted`}>이전</Link>}
      {start > 1 && (
        <>
          <Link href={href(1)} className={`${btn} tnum text-muted`}>1</Link>
          {start > 2 && <span className="px-1 text-muted">…</span>}
        </>
      )}
      {items.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${btn} tnum ${
            p === page ? 'border-accent bg-accent font-semibold text-white' : 'text-muted'
          }`}
        >
          {p}
        </Link>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-muted">…</span>}
          <Link href={href(pages)} className={`${btn} tnum text-muted`}>{pages}</Link>
        </>
      )}
      {page < pages && <Link href={href(page + 1)} className={`${btn} text-muted`}>다음</Link>}
    </nav>
  );
}
