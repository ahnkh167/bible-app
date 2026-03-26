// 성경 66권 메타데이터
export const books = [
  // 구약 39권
  { id: 'gen', name: '창세기', nameEn: 'Genesis', shortName: '창', testament: 'old', chapters: 50 },
  { id: 'exo', name: '출애굽기', nameEn: 'Exodus', shortName: '출', testament: 'old', chapters: 40 },
  { id: 'lev', name: '레위기', nameEn: 'Leviticus', shortName: '레', testament: 'old', chapters: 27 },
  { id: 'num', name: '민수기', nameEn: 'Numbers', shortName: '민', testament: 'old', chapters: 36 },
  { id: 'deu', name: '신명기', nameEn: 'Deuteronomy', shortName: '신', testament: 'old', chapters: 34 },
  { id: 'jos', name: '여호수아', nameEn: 'Joshua', shortName: '수', testament: 'old', chapters: 24 },
  { id: 'jdg', name: '사사기', nameEn: 'Judges', shortName: '삿', testament: 'old', chapters: 21 },
  { id: 'rut', name: '룻기', nameEn: 'Ruth', shortName: '룻', testament: 'old', chapters: 4 },
  { id: '1sa', name: '사무엘상', nameEn: '1 Samuel', shortName: '삼상', testament: 'old', chapters: 31 },
  { id: '2sa', name: '사무엘하', nameEn: '2 Samuel', shortName: '삼하', testament: 'old', chapters: 24 },
  { id: '1ki', name: '열왕기상', nameEn: '1 Kings', shortName: '왕상', testament: 'old', chapters: 22 },
  { id: '2ki', name: '열왕기하', nameEn: '2 Kings', shortName: '왕하', testament: 'old', chapters: 25 },
  { id: '1ch', name: '역대상', nameEn: '1 Chronicles', shortName: '대상', testament: 'old', chapters: 29 },
  { id: '2ch', name: '역대하', nameEn: '2 Chronicles', shortName: '대하', testament: 'old', chapters: 36 },
  { id: 'ezr', name: '에스라', nameEn: 'Ezra', shortName: '스', testament: 'old', chapters: 10 },
  { id: 'neh', name: '느헤미야', nameEn: 'Nehemiah', shortName: '느', testament: 'old', chapters: 13 },
  { id: 'est', name: '에스더', nameEn: 'Esther', shortName: '더', testament: 'old', chapters: 10 },
  { id: 'job', name: '욥기', nameEn: 'Job', shortName: '욥', testament: 'old', chapters: 42 },
  { id: 'psa', name: '시편', nameEn: 'Psalms', shortName: '시', testament: 'old', chapters: 150 },
  { id: 'pro', name: '잠언', nameEn: 'Proverbs', shortName: '잠', testament: 'old', chapters: 31 },
  { id: 'ecc', name: '전도서', nameEn: 'Ecclesiastes', shortName: '전', testament: 'old', chapters: 12 },
  { id: 'sng', name: '아가', nameEn: 'Song of Solomon', shortName: '아', testament: 'old', chapters: 8 },
  { id: 'isa', name: '이사야', nameEn: 'Isaiah', shortName: '사', testament: 'old', chapters: 66 },
  { id: 'jer', name: '예레미야', nameEn: 'Jeremiah', shortName: '렘', testament: 'old', chapters: 52 },
  { id: 'lam', name: '예레미야애가', nameEn: 'Lamentations', shortName: '애', testament: 'old', chapters: 5 },
  { id: 'ezk', name: '에스겔', nameEn: 'Ezekiel', shortName: '겔', testament: 'old', chapters: 48 },
  { id: 'dan', name: '다니엘', nameEn: 'Daniel', shortName: '단', testament: 'old', chapters: 12 },
  { id: 'hos', name: '호세아', nameEn: 'Hosea', shortName: '호', testament: 'old', chapters: 14 },
  { id: 'jol', name: '요엘', nameEn: 'Joel', shortName: '욜', testament: 'old', chapters: 3 },
  { id: 'amo', name: '아모스', nameEn: 'Amos', shortName: '암', testament: 'old', chapters: 9 },
  { id: 'oba', name: '오바댜', nameEn: 'Obadiah', shortName: '옵', testament: 'old', chapters: 1 },
  { id: 'jon', name: '요나', nameEn: 'Jonah', shortName: '욘', testament: 'old', chapters: 4 },
  { id: 'mic', name: '미가', nameEn: 'Micah', shortName: '미', testament: 'old', chapters: 7 },
  { id: 'nam', name: '나훔', nameEn: 'Nahum', shortName: '나', testament: 'old', chapters: 3 },
  { id: 'hab', name: '하박국', nameEn: 'Habakkuk', shortName: '합', testament: 'old', chapters: 3 },
  { id: 'zep', name: '스바냐', nameEn: 'Zephaniah', shortName: '습', testament: 'old', chapters: 3 },
  { id: 'hag', name: '학개', nameEn: 'Haggai', shortName: '학', testament: 'old', chapters: 2 },
  { id: 'zec', name: '스가랴', nameEn: 'Zechariah', shortName: '슥', testament: 'old', chapters: 14 },
  { id: 'mal', name: '말라기', nameEn: 'Malachi', shortName: '말', testament: 'old', chapters: 4 },
  // 신약 27권
  { id: 'mat', name: '마태복음', nameEn: 'Matthew', shortName: '마', testament: 'new', chapters: 28 },
  { id: 'mrk', name: '마가복음', nameEn: 'Mark', shortName: '막', testament: 'new', chapters: 16 },
  { id: 'luk', name: '누가복음', nameEn: 'Luke', shortName: '눅', testament: 'new', chapters: 24 },
  { id: 'jhn', name: '요한복음', nameEn: 'John', shortName: '요', testament: 'new', chapters: 21 },
  { id: 'act', name: '사도행전', nameEn: 'Acts', shortName: '행', testament: 'new', chapters: 28 },
  { id: 'rom', name: '로마서', nameEn: 'Romans', shortName: '롬', testament: 'new', chapters: 16 },
  { id: '1co', name: '고린도전서', nameEn: '1 Corinthians', shortName: '고전', testament: 'new', chapters: 16 },
  { id: '2co', name: '고린도후서', nameEn: '2 Corinthians', shortName: '고후', testament: 'new', chapters: 13 },
  { id: 'gal', name: '갈라디아서', nameEn: 'Galatians', shortName: '갈', testament: 'new', chapters: 6 },
  { id: 'eph', name: '에베소서', nameEn: 'Ephesians', shortName: '엡', testament: 'new', chapters: 6 },
  { id: 'php', name: '빌립보서', nameEn: 'Philippians', shortName: '빌', testament: 'new', chapters: 4 },
  { id: 'col', name: '골로새서', nameEn: 'Colossians', shortName: '골', testament: 'new', chapters: 4 },
  { id: '1th', name: '데살로니가전서', nameEn: '1 Thessalonians', shortName: '살전', testament: 'new', chapters: 5 },
  { id: '2th', name: '데살로니가후서', nameEn: '2 Thessalonians', shortName: '살후', testament: 'new', chapters: 3 },
  { id: '1ti', name: '디모데전서', nameEn: '1 Timothy', shortName: '딤전', testament: 'new', chapters: 6 },
  { id: '2ti', name: '디모데후서', nameEn: '2 Timothy', shortName: '딤후', testament: 'new', chapters: 4 },
  { id: 'tit', name: '디도서', nameEn: 'Titus', shortName: '딛', testament: 'new', chapters: 3 },
  { id: 'phm', name: '빌레몬서', nameEn: 'Philemon', shortName: '몬', testament: 'new', chapters: 1 },
  { id: 'heb', name: '히브리서', nameEn: 'Hebrews', shortName: '히', testament: 'new', chapters: 13 },
  { id: 'jas', name: '야고보서', nameEn: 'James', shortName: '약', testament: 'new', chapters: 5 },
  { id: '1pe', name: '베드로전서', nameEn: '1 Peter', shortName: '벧전', testament: 'new', chapters: 5 },
  { id: '2pe', name: '베드로후서', nameEn: '2 Peter', shortName: '벧후', testament: 'new', chapters: 3 },
  { id: '1jn', name: '요한1서', nameEn: '1 John', shortName: '요일', testament: 'new', chapters: 5 },
  { id: '2jn', name: '요한2서', nameEn: '2 John', shortName: '요이', testament: 'new', chapters: 1 },
  { id: '3jn', name: '요한3서', nameEn: '3 John', shortName: '요삼', testament: 'new', chapters: 1 },
  { id: 'jud', name: '유다서', nameEn: 'Jude', shortName: '유', testament: 'new', chapters: 1 },
  { id: 'rev', name: '요한계시록', nameEn: 'Revelation', shortName: '계', testament: 'new', chapters: 22 },
];

export const oldTestamentBooks = books.filter(b => b.testament === 'old');
export const newTestamentBooks = books.filter(b => b.testament === 'new');

export function getBook(id) {
  return books.find(b => b.id === id);
}

export function getBookByName(name) {
  return books.find(b => b.name === name || b.shortName === name);
}
