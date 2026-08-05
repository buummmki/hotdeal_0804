import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /search 는 여기서 막지 않습니다.
        //  - 페이지 자체에 noindex 메타가 이미 걸려 있는데, robots.txt 로 접근까지
        //    막으면 크롤러가 그 메타를 읽지 못해 오히려 색인될 수 있습니다.
        //  - 구조화 데이터의 SearchAction 대상 URL 이기도 해서 접근 가능해야 합니다.
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
