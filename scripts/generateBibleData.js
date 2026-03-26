#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data', 'bible');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const verseCounts = {
  gen: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  exo: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
  lev: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  num: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  deu: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  jos: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  jdg: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  rut: [22,23,18,22],
  '1sa': [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,43,15,23,28,23,44,25,12,25,11,31,13],
  '2sa': [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  '1ki': [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  '2ki': [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  '1ch': [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  '2ch': [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  ezr: [11,70,13,24,17,22,28,36,15,44],
  neh: [11,20,32,23,19,19,73,18,38,39,36,47,31],
  est: [22,23,15,17,14,14,10,17,32,3],
  job: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,35,27,26,12],
  psa: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  pro: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31],
  ecc: [18,26,22,16,20,12,29,17,18,20,10,14],
  sng: [17,17,11,16,16,13,13,14],
  isa: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  jer: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  lam: [22,22,66,22,22],
  ezk: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  dan: [21,49,30,37,31,28,28,27,27,21,45,13],
  hos: [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  jol: [20,32,21],
  amo: [15,16,15,13,27,14,17,14,15],
  oba: [21],
  jon: [17,10,10,11],
  mic: [16,13,12,13,15,16,20],
  nam: [15,13,19],
  hab: [17,17,19],
  zep: [18,15,20],
  hag: [15,23],
  zec: [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  mal: [14,17,18,6],
  mat: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  mrk: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  luk: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  jhn: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  act: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  rom: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  '1co': [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,10],
  '2co': [24,17,18,18,21,18,16,24,15,18,33,21,14],
  gal: [24,21,29,31,26,18],
  eph: [23,22,21,32,33,24],
  php: [30,30,21,23],
  col: [29,23,25,18],
  '1th': [10,20,13,18,28],
  '2th': [12,17,18],
  '1ti': [20,15,16,16,25,21],
  '2ti': [18,26,17,22],
  tit: [16,15,15],
  phm: [25],
  heb: [14,18,19,16,14,20,28,13,28,39,40,29,25],
  jas: [27,26,18,17,20],
  '1pe': [25,25,22,19,14],
  '2pe': [21,22,18],
  '1jn': [10,29,24,21,21],
  '2jn': [13],
  '3jn': [15],
  jud: [25],
  rev: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],
};

const bookNames = {
  gen: '창세기', exo: '출애굽기', lev: '레위기', num: '민수기', deu: '신명기',
  jos: '여호수아', jdg: '사사기', rut: '룻기', '1sa': '사무엘상', '2sa': '사무엘하',
  '1ki': '열왕기상', '2ki': '열왕기하', '1ch': '역대상', '2ch': '역대하',
  ezr: '에스라', neh: '느헤미야', est: '에스더', job: '욥기', psa: '시편',
  pro: '잠언', ecc: '전도서', sng: '아가', isa: '이사야', jer: '예레미야',
  lam: '예레미야애가', ezk: '에스겔', dan: '다니엘', hos: '호세아', jol: '요엘',
  amo: '아모스', oba: '오바댜', jon: '요나', mic: '미가', nam: '나훔',
  hab: '하박국', zep: '스바냐', hag: '학개', zec: '스가랴', mal: '말라기',
  mat: '마태복음', mrk: '마가복음', luk: '누가복음', jhn: '요한복음', act: '사도행전',
  rom: '로마서', '1co': '고린도전서', '2co': '고린도후서', gal: '갈라디아서',
  eph: '에베소서', php: '빌립보서', col: '골로새서', '1th': '데살로니가전서',
  '2th': '데살로니가후서', '1ti': '디모데전서', '2ti': '디모데후서', tit: '디도서',
  phm: '빌레몬서', heb: '히브리서', jas: '야고보서', '1pe': '베드로전서',
  '2pe': '베드로후서', '1jn': '요한1서', '2jn': '요한2서', '3jn': '요한3서',
  jud: '유다서', rev: '요한계시록'
};

const bookNamesEn = {
  gen: 'Genesis', exo: 'Exodus', lev: 'Leviticus', num: 'Numbers', deu: 'Deuteronomy',
  jos: 'Joshua', jdg: 'Judges', rut: 'Ruth', '1sa': '1 Samuel', '2sa': '2 Samuel',
  '1ki': '1 Kings', '2ki': '2 Kings', '1ch': '1 Chronicles', '2ch': '2 Chronicles',
  ezr: 'Ezra', neh: 'Nehemiah', est: 'Esther', job: 'Job', psa: 'Psalms',
  pro: 'Proverbs', ecc: 'Ecclesiastes', sng: 'Song of Solomon', isa: 'Isaiah', jer: 'Jeremiah',
  lam: 'Lamentations', ezk: 'Ezekiel', dan: 'Daniel', hos: 'Hosea', jol: 'Joel',
  amo: 'Amos', oba: 'Obadiah', jon: 'Jonah', mic: 'Micah', nam: 'Nahum',
  hab: 'Habakkuk', zep: 'Zephaniah', hag: 'Haggai', zec: 'Zechariah', mal: 'Malachi',
  mat: 'Matthew', mrk: 'Mark', luk: 'Luke', jhn: 'John', act: 'Acts',
  rom: 'Romans', '1co': '1 Corinthians', '2co': '2 Corinthians', gal: 'Galatians',
  eph: 'Ephesians', php: 'Philippians', col: 'Colossians', '1th': '1 Thessalonians',
  '2th': '2 Thessalonians', '1ti': '1 Timothy', '2ti': '2 Timothy', tit: 'Titus',
  phm: 'Philemon', heb: 'Hebrews', jas: 'James', '1pe': '1 Peter',
  '2pe': '2 Peter', '1jn': '1 John', '2jn': '2 John', '3jn': '3 John',
  jud: 'Jude', rev: 'Revelation'
};

function generatePlaceholderVerse(bookId, chapter, verse) {
  return `${bookNames[bookId]} ${chapter}장 ${verse}절의 말씀입니다. (실제 성경 데이터로 교체해주세요)`;
}

function generatePlaceholderVerseEn(bookId, chapter, verse) {
  return `${bookNamesEn[bookId]} ${chapter}:${verse} (Please replace with actual NKJV Bible text)`;
}

// 한글 유명 구절
const famousVerses = {
  'gen-1-1': '태초에 하나님이 천지를 창조하시니라',
  'gen-1-2': '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라',
  'gen-1-3': '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고',
  'gen-1-4': '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사',
  'gen-1-5': '하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라',
  'gen-1-6': '하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고',
  'gen-1-7': '하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라',
  'gen-1-8': '하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라',
  'gen-1-9': '하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라',
  'gen-1-10': '하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라',
  'gen-1-26': '하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고',
  'gen-1-27': '하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고',
  'gen-1-28': '하나님이 그들에게 복을 주시며 하나님이 그들에게 이르시되 생육하고 번성하여 땅에 충만하라 땅을 정복하라 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라',
  'gen-1-31': '하나님이 지으신 그 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라',
  'psa-23-1': '여호와는 나의 목자시니 내게 부족함이 없으리로다',
  'psa-23-2': '그가 나를 푸른 초장에 누이시며 쉴 만한 물 가로 인도하시는도다',
  'psa-23-3': '내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다',
  'psa-23-4': '내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다',
  'psa-23-5': '주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다',
  'psa-23-6': '내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다',
  'psa-119-105': '주의 말씀은 내 발에 등이요 내 길에 빛이니이다',
  'jhn-3-16': '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
  'jhn-1-1': '태초에 말씀이 계시니라 이 말씀이 하나님과 함께 계셨으니 이 말씀은 곧 하나님이시니라',
  'jhn-1-14': '말씀이 육신이 되어 우리 가운데 거하시매 우리가 그의 영광을 보니 아버지의 독생자의 영광이요 은혜와 진리가 충만하더라',
  'jhn-14-6': '예수께서 이르시되 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라',
  'rom-8-28': '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
  'rom-3-23': '모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니',
  'rom-6-23': '죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라',
  'php-4-13': '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라',
  'isa-40-31': '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다',
  'jer-29-11': '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라',
  'mat-28-19': '그러므로 너희는 가서 모든 민족을 제자로 삼아 아버지와 아들과 성령의 이름으로 세례를 베풀고',
  'mat-28-20': '내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라',
  'mat-6-33': '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
  'mat-11-28': '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라',
  'pro-3-5': '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라',
  'pro-3-6': '너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라',
  'eph-2-8': '너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라',
  'gal-2-20': '내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라',
  'heb-11-1': '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니',
  'rev-21-4': '모든 눈물을 그 눈에서 닦아 주시니 다시는 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니 처음 것들이 다 지나갔음이러라',
  'rev-22-21': '주 예수의 은혜가 모든 자들에게 있을지어다 아멘',
  'act-1-8': '오직 성령이 너희에게 임하시면 너희가 권능을 받고 예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라 하시니라',
  '1co-13-4': '사랑은 오래 참고 사랑은 온유하며 사랑은 시기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며',
  '1co-13-13': '그런즉 믿음 소망 사랑 이 세 가지는 항상 있을 것인데 그 중의 제일은 사랑이라',
  'deu-6-5': '너는 마음을 다하고 뜻을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라',
  'jos-1-9': '내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라 하시니라',
  'mic-6-8': '사람아 주께서 선한 것이 무엇임을 네게 보이셨나니 여호와께서 네게 구하시는 것은 오직 정의를 행하며 인자를 사랑하며 겸손하게 네 하나님과 함께 행하는 것이 아니냐',
};

// NKJV 영어 유명 구절
const famousVersesEn = {
  'gen-1-1': 'In the beginning God created the heavens and the earth.',
  'gen-1-2': 'The earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God was hovering over the face of the waters.',
  'gen-1-3': 'Then God said, "Let there be light"; and there was light.',
  'gen-1-4': 'And God saw the light, that it was good; and God divided the light from the darkness.',
  'gen-1-5': 'God called the light Day, and the darkness He called Night. So the evening and the morning were the first day.',
  'gen-1-6': 'Then God said, "Let there be a firmament in the midst of the waters, and let it divide the waters from the waters."',
  'gen-1-7': 'Thus God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament; and it was so.',
  'gen-1-8': 'And God called the firmament Heaven. So the evening and the morning were the second day.',
  'gen-1-9': 'Then God said, "Let the waters under the heavens be gathered together into one place, and let the dry land appear"; and it was so.',
  'gen-1-10': 'And God called the dry land Earth, and the gathering together of the waters He called Seas. And God saw that it was good.',
  'gen-1-26': 'Then God said, "Let Us make man in Our image, according to Our likeness; let them have dominion over the fish of the sea, over the birds of the air, and over the cattle, over all the earth and over every creeping thing that creeps on the earth."',
  'gen-1-27': 'So God created man in His own image; in the image of God He created him; male and female He created them.',
  'gen-1-28': 'Then God blessed them, and God said to them, "Be fruitful and multiply; fill the earth and subdue it; have dominion over the fish of the sea, over the birds of the air, and over every living thing that moves on the earth."',
  'gen-1-31': 'Then God saw everything that He had made, and indeed it was very good. So the evening and the morning were the sixth day.',
  'psa-23-1': 'The LORD is my shepherd; I shall not want.',
  'psa-23-2': 'He makes me to lie down in green pastures; He leads me beside the still waters.',
  'psa-23-3': 'He restores my soul; He leads me in the paths of righteousness for His name\'s sake.',
  'psa-23-4': 'Yea, though I walk through the valley of the shadow of death, I will fear no evil; for You are with me; Your rod and Your staff, they comfort me.',
  'psa-23-5': 'You prepare a table before me in the presence of my enemies; You anoint my head with oil; my cup runs over.',
  'psa-23-6': 'Surely goodness and mercy shall follow me all the days of my life; and I will dwell in the house of the LORD forever.',
  'psa-119-105': 'Your word is a lamp to my feet and a light to my path.',
  'jhn-3-16': 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.',
  'jhn-1-1': 'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'jhn-1-14': 'And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.',
  'jhn-14-6': 'Jesus said to him, "I am the way, the truth, and the life. No one comes to the Father except through Me."',
  'rom-8-28': 'And we know that all things work together for good to those who love God, to those who are the called according to His purpose.',
  'rom-3-23': 'for all have sinned and fall short of the glory of God,',
  'rom-6-23': 'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.',
  'php-4-13': 'I can do all things through Christ who strengthens me.',
  'isa-40-31': 'But those who wait on the LORD shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.',
  'jer-29-11': 'For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.',
  'mat-28-19': 'Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,',
  'mat-28-20': 'teaching them to observe all things that I have commanded you; and lo, I am with you always, even to the end of the age." Amen.',
  'mat-6-33': 'But seek first the kingdom of God and His righteousness, and all these things shall be added to you.',
  'mat-11-28': 'Come to Me, all you who labor and are heavy laden, and I will give you rest.',
  'pro-3-5': 'Trust in the LORD with all your heart, and lean not on your own understanding;',
  'pro-3-6': 'In all your ways acknowledge Him, and He shall direct your paths.',
  'eph-2-8': 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God,',
  'gal-2-20': 'I have been crucified with Christ; it is no longer I who live, but Christ lives in me; and the life which I now live in the flesh I live by faith in the Son of God, who loved me and gave Himself for me.',
  'heb-11-1': 'Now faith is the substance of things hoped for, the evidence of things not seen.',
  'rev-21-4': 'And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away.',
  'rev-22-21': 'The grace of our Lord Jesus Christ be with you all. Amen.',
  'act-1-8': 'But you shall receive power when the Holy Spirit has come upon you; and you shall be witnesses to Me in Jerusalem, and in all Judea and Samaria, and to the end of the earth.',
  '1co-13-4': 'Love suffers long and is kind; love does not envy; love does not parade itself, is not puffed up;',
  '1co-13-13': 'And now abide faith, hope, love, these three; but the greatest of these is love.',
  'deu-6-5': 'You shall love the LORD your God with all your heart, with all your soul, and with all your strength.',
  'jos-1-9': 'Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the LORD your God is with you wherever you go.',
  'mic-6-8': 'He has shown you, O man, what is good; and what does the LORD require of you but to do justly, to love mercy, and to walk humbly with your God?',
};

console.log('한영 성경 데이터 생성 중...');

let totalVerses = 0;
const allBooksKo = {};
const allBooksEn = {};

for (const [bookId, chapters] of Object.entries(verseCounts)) {
  const bookDataKo = {};
  const bookDataEn = {};

  for (let ch = 0; ch < chapters.length; ch++) {
    const chapterNum = ch + 1;
    const verseCount = chapters[ch];
    const versesKo = {};
    const versesEn = {};

    for (let v = 1; v <= verseCount; v++) {
      const key = `${bookId}-${chapterNum}-${v}`;
      versesKo[v] = famousVerses[key] || generatePlaceholderVerse(bookId, chapterNum, v);
      versesEn[v] = famousVersesEn[key] || generatePlaceholderVerseEn(bookId, chapterNum, v);
      totalVerses++;
    }

    bookDataKo[chapterNum] = versesKo;
    bookDataEn[chapterNum] = versesEn;
  }

  allBooksKo[bookId] = bookDataKo;
  allBooksEn[bookId] = bookDataEn;
}

writeFileSync(join(dataDir, 'bible.json'), JSON.stringify(allBooksKo, null, 0), 'utf-8');
writeFileSync(join(dataDir, 'bible_en.json'), JSON.stringify(allBooksEn, null, 0), 'utf-8');

console.log(`완료! 총 ${totalVerses}개 구절 (한글 + 영어 NKJV)`);

const searchIndex = {};
for (const [bookId, chapters] of Object.entries(allBooksKo)) {
  for (const [chapterNum, verses] of Object.entries(chapters)) {
    for (const [verseNum, text] of Object.entries(verses)) {
      const key = `${bookId}-${chapterNum}-${verseNum}`;
      if (famousVerses[key]) {
        if (!searchIndex[bookId]) searchIndex[bookId] = [];
        searchIndex[bookId].push({ c: parseInt(chapterNum), v: parseInt(verseNum), t: text });
      }
    }
  }
}

writeFileSync(join(dataDir, 'searchIndex.json'), JSON.stringify(searchIndex), 'utf-8');
console.log('검색 인덱스 생성 완료');
