// 구약 39권 인터린어 데이터 빌드 스크립트
// bolls.life API에서 KJV (Strong's 태그) + WLCa (히브리어 + Strong's) 를 받아
// 한국어 구절에 휴리스틱 매핑을 적용하여 책별 JSON 파일로 저장.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { KO_STRONGS_MAP, stripParticles } from './koStrongsData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 구약 39권: bookId, bibleId(bolls.life KJV book number), 한국어이름, 장수
const OT_BOOKS = [
  { id: 'gen',  num: 1,  name: '창세기',     chapters: 50 },
  { id: 'exo',  num: 2,  name: '출애굽기',   chapters: 40 },
  { id: 'lev',  num: 3,  name: '레위기',     chapters: 27 },
  { id: 'num',  num: 4,  name: '민수기',     chapters: 36 },
  { id: 'deu',  num: 5,  name: '신명기',     chapters: 34 },
  { id: 'jos',  num: 6,  name: '여호수아',   chapters: 24 },
  { id: 'jdg',  num: 7,  name: '사사기',     chapters: 21 },
  { id: 'rut',  num: 8,  name: '룻기',       chapters: 4  },
  { id: '1sa',  num: 9,  name: '사무엘상',   chapters: 31 },
  { id: '2sa',  num: 10, name: '사무엘하',   chapters: 24 },
  { id: '1ki',  num: 11, name: '열왕기상',   chapters: 22 },
  { id: '2ki',  num: 12, name: '열왕기하',   chapters: 25 },
  { id: '1ch',  num: 13, name: '역대상',     chapters: 29 },
  { id: '2ch',  num: 14, name: '역대하',     chapters: 36 },
  { id: 'ezr',  num: 15, name: '에스라',     chapters: 10 },
  { id: 'neh',  num: 16, name: '느헤미야',   chapters: 13 },
  { id: 'est',  num: 17, name: '에스더',     chapters: 10 },
  { id: 'job',  num: 18, name: '욥기',       chapters: 42 },
  { id: 'psa',  num: 19, name: '시편',       chapters: 150 },
  { id: 'pro',  num: 20, name: '잠언',       chapters: 31 },
  { id: 'ecc',  num: 21, name: '전도서',     chapters: 12 },
  { id: 'sng',  num: 22, name: '아가',       chapters: 8  },
  { id: 'isa',  num: 23, name: '이사야',     chapters: 66 },
  { id: 'jer',  num: 24, name: '예레미야',   chapters: 52 },
  { id: 'lam',  num: 25, name: '예레미야애가', chapters: 5 },
  { id: 'ezk',  num: 26, name: '에스겔',     chapters: 48 },
  { id: 'dan',  num: 27, name: '다니엘',     chapters: 12 },
  { id: 'hos',  num: 28, name: '호세아',     chapters: 14 },
  { id: 'jol',  num: 29, name: '요엘',       chapters: 3  },
  { id: 'amo',  num: 30, name: '아모스',     chapters: 9  },
  { id: 'oba',  num: 31, name: '오바댜',     chapters: 1  },
  { id: 'jon',  num: 32, name: '요나',       chapters: 4  },
  { id: 'mic',  num: 33, name: '미가',       chapters: 7  },
  { id: 'nam',  num: 34, name: '나훔',       chapters: 3  },
  { id: 'hab',  num: 35, name: '하박국',     chapters: 3  },
  { id: 'zep',  num: 36, name: '스바냐',     chapters: 3  },
  { id: 'hag',  num: 37, name: '학개',       chapters: 2  },
  { id: 'zec',  num: 38, name: '스가랴',     chapters: 14 },
  { id: 'mal',  num: 39, name: '말라기',     chapters: 4  },
]

async function fetchChapter(bookNum, chapter) {
  const url = `https://bolls.life/get-text/KJV/${bookNum}/${chapter}/`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

// "In the beginning<S>7225</S> God<S>430</S>" 형식 파싱
function parseStrongsText(text) {
  const tokens = []
  let i = 0
  while (i < text.length) {
    const tagStart = text.indexOf('<S>', i)
    if (tagStart === -1) {
      const rest = text.slice(i)
      if (rest.length > 0) tokens.push({ text: rest, strong: null })
      break
    }
    const tagEnd = text.indexOf('</S>', tagStart)
    if (tagEnd === -1) break
    const wordText = text.slice(i, tagStart)
    const strongNum = text.slice(tagStart + 3, tagEnd).trim()
    if (wordText.length > 0) {
      tokens.push({ text: wordText, strong: 'H' + strongNum })
    }
    i = tagEnd + 4
  }
  return cleanTokens(tokens)
}

// HTML 태그(<sup>, <i> 등) 제거
function stripHtml(text) {
  return text.replace(/<\/?(?!S\b)[a-zA-Z]+[^>]*>/g, '')
}

function cleanTokens(tokens) {
  const out = []
  for (const tok of tokens) {
    const clean = { text: stripHtml(tok.text), strong: tok.strong }
    if (!clean.strong) {
      if (clean.text.length > 0) {
        if (out.length > 0 && out[out.length - 1].strong === null) {
          out[out.length - 1].text += clean.text
        } else {
          out.push(clean)
        }
      }
      continue
    }
    const leading = clean.text.match(/^\s*/)[0]
    const trailing = clean.text.match(/[\s.,;:!?'"\u2018\u2019\u201C\u201D]*$/)[0]
    const coreStart = leading.length
    const coreEnd = clean.text.length - trailing.length
    const core = clean.text.slice(coreStart, coreEnd)

    if (leading) {
      if (out.length > 0 && out[out.length - 1].strong === null) {
        out[out.length - 1].text += leading
      } else {
        out.push({ text: leading, strong: null })
      }
    }
    if (core) {
      out.push({ text: core, strong: clean.strong })
    }
    if (trailing) {
      out.push({ text: trailing, strong: null })
    }
  }
  return out
}

// 한국어 구절을 토큰화 + Strong's 매핑
function mapKoreanTokens(koText, enTokens) {
  const strongsInVerse = new Set(enTokens.filter(t => t.strong).map(t => t.strong))
  const words = koText.split(/(\s+)/) // 공백 유지
  const tokens = []

  for (const w of words) {
    if (/^\s*$/.test(w)) {
      if (tokens.length > 0 && tokens[tokens.length - 1].strong === null) {
        tokens[tokens.length - 1].text += w
      } else {
        tokens.push({ text: w, strong: null })
      }
      continue
    }

    // 끝의 구두점 분리
    const punctMatch = w.match(/^(.*?)([.,;:!?·]*)$/)
    const wordPart = punctMatch ? punctMatch[1] : w
    const punct = punctMatch ? punctMatch[2] : ''

    // 어근 찾기 (조사 제거)
    const stripped = stripParticles(wordPart)

    // 매칭 시도: 구절에 있는 Strong's 들 중에서 가장 잘 맞는 것
    let matchedStrong = null
    let matchedLength = 0

    for (const strong of strongsInVerse) {
      const koWords = KO_STRONGS_MAP[strong]
      if (!koWords) continue
      // 가장 긴 매칭 우선
      const sorted = [...koWords].sort((a, b) => b.length - a.length)
      for (const kw of sorted) {
        if (
          wordPart === kw ||
          wordPart.startsWith(kw) ||
          stripped === kw ||
          stripped.startsWith(kw) ||
          (kw.length >= 2 && wordPart.includes(kw))
        ) {
          if (kw.length > matchedLength) {
            matchedStrong = strong
            matchedLength = kw.length
          }
          break
        }
      }
    }

    tokens.push({ text: wordPart, strong: matchedStrong })
    if (punct) {
      tokens.push({ text: punct, strong: null })
    }
  }

  return tokens
}

async function buildBook(book, koBookData) {
  const result = {}
  for (let ch = 1; ch <= book.chapters; ch++) {
    process.stdout.write(`\r  ${book.name} ${ch}/${book.chapters}장 ...`)
    let attempt = 0
    let verses = null
    while (attempt < 3 && !verses) {
      try {
        verses = await fetchChapter(book.num, ch)
      } catch (e) {
        attempt++
        if (attempt >= 3) {
          console.error(`\n  ${book.name} ${ch} 실패:`, e.message)
          break
        }
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    if (!verses) continue

    const chapterResult = {}
    for (const v of verses) {
      const verseNum = String(v.verse)
      const enTokens = parseStrongsText(v.text)
      const koText = koBookData?.[String(ch)]?.[verseNum] || ''
      const koTokens = koText ? mapKoreanTokens(koText, enTokens) : []
      chapterResult[verseNum] = { ko: koTokens, en: enTokens }
    }
    result[String(ch)] = chapterResult
    await new Promise(r => setTimeout(r, 100)) // API rate limit
  }
  return result
}

// ─── 메인 실행 ─────────────────────────────────
const bibleKoPath = path.resolve(__dirname, '../src/data/bible/bible.json')
const bibleKo = JSON.parse(fs.readFileSync(bibleKoPath, 'utf8'))

const outDir = path.resolve(__dirname, '../src/data/interlinear')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// 명령행에서 특정 책만 빌드 가능: node buildInterlinearOT.js gen exo
const argv = process.argv.slice(2)
const target = argv.length > 0
  ? OT_BOOKS.filter(b => argv.includes(b.id))
  : OT_BOOKS

console.log(`▶ 빌드 시작: ${target.length}권`)
console.log(`총 장수: ${target.reduce((s, b) => s + b.chapters, 0)}`)
console.log()

const startedAt = Date.now()

for (const book of target) {
  const outFile = path.resolve(outDir, `${book.id}.json`)
  if (fs.existsSync(outFile) && !argv.includes('--force')) {
    console.log(`✓ ${book.name} (이미 존재) - 건너뜀`)
    continue
  }
  console.log(`\n[${book.id}] ${book.name} 빌드 중 (${book.chapters}장)`)
  const data = await buildBook(book, bibleKo[book.id])
  fs.writeFileSync(outFile, JSON.stringify(data))
  const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(0)
  console.log(`\n  → ${book.id}.json (${sizeKb} KB)`)
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0)
console.log(`\n✓ 완료: ${elapsed}초`)
