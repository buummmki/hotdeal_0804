import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText } from './helpers';

/**
 * 루리웹 예판/할인 정보 게시판 파서
 * 목록 URL: https://bbs.ruliweb.com/market/board/1020
 *
 * ⚠️ SELECTORS 는 반드시 실제 페이지로 검증 후 사용하세요.
 */
const SELECTORS = {
  row: 'tr.table_body:not(.notice):not(.list_inner_notice)',
  titleLink: 'a.deco, td.subject a.deco',
  category: 'td.divsn, .divsn',
  comment: 'span.num_reply, .reply_count',
  date: 'td.time, .time',
};

export const ruliweb: Parser = {
  id: 'ruliweb',
  name: '루리웹',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);
      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href');
      const title = cleanText(link.text());
      if (!href || !title || title.length < 4) return;

      // /market/board/1020/read/8801 형태
      const externalId = href.match(/read\/(\d+)/)?.[1];
      if (!externalId) return;

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        rawCategory: cleanText(row.find(SELECTORS.category).first().text()) || undefined,
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        soldout: /품절|종료|마감/.test(title),
      });
    });

    return items;
  },
};
