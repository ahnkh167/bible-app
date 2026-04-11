// 창세기 인터린어 데이터 빌드 스크립트
// bolls.life API에서 KJV Strong's 태그 데이터를 받아서
// 각 영어 단어에 Strong's 번호를 매핑.
// 그 후 한국어 구절에서 핵심 용어를 휴리스틱으로 매핑.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// bolls.life API: GET /get-text/KJV/{book}/{chapter}/
// book = 1 for Genesis
const TOTAL_GEN_CHAPTERS = 50

async function fetchChapter(bookNum, chapter) {
  const url = `https://bolls.life/get-text/KJV/${bookNum}/${chapter}/`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

// "In the beginning<S>7225</S> God<S>430</S> created<S>1254</S>" 형식을 파싱
function parseStrongsText(text) {
  // <S>숫자</S> 태그를 기준으로 분리
  // 각 부분은 단어(+공백/구두점) 다음에 Strong's 번호가 따라옴
  const tokens = []
  let i = 0
  while (i < text.length) {
    // 다음 <S>...</S> 태그 찾기
    const tagStart = text.indexOf('<S>', i)
    if (tagStart === -1) {
      // 남은 텍스트 추가
      const rest = text.slice(i)
      if (rest.trim()) tokens.push({ text: rest, strong: null })
      break
    }
    const tagEnd = text.indexOf('</S>', tagStart)
    if (tagEnd === -1) break

    // 이 <S> 앞까지는 단어 텍스트
    const wordText = text.slice(i, tagStart)
    const strongNum = text.slice(tagStart + 3, tagEnd).trim()

    if (wordText.length > 0) {
      tokens.push({ text: wordText, strong: 'H' + strongNum })
    }
    i = tagEnd + 4 // skip </S>
  }

  // 토큰 후처리: 단어+뒤의 공백/구두점을 깔끔하게 분리
  return cleanTokens(tokens)
}

// 토큰 정리: 각 토큰을 [핵심 단어 + Strong's] / [꼬리 공백·구두점] 으로 나눔
function cleanTokens(tokens) {
  const out = []
  for (const tok of tokens) {
    // 태그 없는 토큰은 그대로
    if (!tok.strong) {
      if (tok.text.trim()) out.push({ text: tok.text, strong: null })
      else if (out.length > 0) out[out.length - 1].text += tok.text
      else out.push({ text: tok.text, strong: null })
      continue
    }

    // 앞 공백
    const leading = tok.text.match(/^\s*/)[0]
    // 뒤 공백/구두점
    const trailing = tok.text.match(/[\s.,;:!?'"]*$/)[0]
    const coreStart = leading.length
    const coreEnd = tok.text.length - trailing.length
    const core = tok.text.slice(coreStart, coreEnd)

    if (leading && out.length > 0) {
      out[out.length - 1].text += leading
    } else if (leading) {
      out.push({ text: leading, strong: null })
    }

    if (core) {
      out.push({ text: core, strong: tok.strong })
    }

    if (trailing) {
      out.push({ text: trailing, strong: null })
    }
  }
  return out
}

// 한국어 구절에서 주요 Strong's 용어 매핑
// 각 Strong's에 해당하는 한국어 대표 단어들
const koStrongsMap = {
  // 하나님, 주
  'H430': ['하나님', '하나님이', '하나님의', '하나님께서', '하나님은', '하나님을', '하나님과'],
  'H3068': ['여호와', '여호와께서', '여호와의', '여호와를', '여호와께', '여호와께로', '여호와는', '여호와가'],
  'H136': ['주', '주께서', '주의', '주를', '주께', '주는'],
  'H410': ['엘', '하나님', '전능자'],
  // 사람
  'H120': ['사람', '아담', '인간', '사람이', '사람을'],
  'H376': ['남자', '남편', '사람', '자'],
  'H802': ['여자', '아내', '여인'],
  'H1121': ['아들', '자손', '아들이', '아들을', '자녀', '자녀들'],
  'H1323': ['딸', '딸이'],
  'H251': ['형제', '동생', '친척'],
  'H1': ['아버지', '조상', '선조', '아버지의', '아버지가'],
  'H517': ['어머니', '어미'],
  // 창조/만들기
  'H1254': ['창조', '창조하시니라', '창조하셨으니', '창조하사', '창조하실', '창조하시고', '창조하신'],
  'H6213': ['만드시니라', '만드시고', '지으시고', '지으셨으니', '행하시니라'],
  // 하늘/땅
  'H8064': ['하늘', '하늘이', '하늘의', '하늘을', '궁창'],
  'H776': ['땅', '땅이', '땅의', '땅을', '지구', '지면'],
  // 빛/어둠
  'H216': ['빛', '빛이', '빛을'],
  'H2822': ['어둠', '흑암', '어두움'],
  // 물
  'H4325': ['물', '물이', '물을', '물들'],
  // 시간
  'H7225': ['태초', '태초에', '처음', '시초'],
  'H3117': ['날', '날이', '낮', '낮이', '때'],
  'H3915': ['밤', '밤이', '밤을'],
  'H6153': ['저녁', '저물매', '저녁이'],
  'H1242': ['아침', '아침이', '아침에'],
  // 영
  'H7307': ['영', '신', '바람', '하나님의 신', '영이'],
  'H5315': ['혼', '영혼', '생명', '생령'],
  // 말하기/듣기
  'H559': ['이르시되', '이르시니', '가라사대', '말씀하셨으니', '말씀하시되', '말하기를', '말하였다'],
  'H1696': ['말씀하시니라', '말씀하시고', '말씀하시되'],
  'H1697': ['말씀', '말', '일', '사건'],
  'H8085': ['들으라', '들으시고', '들었고'],
  // 형용사
  'H2896': ['좋았더라', '선한', '좋으신', '좋은', '아름다운'],
  'H7451': ['악한', '악', '나쁜', '악함'],
  'H1419': ['큰', '위대한', '대단한'],
  'H6918': ['거룩한', '거룩하신', '성결'],
  // 동작
  'H935': ['오시니라', '오시고', '들어가사', '가시니'],
  'H3212': ['가시니라', '가시고', '떠나시고'],
  'H5414': ['주시니라', '주시고', '주었더라'],
  'H3947': ['취하사', '받으시고', '가지시고'],
  // 기타 주요
  'H1288': ['축복', '복', '복을 주시며', '복주시고'],
  'H2617': ['인자', '인자하심', '자비', '긍휼'],
  'H6664': ['의', '의로움', '정의'],
  'H7965': ['평강', '평안', '샬롬'],
  'H2416': ['살아있는', '생명', '생기'],
  'H4194': ['죽음', '죽었으니'],
}

// 한국어 구절에서 Strong's가 달린 영어 단어들을 찾아서 한국어 토큰에 매핑
function mapKoreanTokens(koText, enTokens) {
  // 영어 토큰에서 Strong's 번호만 추출 (순서대로)
  const strongsInOrder = enTokens.filter(t => t.strong).map(t => t.strong)
  const strongsSet = new Set(strongsInOrder)

  // 한국어를 어절 단위로 토큰화 (공백 기준)
  const words = koText.split(/(\s+)/) // 공백도 유지
  const tokens = []

  for (const w of words) {
    if (/^\s*$/.test(w)) {
      // 공백
      if (tokens.length > 0) tokens[tokens.length - 1].text += w
      else tokens.push({ text: w, strong: null })
      continue
    }

    // 이 어절이 어떤 Strong's에 해당하는지 찾기
    let matchedStrong = null
    for (const strong of strongsSet) {
      const koWords = koStrongsMap[strong]
      if (!koWords) continue
      // 가장 긴 것부터 매칭 시도
      const sortedKo = [...koWords].sort((a, b) => b.length - a.length)
      for (const kw of sortedKo) {
        if (w === kw || w.startsWith(kw) || w.includes(kw)) {
          matchedStrong = strong
          break
        }
      }
      if (matchedStrong) break
    }

    tokens.push({ text: w, strong: matchedStrong })
  }

  return tokens
}

async function buildBook(bookNum, bookId, koBookData) {
  const result = {}
  for (let ch = 1; ch <= TOTAL_GEN_CHAPTERS; ch++) {
    process.stdout.write(`\r${bookId} ${ch}장 ...`)
    try {
      const verses = await fetchChapter(bookNum, ch)
      const chapterResult = {}

      for (const v of verses) {
        const verseNum = String(v.verse)
        const enTokens = parseStrongsText(v.text)
        const koText = koBookData?.[String(ch)]?.[verseNum] || ''
        const koTokens = koText ? mapKoreanTokens(koText, enTokens) : []

        chapterResult[verseNum] = {
          ko: koTokens,
          en: enTokens,
        }
      }

      result[String(ch)] = chapterResult
      // API에 부담 주지 않도록 약간 대기
      await new Promise(r => setTimeout(r, 150))
    } catch (e) {
      console.error(`\nError in ${bookId} ${ch}:`, e.message)
    }
  }
  console.log(`\n${bookId} 완료: ${Object.keys(result).length}장`)
  return result
}

// 한국어 성경 데이터 로드
const bibleKoPath = path.resolve(__dirname, '../src/data/bible/bible.json')
const bibleKo = JSON.parse(fs.readFileSync(bibleKoPath, 'utf8'))

// 창세기 빌드 (bolls.life 기준: Genesis = 1)
const gen = await buildBook(1, 'gen', bibleKo.gen)

const outPath = path.resolve(__dirname, '../src/data/interlinear/gen.json')
fs.writeFileSync(outPath, JSON.stringify(gen))
console.log(`Written to: ${outPath}`)
console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`)
