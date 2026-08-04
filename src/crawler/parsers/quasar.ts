import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText } from './helpers';

/**
 * 퀘이사존 지름/할인정보 게시판 파서
 * 목록 URL: https://quasarzone.com/bbs/qb_saleinfo
 *
 * ⚠️ SELECTORS 는 반드시 실제 페이지로 검증 후 사용하세요.
 */
const SELECTORS = {
  row: 'div.market-info-list-cont, tr.thumb-list',
  titleLink: 'a.subject-link, p.tit a',
  comment: 'span.ctn-count, .count',
  date: 'span.date, .date',
  label: 'span.label, .market-info-sub .tit',
  thumb: 'img',
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
      const title = cleanText(link.find('.ellipsis-with-reply-cnt').text() || link.text());
      if (!href || !title || title.length < 4) return;

      const externalId = href.match(/views\/(\d+)/)?.[1] ?? href.match(/(\d+)\/?$/)?.[1];
      if (!externalId) return;

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        imageUrl: (() => {
          const src = row.find(SELECTORS.thumb).first().attr('src');
          return src && !src.startsWith('data:') ? absoluteUrl(src, baseUrl) : undefined;
        })(),
        soldout: /종료|품절/.test(cleanText(row.find(SELECTORS.label).first().text())),
      });
    });

    return items;
  },
};
