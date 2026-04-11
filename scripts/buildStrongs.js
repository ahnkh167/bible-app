// Strong's 사전 빌드 스크립트
// openscriptures/strongs의 JS 파일을 JSON으로 변환하고 필요한 필드만 추출

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// JS 파일에서 객체를 추출 (eval 없이)
function loadStrongsJs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  // "var strongsXxxDictionary = " 이후부터 시작해서 중괄호 균형 맞춤
  const startMatch = content.match(/var\s+strongs\w+Dictionary\s*=\s*/)
  if (!startMatch) throw new Error(`Could not find dictionary in ${filePath}`)

  const start = startMatch.index + startMatch[0].length
  let depth = 0
  let end = start
  let inString = false
  let stringChar = ''
  let escaped = false

  for (let i = start; i < content.length; i++) {
    const ch = content[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (inString) {
      if (ch === stringChar) inString = false
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      stringChar = ch
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) { end = i + 1; break }
    }
  }

  const jsonStr = content.slice(start, end)
  return JSON.parse(jsonStr)
}

// 영어 품사 약어를 한글/영문으로 확장
function expandPos(strongs_def, kjv_def) {
  // openscriptures 데이터에는 품사 정보가 명시적으로 없어서 정의에서 추론
  return { posKo: '', posEn: '' }
}

// 자주 쓰이는 단어에 대한 간단한 한글 번역 매핑
// (엄밀한 번역은 아니지만 주요 신학 용어만 수작업)
const manualKoDefs = {
  'H1': '아버지, 조상, 지도자 — 문자적 아버지 또는 비유적으로 조상',
  'H120': '아담, 사람, 인류 — 인간, 남자',
  'H410': '엘, 하나님, 힘센 자 — 전능자, 신적 존재',
  'H430': '엘로힘, 하나님, 신들 — 복수형이나 참 하나님을 가리킬 때 단수적으로 쓰임',
  'H3068': '여호와 — 이스라엘의 언약적 하나님의 고유한 이름 (YHWH)',
  'H3069': '여호와 — 주, 주인',
  'H136': '아도나이, 주님, 주인',
  'H1254': '바라, 창조하다, 만들다 — 하나님의 초월적 창조 행위를 가리킴',
  'H6213': '아사, 만들다, 행하다 — 인간이나 하나님의 만드는 행위',
  'H7225': '레쉬트, 시작, 태초, 처음, 으뜸',
  'H8064': '샤마임, 하늘, 궁창',
  'H776': '에레츠, 땅, 지구, 나라, 영토',
  'H216': '오르, 빛, 광명',
  'H2822': '호쉐크, 어둠, 흑암',
  'H4325': '마임, 물, 물들 (복수형)',
  'H3117': '욤, 날, 낮, 시기',
  'H3915': '라일라, 밤',
  'H1121': '벤, 아들, 자손, 자녀',
  'H1323': '바트, 딸',
  'H5315': '네페쉬, 영혼, 생명, 자아, 호흡',
  'H7307': '루아흐, 영, 바람, 숨 — 성령, 사람의 영, 호흡',
  'H3820': '레브, 마음, 중심, 의식',
  'H3519': '카보드, 영광, 존귀, 무거움',
  'H2617': '헤세드, 인자, 사랑, 긍휼, 언약적 사랑',
  'H2580': '헨, 은혜, 호의, 아름다움',
  'H6664': '체데크, 의, 올바름, 정의',
  'H7965': '샬롬, 평화, 평안, 온전함, 안녕',
  'H6918': '카도쉬, 거룩한, 성별된',
  'H1288': '바라크, 축복하다, 무릎 꿇다',
  'H2416': '하이, 살아있는, 생명',
  'H4194': '마베트, 죽음',
  'H4428': '멜렉, 왕, 군주',
  'H5030': '나비, 선지자, 예언자',
  'H3548': '코헨, 제사장',
  'H2403': '하타트, 죄, 죄악, 속죄 제물',
  'H5771': '아본, 불의, 죄악',
  'H8085': '샤마, 듣다, 청종하다, 이해하다',
  'H559': '아마르, 말하다, 이르다',
  'H1696': '다바르, 말하다, 선포하다',
  'H1697': '다바르, 말씀, 일, 사건',
  'H3045': '야다, 알다, 경험하다, 친밀히 알다',
  'H539': '아만, 믿다, 신뢰하다 (아멘의 어원)',
  'H3374': '이르아, 두려움, 경외',
  'H3372': '야레, 두려워하다, 경외하다',
  // 헬라어
  'G1': '알파, 첫 글자',
  'G2316': '데오스, 하나님, 신 — 참 하나님',
  'G2962': '퀴리오스, 주, 주인, 예수 그리스도',
  'G2424': '예수 — 여호수아의 헬라어 형태, 구원자',
  'G5547': '그리스도, 기름부음 받은 자 — 메시아',
  'G4151': '프뉴마, 영, 성령, 바람, 호흡',
  'G4102': '피스티스, 믿음, 신앙, 신실함',
  'G26': '아가페, 사랑 — 하나님의 무조건적 사랑',
  'G5485': '카리스, 은혜, 호의, 선물',
  'G1680': '엘피스, 소망, 기대',
  'G1515': '에이레네, 평화, 평안',
  'G40': '하기오스, 거룩한, 성별된',
  'G5207': '휘오스, 아들',
  'G3962': '파테르, 아버지',
  'G3056': '로고스, 말씀, 이성, 계시',
  'G2222': '조에, 생명 — 영적 생명',
  'G2288': '다나토스, 죽음',
  'G2889': '코스모스, 세상, 우주, 인류',
  'G1343': '디카이오쉬네, 의, 공의',
  'G266': '하마르티아, 죄, 죄악',
  'G4991': '소테리아, 구원',
  'G1577': '에클레시아, 교회, 부름받은 자들의 모임',
  'G3056_word': '말씀',
}

function convertDict(rawDict, prefix) {
  const result = {}
  for (const [key, entry] of Object.entries(rawDict)) {
    const definition = entry.strongs_def || entry.kjv_def || ''
    const koDef = manualKoDefs[key] || null

    result[key] = {
      lemma: entry.lemma || '',
      xlit: entry.xlit || entry.translit || '',
      pron: entry.pron || '',
      defEn: (definition || '').trim(),
      kjv: (entry.kjv_def || '').trim(),
      defKo: koDef,
    }
  }
  return result
}

// Main
const heb = loadStrongsJs('/tmp/strongs-hebrew.js')
const grk = loadStrongsJs('/tmp/strongs-greek.js')

const hebConverted = convertDict(heb, 'H')
const grkConverted = convertDict(grk, 'G')

const outHeb = path.resolve(__dirname, '../src/data/strongs/hebrew.json')
const outGrk = path.resolve(__dirname, '../src/data/strongs/greek.json')

fs.writeFileSync(outHeb, JSON.stringify(hebConverted))
fs.writeFileSync(outGrk, JSON.stringify(grkConverted))

console.log(`Hebrew entries: ${Object.keys(hebConverted).length}`)
console.log(`Greek entries: ${Object.keys(grkConverted).length}`)
console.log(`Written to:`)
console.log(`  ${outHeb}`)
console.log(`  ${outGrk}`)
