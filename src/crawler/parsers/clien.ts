import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText } from './helpers';

/**
 * 클리앙 알뜰구매 게시판 파서
 * 목록 URL: https://www.clien.net/service/board/jirum
 *
 * ⚠️ SELECTORS 는 반드시 실제 페이지로 검증 후 사용하세요.
 */
const SELECTORS = {
  row: 'div.list_item',
  titleLink: 'a.list_subject, a',
  comment: 'span.rSymph05, .list_reply .num',
  date: 'span.timestamp, .list_time .timestamp',
};

export const clien: Parser = {
  id: 'clien',
  name: '클리앙',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);
      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href');
      // 제목 span 안에 텍스트가 들어가는 구조 대응
      const title = cleanText(link.find('span.subject_fixed').text() || link.attr('title') || link.text());
      if (!href || !title || title.length < 4) return;

      const externalId = row.attr('data-board-sn') ?? href.match(/jirum\/(\d+)/)?.[1];
      if (!externalId) return;

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        soldout: /품절|종료|마감/.test(title),
      });
    });

    return items;
  },
};
