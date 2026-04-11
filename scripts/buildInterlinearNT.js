// 신약 27권 인터린어 데이터 빌드 스크립트
// bolls.life KJV API에서 Strong's 태그 (헬라어 G-번호) 를 받아
// 한국어 구절에 휴리스틱 매핑을 적용하여 책별 JSON 파일로 저장.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { KO_STRONGS_GREEK_MAP, stripParticles } from './koStrongsGreekData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 신약 27권: bookId, bibleId(bolls.life KJV book number 40-66), 한국어이름, 장수
const NT_BOOKS = [
  { id: 'mat', num: 40, name: '마태복음',     chapters: 28 },
  { id: 'mrk', num: 41, name: '마가복음',     chapters: 16 },
  { id: 'luk', num: 42, name: '누가복음',     chapters: 24 },
  { id: 'jhn', num: 43, name: '요한복음',     chapters: 21 },
  { id: 'act', num: 44, name: '사도행전',     chapters: 28 },
  { id: 'rom', num: 45, name: '로마서',       chapters: 16 },
  { id: '1co', num: 46, name: '고린도전서',   chapters: 16 },
  { id: '2co', num: 47, name: '고린도후서',   chapters: 13 },
  { id: 'gal', num: 48, name: '갈라디아서',   chapters: 6  },
  { id: 'eph', num: 49, name: '에베소서',     chapters: 6  },
  { id: 'php', num: 50, name: '빌립보서',     chapters: 4  },
  { id: 'col', num: 51, name: '골로새서',     chapters: 4  },
  { id: '1th', num: 52, name: '데살로니가전서', chapters: 5 },
  { id: '2th', num: 53, name: '데살로니가후서', chapters: 3 },
  { id: '1ti', num: 54, name: '디모데전서',   chapters: 6  },
  { id: '2ti', num: 55, name: '디모데후서',   chapters: 4  },
  { id: 'tit', num: 56, name: '디도서',       chapters: 3  },
  { id: 'phm', num: 57, name: '빌레몬서',     chapters: 1  },
  { id: 'heb', num: 58, name: '히브리서',     chapters: 13 },
  { id: 'jas', num: 59, name: '야고보서',     chapters: 5  },
  { id: '1pe', num: 60, name: '베드로전서',   chapters: 5  },
  { id: '2pe', num: 61, name: '베드로후서',   chapters: 3  },
  { id: '1jn', num: 62, name: '요한일서',     chapters: 5  },
  { id: '2jn', num: 63, name: '요한이서',     chapters: 1  },
  { id: '3jn', num: 64, name: '요한삼서',     chapters: 1  },
  { id: 'jud', num: 65, name: '유다서',       chapters: 1  },
  { id: 'rev', num: 66, name: '요한계시록',   chapters: 22 },
]

async function fetchChapter(bookNum, chapter) {
  const url = `https://bolls.life/get-text/KJV/${bookNum}/${chapter}/`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

// "The book<S>976</S> of the generation<S>1078</S>" 형식 파싱
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
      tokens.push({ text: wordText, strong: 'G' + strongNum })
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
      const koWords = KO_STRONGS_GREEK_MAP[strong]
      if (!koWords) continue
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
    await new Promise(r => setTimeout(r, 100))
  }
  return result
}

// ─── 메인 실행 ─────────────────────────────────
const bibleKoPath = path.resolve(__dirname, '../src/data/bible/bible.json')
const bibleKo = JSON.parse(fs.readFileSync(bibleKoPath, 'utf8'))

const outDir = path.resolve(__dirname, '../src/data/interlinear')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// 명령행에서 특정 책만 빌드 가능: node buildInterlinearNT.js mat jhn
const argv = process.argv.slice(2)
const target = argv.length > 0 && !argv.every(a => a.startsWith('--'))
  ? NT_BOOKS.filter(b => argv.includes(b.id))
  : NT_BOOKS

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
