import type { MetadataRoute } from 'next';
import { allDealIds, listSources } from '@/lib/queries';
import { CATEGORIES } from '@/lib/types';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const [deals, sources] = await Promise.all([allDealIds(1000), listSources()]);

  return [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    ...CATEGORIES.filter((c) => c.slug !== 'all').map((c) => ({
      url: `${base}/?cat=${c.slug}`,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
    ...sources.map((s) => ({
      url: `${base}/source/${s.id}`,
      changeFrequency: 'hourly' as const,
      priority: 0.6,
    })),
    ...deals.map((d) => ({
      url: `${base}/deal/${d.id}`,
      lastModified: new Date(d.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
  ];
}
