import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText } from './helpers';

/**
 * 뽐뿌 뽐뿌게시판 목록 파서
 * 목록 URL: https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu
 *
 * ⚠️ SELECTORS 는 반드시 실제 페이지로 검증 후 사용하세요.
 *    npx tsx src/crawler/inspect.ts ppomppu
 */
const SELECTORS = {
  row: 'tr.list0, tr.list1, tr.common-list-single, tr.baseList, #revolution_main_table tr',
  titleLink: 'a[href*="view.php?id=ppomppu"], a.baseList-title, td.baseList-space.title a',
  category: 'span.baseList-name, font.list_title, .baseList-small',
  comment: 'span.list_comment2, .baseList-c, span.baseList-rp',
  date: '.baseList-time, td.baseList-space.date, td[title*=":"]',
  thumb: 'img.thumb_border, img.baseList-thumb, td.baseList-space.title img',
};

export const ppomppu: Parser = {
  id: 'ppomppu',
  name: '뽐뿌',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);
      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href');
      const title = cleanText(link.text());
      if (!href || !title || title.length < 4) return;

      // no=123456 형태의 게시글 번호
      const externalId = href.match(/no=(\d+)/)?.[1];
      if (!externalId) return;

      // 공지/이벤트 행 제외
      if (row.find('img[alt*="공지"], .notice').length) return;

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        rawCategory: cleanText(row.find(SELECTORS.category).first().text()).replace(/[[\]]/g, '') || undefined,
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        imageUrl: (() => {
          const src = row.find(SELECTORS.thumb).first().attr('src');
          return src ? absoluteUrl(src, baseUrl) : undefined;
        })(),
        soldout: /종료|품절/.test(row.text()),
      });
    });

    return items;
  },
};
