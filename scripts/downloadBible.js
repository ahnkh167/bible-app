#!/usr/bin/env node
/**
 * 성경 데이터 다운로드 스크립트
 * - 한글: getBible API v2 (개역한글 KRV)
 * - 영어: getBible API v2 (KJV)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data', 'bible');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// 책 ID 매핑 (getBible 번호 → 앱 ID)
const bookIdMap = {
  1: 'gen', 2: 'exo', 3: 'lev', 4: 'num', 5: 'deu',
  6: 'jos', 7: 'jdg', 8: 'rut', 9: '1sa', 10: '2sa',
  11: '1ki', 12: '2ki', 13: '1ch', 14: '2ch', 15: 'ezr',
  16: 'neh', 17: 'est', 18: 'job', 19: 'psa', 20: 'pro',
  21: 'ecc', 22: 'sng', 23: 'isa', 24: 'jer', 25: 'lam',
  26: 'ezk', 27: 'dan', 28: 'hos', 29: 'jol', 30: 'amo',
  31: 'oba', 32: 'jon', 33: 'mic', 34: 'nam', 35: 'hab',
  36: 'zep', 37: 'hag', 38: 'zec', 39: 'mal',
  40: 'mat', 41: 'mrk', 42: 'luk', 43: 'jhn', 44: 'act',
  45: 'rom', 46: '1co', 47: '2co', 48: 'gal', 49: 'eph',
  50: 'php', 51: 'col', 52: '1th', 53: '2th', 54: '1ti',
  55: '2ti', 56: 'tit', 57: 'phm', 58: 'heb', 59: 'jas',
  60: '1pe', 61: '2pe', 62: '1jn', 63: '2jn', 64: '3jn',
  65: 'jud', 66: 'rev'
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`  재시도 ${i + 2}/${retries}...`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function convertGetBibleData(data) {
  const result = {};

  for (const [bookNum, bookData] of Object.entries(data)) {
    const appBookId = bookIdMap[parseInt(bookNum)];
    if (!appBookId) continue;

    result[appBookId] = {};

    if (bookData.chapters) {
      for (const [chapterNum, chapterData] of Object.entries(bookData.chapters)) {
        result[appBookId][chapterNum] = {};

        if (chapterData.verses) {
          for (const [verseNum, verseData] of Object.entries(chapterData.verses)) {
            const text = typeof verseData === 'string' ? verseData :
                         (verseData.text || verseData.verse || '');
            result[appBookId][chapterNum][verseNum] = text.trim();
          }
        }
      }
    }
  }

  return result;
}

// getBible v2 형식: 각 책이 별도 파일 또는 전체 JSON
async function downloadFromGetBible(translation) {
  console.log(`\n${translation} 다운로드 중...`);
  const url = `https://api.getbible.net/v2/${translation}.json`;
  console.log(`  URL: ${url}`);

  const data = await fetchWithRetry(url);
  return convertGetBibleData(data);
}

// 대안: 책별로 다운로드 (전체 파일이 너무 큰 경우)
async function downloadBookByBook(translation) {
  console.log(`\n${translation} 책별 다운로드 중...`);
  const result = {};
  let totalVerses = 0;

  for (const [num, appId] of Object.entries(bookIdMap)) {
    const url = `https://api.getbible.net/v2/${translation}/${num}.json`;
    try {
      const data = await fetchWithRetry(url);
      result[appId] = {};

      if (data.chapters) {
        for (const chapter of data.chapters) {
          const chNum = chapter.chapter;
          result[appId][chNum] = {};

          if (chapter.verses) {
            for (const verse of chapter.verses) {
              result[appId][chNum][verse.verse] = verse.text?.trim() || '';
              totalVerses++;
            }
          }
        }
      }

      process.stdout.write(`  ${appId} (${totalVerses} verses) ✓\r`);
    } catch (err) {
      console.log(`  ${appId} 실패: ${err.message}`);
    }

    // API 부하 방지
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n  총 ${totalVerses}개 구절 다운로드 완료`);
  return result;
}

async function main() {
  console.log('=== 성경 데이터 다운로드 시작 ===');
  console.log('소스: getBible API v2 (https://getbible.net)');

  let koreanData, englishData;

  // 한글 성경 다운로드
  try {
    console.log('\n📖 한글 성경 (개역한글) 다운로드...');
    koreanData = await downloadBookByBook('korean');
  } catch (err) {
    console.error('한글 성경 전체 다운로드 실패:', err.message);
    console.log('책별 다운로드 시도...');
    koreanData = await downloadBookByBook('korean');
  }

  // 영어 성경 다운로드
  try {
    console.log('\n📖 영어 성경 (KJV) 다운로드...');
    englishData = await downloadBookByBook('kjv');
  } catch (err) {
    console.error('영어 성경 전체 다운로드 실패:', err.message);
    console.log('책별 다운로드 시도...');
    englishData = await downloadBookByBook('kjv');
  }

  // 파일 저장
  if (koreanData && Object.keys(koreanData).length > 0) {
    writeFileSync(join(dataDir, 'bible.json'), JSON.stringify(koreanData), 'utf-8');
    console.log('\n✅ bible.json 저장 완료');
  }

  if (englishData && Object.keys(englishData).length > 0) {
    writeFileSync(join(dataDir, 'bible_en.json'), JSON.stringify(englishData), 'utf-8');
    console.log('✅ bible_en.json 저장 완료');
  }

  // 파일 크기 확인
  const koSize = JSON.stringify(koreanData).length;
  const enSize = JSON.stringify(englishData).length;
  console.log(`\n📊 한글: ${(koSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`📊 영어: ${(enSize / 1024 / 1024).toFixed(1)}MB`);
  console.log('\n=== 완료! ===');
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
