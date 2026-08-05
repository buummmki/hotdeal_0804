import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseViewCount, parseKoreanDate, cleanText, dedupeById } from './helpers';

/**
 * 퀘이사존 지름/할인정보 게시판 파서
 * 목록 URL: https://quasarzone.com/bbs/qb_saleinfo
 *
 * ⚠️ 이 사이트는 Node 내장 fetch(undici) 요청을 헤더와 무관하게 403 으로 막습니다.
 *    ../http.ts 의 HTTP/2 클라이언트를 써야 200 이 옵니다.
 *
 * 실제 마크업 (2026-08 확인):
 *   <div class="market-info-list">
 *     <div class="thumb-wrap"><a class="thumb"><img class="maxImg" src="..."></a></div>
 *     <div class="market-info-list-cont">
 *       <p class="tit">
 *         <span class="label">진행중</span>
 *         <a class="subject-link" href="/bbs/qb_saleinfo/views/1975223">
 *           <span class="ellipsis-with-reply-cnt">제목</span>
 *           <span class="board-list-comment"><span class="ctn-count">1</span></span>
 *         </a>
 *       </p>
 *       <div class="market-info-sub">
 *         <p><span class="category">가전/TV</span>
 *            <span>가격 <span class="text-orange">￦ 990,000 (KRW)</span></span>
 *            <span>배송비 무료</span></p>
 *         <p>...<span class="count">553</span><span class="date">54분 전</span></p>
 *       </div>
 *     </div>
 *   </div>
 *
 * 주의) 썸네일까지 잡으려면 row 는 .market-info-list-cont 가 아니라 .market-info-list 여야 합니다.
 *      또 span.count 는 조회수이므로 댓글수로 쓰면 안 됩니다 (span.ctn-count 가 댓글).
 */
const SELECTORS = {
  row: 'div.market-info-list',
  titleLink: 'a.subject-link',
  titleText: '.ellipsis-with-reply-cnt',
  comment: 'span.ctn-count',
  date: '.market-info-sub .date',
  label: 'p.tit span.label',
  category: '.market-info-sub .category',
  price: '.market-info-sub .text-orange',
  thumb: '.thumb-wrap img.maxImg, .thumb-wrap img',
  views: '.market-info-sub .count',
};

export const quasar: Parser = {
  id: 'quasar',
  name: '퀘이사존',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);
      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href');
      const title = cleanText(link.find(SELECTORS.titleText).text()) || cleanText(link.text());
      if (!href || !title || title.length < 4) return;
      if (/블라인드\s*처리된\s*글/.test(title)) return; // 신고 누적으로 가려진 글

      const externalId = href.match(/views\/(\d+)/)?.[1] ?? href.match(/(\d+)\/?$/)?.[1];
      if (!externalId) return;

      const label = cleanText(row.find(SELECTORS.label).first().text());
      const priceText = cleanText(row.find(SELECTORS.price).first().text());

      // "배송비 무료" 처럼 배송비만 따로 노출됨
      const shippingText = row
        .find('.market-info-sub p')
        .first()
        .find('span')
        .filter((_, s) => /^배송비/.test(cleanText($(s).text())))
        .first()
        .text()
        .replace(/^\s*배송비\s*/, '')
        .trim();

      const thumb = row.find(SELECTORS.thumb).first().attr('src');

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        rawCategory: cleanText(row.find(SELECTORS.category).first().text()) || undefined,
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        viewCount: parseViewCount(row.find(SELECTORS.views).first().text()),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        imageUrl: thumb && !thumb.startsWith('data:') ? absoluteUrl(thumb, baseUrl) : undefined,
        soldout: /종료|품절|마감/.test(label),
        priceText: priceText || undefined,
        shippingText: shippingText || undefined,
      });
    });

    return dedupeById(items);
  },
};
