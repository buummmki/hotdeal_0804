-- ============================================================
-- 시드 데이터 : 화면을 바로 확인하기 위한 샘플
-- 01_schema.sql 실행 후 이 파일을 실행하세요.
-- ============================================================

-- ------------------------------------------------------------
-- 출처
-- ------------------------------------------------------------
insert into public.source (id, name, type, base_url, list_url, crawl_cycle, color, category_map) values
  ('ppomppu', '뽐뿌',   'community', 'https://www.ppomppu.co.kr', 'https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu', 5,  '#e11d48',
   '{"컴퓨터":"pc","디지털":"digital","가전":"appliance","의류":"life","식품":"food","기타":"etc","상품권":"coupon"}'),
  ('ruliweb', '루리웹', 'community', 'https://bbs.ruliweb.com', 'https://bbs.ruliweb.com/market/board/1020', 10, '#2563eb',
   '{"PC":"pc","가전":"appliance","생활":"life","식품":"food","기타":"etc"}'),
  ('clien',   '클리앙', 'community', 'https://www.clien.net', 'https://www.clien.net/service/board/jirum', 10, '#0891b2',
   '{}'),
  ('quasar',  '퀘이사존','community', 'https://quasarzone.com', 'https://quasarzone.com/bbs/qb_saleinfo', 15, '#7c3aed',
   '{}'),
  ('coolenjoy','쿨엔조이','community','https://coolenjoy.net', 'https://coolenjoy.net/bbs/jirum', 15, '#059669',
   '{}')
on conflict (id) do update set
  name = excluded.name, base_url = excluded.base_url,
  list_url = excluded.list_url, color = excluded.color;

-- ------------------------------------------------------------
-- 샘플 딜 40건
-- ------------------------------------------------------------
insert into public.deal
  (source_id, external_id, source_url, title, summary, price_text, price_value,
   shipping_text, shipping_free, category, tags, image_url, comment_count,
   view_score, status, published_at)
values
  ('ppomppu','700101','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700101',
   '[G마켓] 삼성 990 PRO 2TB NVMe SSD (198,000원/무료)',
   'PS5 호환 히트싱크 미포함 모델. 카드 즉시할인 적용가.','198,000원',198000,'무료배송',true,'pc',
   '{"SSD","삼성","NVMe"}','https://picsum.photos/seed/ssd990/400/300',312,88,'normal', now() - interval '35 minutes'),

  ('ppomppu','700102','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700102',
   '[쿠팡] 곰곰 국내산 삼겹살 1kg (14,900원/로켓프레시)',
   '와우회원 한정가. 1인 2팩 구매 제한.','14,900원',14900,'무료배송',true,'food',
   '{"삼겹살","쿠팡","로켓프레시"}','https://picsum.photos/seed/pork/400/300',147,72,'normal', now() - interval '1 hour 12 minutes'),

  ('ruliweb','8801','https://bbs.ruliweb.com/market/board/1020/read/8801',
   '[스팀] 발더스 게이트 3 (35,700원/역대최저)',
   '가을 세일 30% 할인. 한국어 자막 지원.','35,700원',35700,'없음',true,'game',
   '{"스팀","RPG","세일"}','https://picsum.photos/seed/bg3/400/300',289,91,'normal', now() - interval '2 hours'),

  ('clien','19201','https://www.clien.net/service/board/jirum/19201',
   '[11번가] LG 그램 16 2025년형 i7/16GB/512GB (1,349,000원/무료)',
   '11번가 슈팅데이 카드할인 중복 적용가.','1,349,000원',1349000,'무료배송',true,'pc',
   '{"노트북","LG그램","11번가"}','https://picsum.photos/seed/gram16/400/300',96,65,'normal', now() - interval '3 hours'),

  ('quasar','5501','https://quasarzone.com/bbs/qb_saleinfo/views/5501',
   '[다나와] RTX 5070 Ti 게이밍 OC (879,000원/무료)',
   '재고 소량. 다나와 최저가 대비 4만원 인하.','879,000원',879000,'무료배송',true,'pc',
   '{"그래픽카드","RTX","엔비디아"}','https://picsum.photos/seed/rtx5070/400/300',421,95,'normal', now() - interval '45 minutes'),

  ('ppomppu','700103','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700103',
   '[SSG] 스타벅스 아메리카노 T 기프티콘 (3,600원)',
   '정가 4,500원. 유효기간 60일.','3,600원',3600,'없음',true,'coupon',
   '{"스타벅스","기프티콘"}','https://picsum.photos/seed/sbux/400/300',58,44,'normal', now() - interval '4 hours'),

  ('ruliweb','8802','https://bbs.ruliweb.com/market/board/1020/read/8802',
   '[네이버] 다이슨 V15 디텍트 앱솔루트 (698,000원/무료)',
   '네이버플러스 멤버십 적립 10% 별도.','698,000원',698000,'무료배송',true,'appliance',
   '{"다이슨","무선청소기"}','https://picsum.photos/seed/dyson/400/300',134,70,'normal', now() - interval '5 hours'),

  ('clien','19202','https://www.clien.net/service/board/jirum/19202',
   '[알리익스프레스] 샤오미 미밴드 9 글로벌 (28,400원/무료)',
   '해외직구. 배송 7~12일 소요.','28,400원',28400,'무료배송',true,'digital',
   '{"샤오미","스마트밴드","직구"}','https://picsum.photos/seed/miband/400/300',77,52,'normal', now() - interval '6 hours'),

  ('coolenjoy','3301','https://coolenjoy.net/bbs/jirum/3301',
   '[하이마트] LG 스탠바이미 2세대 (999,000원/무료설치)',
   '전시상품 아님. 새제품 재고 정리.','999,000원',999000,'무료배송',true,'appliance',
   '{"LG","스탠바이미","TV"}','https://picsum.photos/seed/standbyme/400/300',112,61,'normal', now() - interval '7 hours'),

  ('ppomppu','700104','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700104',
   '[티몬] 종근당 락토핏 생유산균 골드 6통 (23,900원/무료)',
   '6개월분. 유통기한 2027년 이후.','23,900원',23900,'무료배송',true,'food',
   '{"유산균","락토핏","건강식품"}','https://picsum.photos/seed/lacto/400/300',203,68,'normal', now() - interval '8 hours'),

  ('quasar','5502','https://quasarzone.com/bbs/qb_saleinfo/views/5502',
   '[컴퓨존] 마이크론 크루셜 DDR5 32GB (2x16) 6000 (89,900원)',
   'CL30. AMD EXPO / 인텔 XMP 지원.','89,900원',89900,'2,500원',false,'pc',
   '{"램","DDR5","마이크론"}','https://picsum.photos/seed/ddr5/400/300',88,58,'normal', now() - interval '9 hours'),

  ('ruliweb','8803','https://bbs.ruliweb.com/market/board/1020/read/8803',
   '[플스스토어] 엘든 링 나이트레인 (39,900원/60% 할인)',
   '디지털 다운로드. 세일 종료 3일 남음.','39,900원',39900,'없음',true,'game',
   '{"PS5","엘든링","세일"}','https://picsum.photos/seed/elden/400/300',256,84,'normal', now() - interval '10 hours'),

  ('clien','19203','https://www.clien.net/service/board/jirum/19203',
   '[오늘의집] 시디즈 T50 에어 인체공학 의자 (289,000원/무료)',
   '신규가입 쿠폰 중복 시 269,000원.','289,000원',289000,'무료배송',true,'life',
   '{"의자","시디즈","가구"}','https://picsum.photos/seed/chair/400/300',65,47,'normal', now() - interval '11 hours'),

  ('ppomppu','700105','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700105',
   '[이마트몰] 하기스 매직컴포트 기저귀 4팩 (39,900원)',
   '사이즈 선택 가능. 이마트 앱 쿠폰 적용가.','39,900원',39900,'무료배송',true,'life',
   '{"기저귀","하기스","육아"}','https://picsum.photos/seed/diaper/400/300',41,35,'soldout', now() - interval '12 hours'),

  ('coolenjoy','3302','https://coolenjoy.net/bbs/jirum/3302',
   '[에누리] 앱코 K640 기계식 키보드 적축 (34,900원/무료)',
   '풀배열 RGB. 한정 수량.','34,900원',34900,'무료배송',true,'pc',
   '{"키보드","기계식","앱코"}','https://picsum.photos/seed/keyboard/400/300',53,40,'normal', now() - interval '13 hours'),

  ('quasar','5503','https://quasarzone.com/bbs/qb_saleinfo/views/5503',
   '[SK브로드밴드] 인터넷 500M + IPTV 신규가입 현금 45만원',
   '3년 약정. 설치비 면제 조건 확인 필요.','현금 45만원',450000,'해당없음',true,'etc',
   '{"인터넷","가입","현금지원"}',null,29,22,'normal', now() - interval '14 hours'),

  ('ruliweb','8804','https://bbs.ruliweb.com/market/board/1020/read/8804',
   '[교보문고] 밀리의서재 12개월 이용권 (79,000원)',
   '정가 143,880원 대비 45% 할인.','79,000원',79000,'없음',true,'coupon',
   '{"전자책","구독권","밀리의서재"}','https://picsum.photos/seed/millie/400/300',74,49,'normal', now() - interval '15 hours'),

  ('ppomppu','700106','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700106',
   '[위메프] 애플 에어팟 프로 3세대 (289,000원/무료)',
   '정품 국내 발송. 애플케어 별도.','289,000원',289000,'무료배송',true,'digital',
   '{"에어팟","애플","이어폰"}','https://picsum.photos/seed/airpods/400/300',318,89,'normal', now() - interval '16 hours'),

  ('clien','19204','https://www.clien.net/service/board/jirum/19204',
   '[마켓컬리] 신선한란 특란 30구 (5,900원)',
   '첫 구매 회원 한정. 컬리 새벽배송.','5,900원',5900,'무료배송',true,'food',
   '{"계란","마켓컬리","신선식품"}','https://picsum.photos/seed/eggs/400/300',36,28,'normal', now() - interval '17 hours'),

  ('coolenjoy','3303','https://coolenjoy.net/bbs/jirum/3303',
   '[G마켓] 세바 로지텍 MX Master 4 무선마우스 (109,000원)',
   '스마트알림 지원 신형. 카드 청구할인 포함.','109,000원',109000,'무료배송',true,'pc',
   '{"마우스","로지텍","MX"}','https://picsum.photos/seed/mxmaster/400/300',91,56,'normal', now() - interval '18 hours'),

  ('quasar','5504','https://quasarzone.com/bbs/qb_saleinfo/views/5504',
   '[아이코다] 시게이트 바라쿠다 8TB HDD (159,000원)',
   'NAS 용도 권장 안 함. 일반 저장용.','159,000원',159000,'3,000원',false,'pc',
   '{"HDD","시게이트","스토리지"}','https://picsum.photos/seed/hdd8tb/400/300',47,33,'normal', now() - interval '19 hours'),

  ('ruliweb','8805','https://bbs.ruliweb.com/market/board/1020/read/8805',
   '[닌텐도스토어] 젤다의 전설 티어스 오브 더 킹덤 (44,800원)',
   '패키지판. 재고 한정.','44,800원',44800,'무료배송',true,'game',
   '{"닌텐도","젤다","스위치"}','https://picsum.photos/seed/zelda/400/300',168,66,'normal', now() - interval '20 hours'),

  ('ppomppu','700107','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700107',
   '[홈플러스] 청정원 순창 고추장 3kg (12,900원)',
   '온라인 단독가. 매장가 대비 40% 저렴.','12,900원',12900,'무료배송',true,'food',
   '{"고추장","청정원","장류"}','https://picsum.photos/seed/gochujang/400/300',22,19,'normal', now() - interval '21 hours'),

  ('clien','19205','https://www.clien.net/service/board/jirum/19205',
   '[무신사] 나이키 에어포스1 07 화이트 (89,000원/무료)',
   '전 사이즈 재고 있음. 무신사 적립금 별도.','89,000원',89000,'무료배송',true,'life',
   '{"나이키","운동화","무신사"}','https://picsum.photos/seed/af1/400/300',129,63,'normal', now() - interval '22 hours'),

  ('coolenjoy','3304','https://coolenjoy.net/bbs/jirum/3304',
   '[전자랜드] 삼성 비스포크 큐브 에어 공기청정기 (259,000원)',
   '2025년형. 무료 배송 및 설치.','259,000원',259000,'무료배송',true,'appliance',
   '{"공기청정기","삼성","비스포크"}','https://picsum.photos/seed/aircleaner/400/300',58,42,'normal', now() - interval '23 hours'),

  ('quasar','5505','https://quasarzone.com/bbs/qb_saleinfo/views/5505',
   '[네이버] 벤큐 EX2710U 4K 144Hz 게이밍 모니터 (679,000원)',
   'HDMI 2.1 지원. 콘솔 게이밍 적합.','679,000원',679000,'무료배송',true,'pc',
   '{"모니터","벤큐","4K"}','https://picsum.photos/seed/benq/400/300',103,59,'normal', now() - interval '25 hours'),

  ('ppomppu','700108','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700108',
   '[옥션] 필립스 5000 시리즈 전기면도기 (79,000원/무료)',
   '스마트클린 미포함 모델.','79,000원',79000,'무료배송',true,'appliance',
   '{"면도기","필립스"}','https://picsum.photos/seed/shaver/400/300',44,31,'normal', now() - interval '27 hours'),

  ('ruliweb','8806','https://bbs.ruliweb.com/market/board/1020/read/8806',
   '[에픽게임즈] 시티즈 스카이라인 2 무료 배포',
   '기간 한정 무료. 계정 영구 보관.','무료',0,'없음',true,'game',
   '{"에픽","무료배포","시뮬레이션"}','https://picsum.photos/seed/cities2/400/300',389,93,'expired', now() - interval '29 hours'),

  ('clien','19206','https://www.clien.net/service/board/jirum/19206',
   '[쿠팡] 앱솔루트 유산균 사료 강아지 2kg (19,800원)',
   '로켓배송. 정기배송 시 추가 5% 할인.','19,800원',19800,'무료배송',true,'life',
   '{"강아지","사료","반려동물"}','https://picsum.photos/seed/dogfood/400/300',31,24,'normal', now() - interval '31 hours'),

  ('coolenjoy','3305','https://coolenjoy.net/bbs/jirum/3305',
   '[다나와] 마이크로닉스 클래식 II 850W 골드 (89,000원)',
   '풀모듈러. 10년 무상보증.','89,000원',89000,'무료배송',true,'pc',
   '{"파워","마이크로닉스","850W"}','https://picsum.photos/seed/psu850/400/300',66,45,'normal', now() - interval '33 hours'),

  ('quasar','5506','https://quasarzone.com/bbs/qb_saleinfo/views/5506',
   '[컴퓨존] AMD 라이젠 9 9950X3D (789,000원)',
   '정품 박스. 쿨러 미포함.','789,000원',789000,'무료배송',true,'pc',
   '{"CPU","AMD","라이젠"}','https://picsum.photos/seed/ryzen/400/300',214,79,'normal', now() - interval '35 hours'),

  ('ppomppu','700109','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700109',
   '[GS샵] 삼성 갤럭시 워치 8 클래식 46mm (369,000원)',
   '자급제. 블루투스 모델.','369,000원',369000,'무료배송',true,'digital',
   '{"갤럭시워치","삼성","웨어러블"}','https://picsum.photos/seed/gwatch/400/300',97,54,'normal', now() - interval '37 hours'),

  ('ruliweb','8807','https://bbs.ruliweb.com/market/board/1020/read/8807',
   '[배민] 배달의민족 5,000원 할인쿠폰 (전 메뉴)',
   '최소 주문 12,000원. 오늘 자정까지.','무료',0,'해당없음',true,'coupon',
   '{"배달의민족","쿠폰"}',null,183,71,'expired', now() - interval '39 hours'),

  ('clien','19207','https://www.clien.net/service/board/jirum/19207',
   '[SSG] 하리보 골드베렌 1kg 대용량 (13,900원)',
   '독일 직수입. 유통기한 2027.03.','13,900원',13900,'무료배송',true,'food',
   '{"하리보","젤리","간식"}','https://picsum.photos/seed/haribo/400/300',39,27,'normal', now() - interval '41 hours'),

  ('coolenjoy','3306','https://coolenjoy.net/bbs/jirum/3306',
   '[하이마트] 삼성 비스포크 제트 AI 무선청소기 (549,000원)',
   '청정스테이션 포함. 전시상품.','549,000원',549000,'무료배송',true,'appliance',
   '{"청소기","삼성","비스포크"}','https://picsum.photos/seed/jetai/400/300',72,48,'normal', now() - interval '43 hours'),

  ('quasar','5507','https://quasarzone.com/bbs/qb_saleinfo/views/5507',
   '[아이코다] 커세어 4000D 에어플로우 케이스 (79,000원)',
   '미들타워. 팬 2개 기본 포함.','79,000원',79000,'3,000원',false,'pc',
   '{"케이스","커세어","쿨링"}','https://picsum.photos/seed/case4000d/400/300',34,25,'normal', now() - interval '45 hours'),

  ('ppomppu','700110','https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=700110',
   '[롯데온] 코카콜라 제로 355ml 24캔 (14,900원)',
   '박스 단위. 유통기한 6개월 이상.','14,900원',14900,'무료배송',true,'food',
   '{"콜라","음료","제로"}','https://picsum.photos/seed/coke/400/300',48,32,'soldout', now() - interval '47 hours'),

  ('ruliweb','8808','https://bbs.ruliweb.com/market/board/1020/read/8808',
   '[스팀] 사이버펑크 2077 얼티밋 에디션 (29,700원/70%)',
   '팬텀 리버티 확장팩 포함.','29,700원',29700,'없음',true,'game',
   '{"스팀","사이버펑크","세일"}','https://picsum.photos/seed/cp2077/400/300',221,76,'normal', now() - interval '49 hours'),

  ('clien','19208','https://www.clien.net/service/board/jirum/19208',
   '[교보] 아이패드 프로 13 M5 256GB 와이파이 (1,489,000원)',
   '교육할인 적용가. 학생/교직원 인증 필요.','1,489,000원',1489000,'무료배송',true,'digital',
   '{"아이패드","애플","M5"}','https://picsum.photos/seed/ipadm5/400/300',156,69,'normal', now() - interval '51 hours'),

  ('coolenjoy','3307','https://coolenjoy.net/bbs/jirum/3307',
   '[네이버] 브리타 마렐라 XL 정수기 필터 6개입 (32,900원)',
   '독일 정품. 1년 사용분.','32,900원',32900,'무료배송',true,'life',
   '{"브리타","정수기","필터"}','https://picsum.photos/seed/brita/400/300',27,21,'normal', now() - interval '53 hours')
on conflict (source_id, external_id) do nothing;

-- 반응 스냅샷 몇 건
insert into public.comment_snapshot (deal_id, comment_count, checked_at)
select id, greatest(comment_count - 20, 0), now() - interval '1 hour' from public.deal limit 20;

-- 점수 계산
select public.compute_rank_scores();
