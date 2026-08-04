import * as cheerio from 'cheerio';
import type { Parser, RawItem } from '../types';
import { absoluteUrl, parseCount, parseKoreanDate, cleanText, dedupeById } from './helpers';

/**
 * 뽐뿌 뽐뿌게시판 목록 파서
 * 목록 URL: https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu
 *
 * 실제 마크업 (2026-08 확인):
 *   <tr class="baseList bbs_new1">
 *     <td class="baseList-space baseList-numb">724675</td>
 *     <td class="baseList-space title">
 *       <a class="baseList-thumb" href="view.php?...&no=724675"><img ...></a>   ← 썸네일 링크(텍스트 없음)
 *       <div class="baseList-box"><div class="baseList-cover">
 *         <a class="baseList-title" href="view.php?...&no=724675">
 *           <span><em class="baseList-head">[네이버]</em>제목 (6,900원/유배)</span>
 *         </a>
 *         <span class="baseList-c">6</span>                                     ← 댓글수
 *       </div><small class="baseList-small">[식품/건강]</small></div>
 *     </td>
 *     <td class="baseList-space" title="26.08.04 14:19:27"><time class="baseList-time">14:19:27</time></td>
 *   </tr>
 *
 * 공지행은 tr.baseNotice 라 row 셀렉터에서 자연히 제외됩니다.
 */
const SELECTORS = {
  row: 'tr.baseList',
  titleLink: 'a.baseList-title',
  thumbLink: 'a.baseList-thumb',
  category: 'small.baseList-small',
  comment: 'span.baseList-c',
  dateCell: 'td[title]',
  time: 'time.baseList-time',
  thumb: 'a.baseList-thumb img',
};

export const ppomppu: Parser = {
  id: 'ppomppu',
  name: '뽐뿌',

  parseList(html, baseUrl) {
    const $ = cheerio.load(html);
    const items: RawItem[] = [];

    $(SELECTORS.row).each((_, el) => {
      const row = $(el);

      // 썸네일 <a> 가 제목 <a> 보다 먼저 나오므로 반드시 클래스로 특정해야 함
      const link = row.find(SELECTORS.titleLink).first();
      const href = link.attr('href') ?? row.find(SELECTORS.thumbLink).first().attr('href');
      const title = cleanText(link.text());
      if (!href || !title || title.length < 4) return;

      const externalId = href.match(/[?&]no=(\d+)/)?.[1];
      if (!externalId) return;

      // 공지/이벤트 행 방어
      if (row.hasClass('baseNotice') || row.find('img[alt*="공지"], .notice').length) return;

      // 날짜: td[title]="26.08.04 14:19:27" 이 가장 정확. 없으면 time 태그(시각만).
      const dateText =
        cleanText(row.find(SELECTORS.dateCell).first().attr('title')) ||
        cleanText(row.find(SELECTORS.time).first().text());

      const thumb = row.find(SELECTORS.thumb).first().attr('src');

      items.push({
        externalId,
        title,
        url: absoluteUrl(href, baseUrl),
        rawCategory:
          cleanText(row.find(SELECTORS.category).first().text()).replace(/[[\]]/g, '') || undefined,
        commentCount: parseCount(row.find(SELECTORS.comment).first().text()),
        publishedAt: parseKoreanDate(dateText),
        imageUrl: thumb && !/noimage/i.test(thumb) ? absoluteUrl(thumb, baseUrl) : undefined,
        soldout: /종료|품절|마감/.test(title),
      });
    });

    return dedupeById(items);
  },
};
