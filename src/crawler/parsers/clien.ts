import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseViewCount, parseKoreanDate, cleanText, dedupeById } from './helpers';

/**
 * 클리앙 알뜰구매 게시판 파서
 * 목록 URL: https://www.clien.net/service/board/jirum
 *
 * 실제 마크업 (2026-08 확인):
 *   <div class="list_item symph_row jirum sold_out"
 *        data-board-sn="19240783" data-comment-count="5">
 *     <div class="list_title">
 *       <span class="list_subject" title="제목">
 *         <a href="/service/board/jirum/19240783?..." data-role="list-title-text">제목</a>
 *         <a class="list_reply"><span class="rSymph05">5</span></a>
 *       </span>
 *       <div class="keyword">
 *         <a class="icon_keyword">이벤트정보</a><span class="icon_info">품절</span>
 *       </div>
 *     </div>
 *     <div class="list_time"><span class="time popover">07:35<span class="timestamp">2026-08-04 07:35:40</span></span></div>
 *   </div>
 *
 * 주의 1) div.list_item 만 잡으면 공지(.notice)와 빈 홍보 div(#hongboInfoList)까지 딸려옵니다.
 * 주의 2) 제목 링크는 a.list_subject 가 아니라 span.list_subject > a 입니다.
 */
const SELECTORS = {
  row: 'div.list_item.symph_row',
  titleLink: 'a[data-role="list-title-text"], div.list_title a[href*="/jirum/"]',
  subject: 'span.list_subject',
  comment: 'span.rSymph05',
  timestamp: 'span.timestamp',
  time: '.list_time .time',
  keyword: 'a.icon_keyword',
  soldFlag: 'span.icon_info',
  thumb: '.list_thumbnail img',
  views: '.list_hit .hit',
};

export const clien: Parser = {
  id: 'clien',
  name: '클리앙',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);
      if (row.hasClass('notice')) return;

      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href');
      // 제목은 span.list_subject 의 title 속성이 잘리지 않은 원문
      const title =
        cleanText(row.find(SELECTORS.subject).first().attr('title')) || cleanText(link.text());
      if (!href || !title || title.length < 4) return;

      const externalId = row.attr('data-board-sn') ?? href.match(/jirum\/(\d+)/)?.[1];
      if (!externalId) return;

      // 댓글수는 data 속성이 가장 정확
      const attrCount = row.attr('data-comment-count');
      const commentCount = attrCount
        ? Number(attrCount) || 0
        : parseCount(row.find(SELECTORS.comment).first().text());

      // timestamp span 에 "2026-08-04 07:35:40" 전체가 들어있음 (시각까지 보존)
      const dateText =
        cleanText(row.find(SELECTORS.timestamp).first().text()) ||
        cleanText(row.find(SELECTORS.time).first().text());

      const thumb = row.find(SELECTORS.thumb).first().attr('src');
      const soldFlag = cleanText(row.find(SELECTORS.soldFlag).first().text());

      items.push({
        externalId,
        title,
        url: absoluteUrl(href.split('?')[0], baseUrl),
        rawCategory: cleanText(row.find(SELECTORS.keyword).first().text()) || undefined,
        commentCount,
        viewCount: parseViewCount(row.find(SELECTORS.views).first().text()),
        publishedAt: parseKoreanDate(dateText),
        imageUrl: thumb && !/noimage/i.test(thumb) ? absoluteUrl(thumb, baseUrl) : undefined,
        soldout: row.hasClass('sold_out') || /품절|종료|마감/.test(soldFlag),
      });
    });

    return dedupeById(items);
  },
};
