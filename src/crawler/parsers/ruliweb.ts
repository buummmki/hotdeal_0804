import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText, dedupeById } from './helpers';

/**
 * 루리웹 예판/할인 정보 게시판 파서
 * 목록 URL: https://bbs.ruliweb.com/market/board/1020
 *
 * 실제 마크업 (2026-08 확인):
 *   <tr class="table_body">
 *     <td class="divsn"><a ...><strong>게임</strong></a></td>
 *     <td class="subject">
 *       <a class="subject_link deco" href=".../read/106123?"><strong>제목</strong></a>
 *       <a class="num_reply" href="...#cmt"> (2)</a>        ← span 이 아니라 a 태그
 *     </td>
 *     <td class="recomd">8</td><td class="hit">5540</td><td class="time">07:38</td>
 *   </tr>
 *
 * 상단 BEST 블록(tr.table_body.best)은 아래 일반 목록과 중복이라 제외합니다.
 */
const SELECTORS = {
  row: 'tr.table_body:not(.notice):not(.list_inner_notice):not(.best)',
  titleLink: 'a.subject_link, a.deco',
  category: 'td.divsn a, td.divsn',
  comment: 'a.num_reply, .num_reply',
  date: 'td.time',
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

      // 일반 행은 댓글수 <span class="num_reply">(8)</span> 가 제목 <a> 안에 들어있어
      // 그대로 text() 하면 제목 끝에 "(8)" 이 붙는다. 복제 후 제거하고 읽는다.
      const titleNode = link.clone();
      titleNode.find('.num_reply, i, .icon-picture').remove();
      const title = cleanText(titleNode.text());
      if (!href || !title || title.length < 4) return;

      // /market/board/1020/read/106123 형태
      const externalId = href.match(/read\/(\d+)/)?.[1];
      if (!externalId) return;

      const rawCategory = cleanText(row.find(SELECTORS.category).first().text());

      items.push({
        externalId,
        title,
        url: absoluteUrl(href.replace(/\?$/, ''), baseUrl),
        rawCategory: rawCategory && rawCategory !== 'BEST' ? rawCategory : undefined,
        commentCount: parseCount(
          link.find('.num_reply').first().text() || row.find(SELECTORS.comment).first().text()
        ),
        publishedAt: parseKoreanDate(cleanText(row.find(SELECTORS.date).first().text())),
        soldout: /품절|종료|마감/.test(title),
      });
    });

    return dedupeById(items);
  },
};
