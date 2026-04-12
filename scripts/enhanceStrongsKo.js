// Strong's 사전의 defKo (한국어 정의) 필드를 보강하는 스크립트
//
// 두 가지 소스에서 한국어 번역을 가져옴:
//   1) koStrongsData.js / koStrongsGreekData.js 의 KO_STRONGS_*_MAP — 가장 정확
//   2) 영어→한국어 사전을 통한 kjv 필드 단어별 번역 — 자동 번역, 폴백
//
// 결과를 src/data/strongs/{hebrew,greek}.json 에 다시 저장.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { KO_STRONGS_MAP } from './koStrongsData.js'
import { KO_STRONGS_GREEK_MAP } from './koStrongsGreekData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 영어 → 한국어 (성경 KJV 자주 등장 단어 ~500개)
const EN2KO = {
  // 신명·종교
  'god': '하나님', 'lord': '주', 'jehovah': '여호와', 'jesus': '예수',
  'christ': '그리스도', 'messiah': '메시아', 'spirit': '영', 'holy': '거룩한',
  'almighty': '전능하신', 'most high': '지극히 높으신',
  // 사람·관계
  'father': '아버지', 'mother': '어머니', 'son': '아들', 'daughter': '딸',
  'child': '자녀', 'children': '자녀', 'man': '사람', 'men': '사람들',
  'woman': '여자', 'women': '여자들', 'wife': '아내', 'husband': '남편',
  'brother': '형제', 'brethren': '형제들', 'sister': '자매',
  'people': '백성', 'nation': '나라', 'tribe': '지파', 'family': '족속',
  'household': '권속', 'kindred': '친족',
  'king': '왕', 'queen': '왕후', 'prince': '왕자', 'princess': '공주',
  'priest': '제사장', 'levite': '레위인', 'prophet': '선지자', 'prophetess': '여선지자',
  'apostle': '사도', 'disciple': '제자', 'teacher': '선생', 'master': '주인',
  'judge': '재판장', 'elder': '장로', 'ruler': '관원', 'governor': '총독',
  'servant': '종', 'maidservant': '여종', 'slave': '노예', 'handmaid': '여종',
  'shepherd': '목자', 'fisherman': '어부', 'soldier': '군인', 'warrior': '용사',
  'enemy': '원수', 'foe': '대적', 'friend': '친구', 'neighbor': '이웃',
  'stranger': '나그네', 'foreigner': '이방인', 'gentile': '이방인',
  'jew': '유대인', 'jews': '유대인', 'israelite': '이스라엘인',
  'pharisee': '바리새인', 'sadducee': '사두개인', 'scribe': '서기관',
  'centurion': '백부장', 'tetrarch': '분봉왕',
  // 신체
  'soul': '영혼', 'heart': '마음', 'mind': '생각', 'body': '몸',
  'flesh': '육체', 'bone': '뼈', 'blood': '피', 'breath': '호흡',
  'head': '머리', 'face': '얼굴', 'eye': '눈', 'eyes': '눈들',
  'ear': '귀', 'mouth': '입', 'lip': '입술', 'tongue': '혀',
  'tooth': '이', 'teeth': '이들', 'neck': '목', 'shoulder': '어깨',
  'arm': '팔', 'hand': '손', 'finger': '손가락', 'palm': '손바닥',
  'leg': '다리', 'foot': '발', 'feet': '발들', 'knee': '무릎',
  'belly': '배', 'womb': '태', 'bowels': '창자', 'liver': '간',
  // 자연
  'heaven': '하늘', 'sky': '하늘', 'earth': '땅', 'land': '땅', 'world': '세상',
  'sea': '바다', 'ocean': '대양', 'river': '강', 'stream': '시냇물',
  'fountain': '샘', 'well': '우물', 'pool': '못', 'spring': '샘',
  'mountain': '산', 'hill': '언덕', 'valley': '골짜기', 'plain': '평지',
  'wilderness': '광야', 'desert': '사막', 'forest': '수풀',
  'sun': '해', 'moon': '달', 'star': '별', 'cloud': '구름',
  'wind': '바람', 'storm': '폭풍', 'rain': '비', 'snow': '눈',
  'hail': '우박', 'thunder': '천둥', 'lightning': '번개',
  'water': '물', 'fire': '불', 'flame': '불꽃', 'smoke': '연기',
  'dust': '티끌', 'ashes': '재', 'sand': '모래',
  'stone': '돌', 'rock': '반석', 'mountain': '산',
  'gold': '금', 'silver': '은', 'brass': '놋', 'bronze': '놋',
  'iron': '철', 'copper': '구리', 'lead': '납', 'tin': '주석',
  'light': '빛', 'darkness': '어두움', 'shadow': '그림자',
  // 동식물
  'animal': '짐승', 'beast': '짐승', 'cattle': '가축', 'flock': '양떼',
  'sheep': '양', 'lamb': '어린양', 'ram': '숫양', 'ewe': '암양',
  'goat': '염소', 'kid': '새끼염소', 'ox': '소', 'bull': '황소',
  'cow': '암소', 'calf': '송아지', 'horse': '말', 'donkey': '나귀', 'ass': '나귀',
  'camel': '낙타', 'mule': '노새', 'lion': '사자', 'wolf': '이리',
  'bear': '곰', 'fox': '여우', 'dog': '개', 'serpent': '뱀',
  'dragon': '용', 'fish': '물고기', 'whale': '고래',
  'bird': '새', 'fowl': '새', 'eagle': '독수리', 'dove': '비둘기',
  'raven': '까마귀', 'sparrow': '참새', 'swallow': '제비',
  'cock': '닭', 'hen': '암탉', 'chicken': '병아리',
  'tree': '나무', 'wood': '나무', 'plant': '식물', 'herb': '풀',
  'grass': '풀', 'flower': '꽃', 'leaf': '잎', 'leaves': '잎들',
  'root': '뿌리', 'branch': '가지', 'fruit': '열매', 'seed': '씨',
  'corn': '곡식', 'wheat': '밀', 'barley': '보리',
  'vine': '포도나무', 'grape': '포도', 'olive': '감람',
  'fig': '무화과', 'palm': '종려',
  // 음식·일용품
  'bread': '떡', 'food': '음식', 'meat': '고기', 'fish': '물고기',
  'milk': '젖', 'honey': '꿀', 'butter': '버터', 'cheese': '치즈',
  'salt': '소금', 'oil': '기름', 'wine': '포도주', 'water': '물',
  'cup': '잔', 'bowl': '그릇', 'plate': '접시', 'pot': '냄비',
  'basket': '광주리', 'bag': '주머니', 'sack': '자루',
  'garment': '의복', 'clothing': '옷', 'robe': '겉옷', 'tunic': '속옷',
  'mantle': '겉옷', 'sandal': '신발', 'shoe': '신발', 'belt': '띠',
  'crown': '면류관', 'ring': '반지', 'jewel': '보석',
  'sword': '칼', 'spear': '창', 'bow': '활', 'arrow': '화살',
  'shield': '방패', 'helmet': '투구', 'armor': '갑옷',
  // 시간
  'day': '날', 'night': '밤', 'morning': '아침', 'evening': '저녁',
  'noon': '정오', 'midnight': '한밤중', 'dawn': '새벽', 'twilight': '황혼',
  'time': '때', 'hour': '시', 'minute': '분', 'moment': '순간',
  'season': '계절', 'spring': '봄', 'summer': '여름',
  'autumn': '가을', 'winter': '겨울', 'harvest': '추수',
  'year': '년', 'month': '월', 'week': '주', 'sabbath': '안식일',
  'feast': '절기', 'passover': '유월절', 'jubilee': '희년',
  'today': '오늘', 'tomorrow': '내일', 'yesterday': '어제',
  'forever': '영원히', 'eternal': '영원한', 'everlasting': '영원한',
  // 추상
  'love': '사랑', 'faith': '믿음', 'hope': '소망', 'grace': '은혜',
  'mercy': '긍휼', 'compassion': '긍휼', 'kindness': '인자',
  'truth': '진리', 'lie': '거짓', 'peace': '평안', 'joy': '기쁨',
  'gladness': '기쁨', 'sorrow': '슬픔', 'grief': '슬픔', 'mourning': '애곡',
  'fear': '두려움', 'terror': '공포', 'dread': '두려움',
  'anger': '분노', 'wrath': '진노', 'rage': '격분', 'fury': '분노',
  'sin': '죄', 'iniquity': '죄악', 'transgression': '범죄',
  'wickedness': '악', 'evil': '악', 'wrong': '잘못', 'fault': '허물',
  'righteousness': '의', 'justice': '공의', 'judgment': '심판',
  'salvation': '구원', 'redemption': '구속', 'deliverance': '구원',
  'forgiveness': '용서', 'pardon': '사면',
  'covenant': '언약', 'testament': '언약', 'oath': '맹세', 'vow': '서원',
  'law': '율법', 'commandment': '계명', 'statute': '율례', 'ordinance': '규례',
  'precept': '교훈', 'instruction': '교훈', 'doctrine': '교훈',
  'gospel': '복음', 'word': '말씀', 'message': '소식',
  'name': '이름', 'glory': '영광', 'honor': '존귀', 'majesty': '위엄',
  'power': '능력', 'might': '권능', 'strength': '힘', 'authority': '권세',
  'wisdom': '지혜', 'knowledge': '지식', 'understanding': '명철',
  'counsel': '모략', 'plan': '계획', 'purpose': '뜻', 'will': '뜻',
  'kingdom': '나라', 'reign': '통치', 'throne': '보좌',
  'temple': '성전', 'sanctuary': '성소', 'tabernacle': '장막',
  'altar': '제단', 'sacrifice': '제사', 'offering': '제물',
  'priesthood': '제사장직', 'service': '직무', 'ministry': '사역',
  'prayer': '기도', 'praise': '찬양', 'thanksgiving': '감사', 'song': '노래',
  'psalm': '시', 'hymn': '찬송', 'worship': '경배',
  'blessing': '축복', 'curse': '저주', 'reward': '상', 'gift': '선물',
  // 영적 존재
  'angel': '천사', 'archangel': '천사장', 'cherub': '그룹', 'seraph': '스랍',
  'devil': '마귀', 'demon': '귀신', 'satan': '사단', 'evil spirit': '악령',
  // 생사
  'death': '죽음', 'life': '생명', 'living': '살아있는', 'dead': '죽은',
  'resurrection': '부활', 'immortal': '죽지 않는', 'mortal': '죽을',
  'grave': '무덤', 'tomb': '무덤', 'sepulcher': '무덤',
  'soul': '영혼',
  // 형용사
  'great': '큰', 'small': '작은', 'big': '큰', 'tiny': '작은',
  'long': '긴', 'short': '짧은', 'tall': '높은', 'high': '높은',
  'low': '낮은', 'deep': '깊은', 'shallow': '얕은',
  'wide': '넓은', 'narrow': '좁은', 'broad': '넓은',
  'old': '늙은', 'young': '젊은', 'new': '새로운', 'ancient': '오래된',
  'good': '선한', 'bad': '나쁜', 'beautiful': '아름다운', 'ugly': '추한',
  'wise': '지혜로운', 'foolish': '어리석은', 'fool': '어리석은 자',
  'pure': '순결한', 'clean': '깨끗한', 'unclean': '부정한', 'dirty': '더러운',
  'rich': '부유한', 'poor': '가난한', 'wealthy': '부한',
  'strong': '강한', 'weak': '약한', 'mighty': '강한',
  'true': '참된', 'false': '거짓된', 'real': '실제의',
  'first': '첫', 'last': '마지막', 'second': '둘째', 'third': '셋째',
  'next': '다음', 'former': '이전의', 'latter': '나중의',
  // 숫자
  'one': '하나', 'two': '둘', 'three': '셋', 'four': '넷', 'five': '다섯',
  'six': '여섯', 'seven': '일곱', 'eight': '여덟', 'nine': '아홉', 'ten': '열',
  'eleven': '열하나', 'twelve': '열둘', 'twenty': '스물', 'thirty': '서른',
  'forty': '마흔', 'fifty': '오십', 'hundred': '백', 'thousand': '천',
  // 방향·위치
  'east': '동쪽', 'west': '서쪽', 'north': '북쪽', 'south': '남쪽',
  'right': '오른쪽', 'left': '왼쪽', 'up': '위', 'down': '아래',
  'inside': '안', 'outside': '밖', 'above': '위에', 'below': '아래',
  'before': '앞', 'behind': '뒤', 'beside': '곁',
  // 동사
  'see': '보다', 'look': '보다', 'behold': '보다', 'watch': '지키다',
  'hear': '듣다', 'listen': '듣다',
  'speak': '말하다', 'say': '말하다', 'tell': '말하다', 'declare': '선포하다',
  'cry': '부르짖다', 'shout': '외치다', 'call': '부르다', 'name': '이름하다',
  'know': '알다', 'understand': '깨닫다', 'perceive': '깨닫다',
  'think': '생각하다', 'remember': '기억하다', 'forget': '잊다',
  'believe': '믿다', 'trust': '신뢰하다', 'doubt': '의심하다',
  'love': '사랑하다', 'hate': '미워하다',
  'fear': '두려워하다', 'dread': '두려워하다',
  'rejoice': '기뻐하다', 'weep': '울다', 'mourn': '애곡하다', 'laugh': '웃다',
  'eat': '먹다', 'drink': '마시다', 'taste': '맛보다',
  'sleep': '자다', 'wake': '깨다', 'dream': '꿈꾸다',
  'rise': '일어나다', 'sit': '앉다', 'stand': '서다', 'lie': '눕다',
  'walk': '걷다', 'run': '달리다', 'flee': '도망하다', 'pursue': '쫓다',
  'come': '오다', 'go': '가다', 'enter': '들어가다', 'depart': '떠나다',
  'return': '돌아가다', 'turn': '돌이키다', 'pass': '지나가다',
  'send': '보내다', 'receive': '받다', 'give': '주다', 'take': '취하다',
  'carry': '메다', 'bring': '가져오다', 'lift': '들다', 'cast': '던지다',
  'throw': '던지다', 'put': '두다', 'place': '두다', 'set': '세우다',
  'lay': '눕히다', 'lead': '인도하다', 'follow': '따르다', 'guide': '인도하다',
  'fight': '싸우다', 'kill': '죽이다', 'slay': '죽이다', 'murder': '살인하다',
  'save': '구원하다', 'deliver': '건지다', 'rescue': '구원하다',
  'heal': '고치다', 'cure': '낫게 하다', 'restore': '회복시키다',
  'destroy': '멸하다', 'ruin': '망하게 하다', 'break': '깨뜨리다',
  'build': '세우다', 'make': '만들다', 'create': '창조하다', 'form': '빚다',
  'do': '행하다', 'work': '일하다', 'labor': '수고하다',
  'rest': '쉬다', 'stop': '그치다',
  'pray': '기도하다', 'worship': '경배하다', 'serve': '섬기다', 'minister': '섬기다',
  'rule': '다스리다', 'reign': '통치하다', 'govern': '다스리다',
  'judge': '심판하다', 'condemn': '정죄하다', 'justify': '의롭다 하다',
  'forgive': '용서하다', 'pardon': '사면하다',
  'bless': '축복하다', 'curse': '저주하다',
  'sing': '노래하다', 'praise': '찬양하다',
  'sacrifice': '제사하다', 'offer': '드리다',
  'tempt': '시험하다', 'try': '시험하다',
  'sin': '범죄하다', 'transgress': '범죄하다',
  'repent': '회개하다', 'confess': '자백하다',
  'sanctify': '거룩하게 하다', 'consecrate': '구별하다', 'purify': '정결케 하다',
  'wash': '씻다', 'bathe': '목욕하다',
  'plant': '심다', 'sow': '씨 뿌리다', 'reap': '거두다', 'harvest': '추수하다',
  'plow': '갈다', 'thresh': '타작하다', 'grind': '갈다',
  'gather': '모으다', 'scatter': '흩다', 'choose': '택하다', 'select': '택하다',
  'find': '찾다', 'seek': '찾다', 'lose': '잃다',
  'open': '열다', 'shut': '닫다', 'close': '닫다',
  'fill': '채우다', 'empty': '비우다', 'pour': '붓다',
  'cover': '덮다', 'uncover': '드러내다', 'hide': '숨다', 'reveal': '나타내다',
  'show': '보이다', 'shew': '보이다', 'manifest': '나타내다',
  'tear': '찢다', 'rend': '찢다', 'sew': '꿰매다',
  'bind': '매다', 'loose': '풀다', 'tie': '묶다',
  'wound': '상처내다', 'strike': '치다', 'smite': '치다', 'beat': '치다',
  'hurt': '상하게 하다', 'harm': '해롭게 하다',
  'help': '돕다', 'support': '지지하다', 'comfort': '위로하다',
  'meet': '만나다', 'find': '찾다',
  'put on': '입다', 'wear': '입다', 'clothe': '입히다',
  // 추가
  'house': '집', 'home': '집', 'door': '문', 'gate': '문',
  'window': '창', 'wall': '담', 'roof': '지붕', 'floor': '바닥',
  'street': '거리', 'road': '길', 'way': '길', 'path': '길',
  'place': '장소', 'city': '성읍', 'town': '성읍', 'village': '동네',
  'country': '나라', 'land': '땅', 'territory': '지경',
  'tent': '장막', 'camp': '진영', 'dwelling': '거처',
  'field': '밭', 'vineyard': '포도원', 'garden': '동산',
  'pit': '구덩이', 'cave': '굴', 'den': '굴',
  'ship': '배', 'boat': '배', 'sail': '돛',
  'book': '책', 'scroll': '두루마리', 'letter': '편지',
  'word': '말씀', 'speech': '말', 'voice': '음성', 'sound': '소리',
  // 부사 / 기타
  'all': '모든', 'every': '모든', 'each': '각', 'any': '어떤',
  'many': '많은', 'much': '많은', 'few': '적은', 'little': '적은',
  'more': '더', 'less': '덜', 'most': '가장', 'least': '가장 적은',
  'very': '매우', 'too': '너무', 'so': '그래서',
  'now': '이제', 'then': '그 때', 'here': '여기', 'there': '거기',
  'when': '언제', 'where': '어디', 'what': '무엇', 'who': '누구',
  'how': '어떻게', 'why': '왜',
  'yes': '예', 'no': '아니',
  'verily': '진실로', 'truly': '진실로', 'amen': '아멘',
  'behold': '보라', 'lo': '보라',
  'together': '함께', 'apart': '따로',
  'always': '항상', 'never': '결코', 'often': '자주', 'sometimes': '때때로',
  'again': '다시', 'still': '여전히',
  'almost': '거의', 'fully': '온전히', 'completely': '완전히',
  'wholly': '온전히', 'truly': '진실로',
  'with': '함께', 'without': '없이',
  'against': '대적하여', 'for': '위하여', 'toward': '향하여',
  'into': '안으로', 'unto': '에게', 'upon': '위에', 'until': '까지',
  'in': '안에', 'on': '위에', 'at': '에', 'by': '에 의해',
  'from': '으로부터', 'to': '에게', 'of': '의',
}

// 너무 흔해서 의미가 없는 단어 (제외)
const STOP = new Set([
  'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'have', 'has', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'their', 'our',
  'self', 'selves', 'one', 'ones',
  'and', 'or', 'but', 'nor', 'so', 'yet',
  'as', 'than', 'though',
  'compare', 'see', 'figuratively', 'literally', 'specially',
  'impl', 'esp', 'etc', 'ie',
  // 형태소
  'ing', 'ed', 'er', 'ly', 'ness', 'en', 'th', 'eth', 'est',
])

// kjv 필드를 한국어로 번역
function translateKjv(kjvText) {
  if (!kjvText) return null
  // 콤마로 분리, 소문자화, 단어만 추출
  const parts = kjvText.split(',').map(s => s.trim()).filter(Boolean)
  const translated = []
  const seen = new Set()
  for (const part of parts) {
    // 괄호·X·+ 등 메타기호 제거
    const cleaned = part
      .replace(/^\(|\)$/g, '')
      .replace(/\s*\(.*?\)\s*/g, ' ')
      .replace(/[+×x]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    if (!cleaned) continue

    // 1) 통째로 매칭 시도
    if (EN2KO[cleaned]) {
      const ko = EN2KO[cleaned]
      if (!seen.has(ko)) { seen.add(ko); translated.push(ko) }
      continue
    }

    // 2) 단어별 매칭 후 결합
    const words = cleaned.split(/[\s\-]+/).filter(w => w && !STOP.has(w))
    const koWords = []
    for (const w of words) {
      if (EN2KO[w]) koWords.push(EN2KO[w])
    }
    if (koWords.length > 0) {
      const ko = koWords.join(' ')
      if (!seen.has(ko)) { seen.add(ko); translated.push(ko) }
    }
  }
  return translated.length > 0 ? translated.join(', ') : null
}

function enhance(dict, koMap) {
  let countFromMap = 0
  let countFromKjv = 0
  let countAlready = 0
  let countMissing = 0

  for (const [strong, entry] of Object.entries(dict)) {
    if (entry.defKo) {
      countAlready++
      continue
    }

    // 1) 큐레이션된 KO_STRONGS_*_MAP 사용
    const koWords = koMap[strong]
    if (koWords && koWords.length > 0) {
      // 음역 + 한국어 단어들
      const xlit = entry.xlit || ''
      entry.defKo = xlit ? `${xlit}, ${koWords.join(', ')}` : koWords.join(', ')
      countFromMap++
      continue
    }

    // 2) kjv 필드 자동 번역
    const fromKjv = translateKjv(entry.kjv)
    if (fromKjv) {
      const xlit = entry.xlit || ''
      entry.defKo = xlit ? `${xlit}, ${fromKjv}` : fromKjv
      countFromKjv++
      continue
    }

    countMissing++
  }

  return { countAlready, countFromMap, countFromKjv, countMissing }
}

// ─── 메인 ─────────────────────────────────────
const hebPath = path.resolve(__dirname, '../src/data/strongs/hebrew.json')
const grkPath = path.resolve(__dirname, '../src/data/strongs/greek.json')

const heb = JSON.parse(fs.readFileSync(hebPath, 'utf8'))
const grk = JSON.parse(fs.readFileSync(grkPath, 'utf8'))

console.log('히브리어 보강 중...')
const hebStats = enhance(heb, KO_STRONGS_MAP)
console.log(`  기존: ${hebStats.countAlready}`)
console.log(`  KO_STRONGS_MAP에서: ${hebStats.countFromMap}`)
console.log(`  kjv 자동 번역: ${hebStats.countFromKjv}`)
console.log(`  여전히 없음: ${hebStats.countMissing}`)
const hebTotal = hebStats.countAlready + hebStats.countFromMap + hebStats.countFromKjv
console.log(`  → 총 ${hebTotal}/${Object.keys(heb).length} 항목에 한국어 (${(100*hebTotal/Object.keys(heb).length).toFixed(1)}%)`)

console.log()
console.log('헬라어 보강 중...')
const grkStats = enhance(grk, KO_STRONGS_GREEK_MAP)
console.log(`  기존: ${grkStats.countAlready}`)
console.log(`  KO_STRONGS_GREEK_MAP에서: ${grkStats.countFromMap}`)
console.log(`  kjv 자동 번역: ${grkStats.countFromKjv}`)
console.log(`  여전히 없음: ${grkStats.countMissing}`)
const grkTotal = grkStats.countAlready + grkStats.countFromMap + grkStats.countFromKjv
console.log(`  → 총 ${grkTotal}/${Object.keys(grk).length} 항목에 한국어 (${(100*grkTotal/Object.keys(grk).length).toFixed(1)}%)`)

fs.writeFileSync(hebPath, JSON.stringify(heb))
fs.writeFileSync(grkPath, JSON.stringify(grk))
console.log()
console.log(`✓ 저장 완료`)
