import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { books, getBook } from '../data/bibleMeta'
import './SearchPanel.css'

function findBook(name) {
  const n = name.toLowerCase().replace(/\s+/g, '')
  let found = books.find(b =>
    b.name === name || b.shortName === name ||
    b.nameEn.toLowerCase() === n ||
    b.name.replace(/\s+/g, '') === n
  )
  if (found) return found
  found = books.find(b =>
    b.name.startsWith(name) ||
    b.nameEn.toLowerCase().startsWith(n) ||
    b.shortName === name
  )
  if (found) return found
  found = books.find(b =>
    b.name.includes(name) ||
    b.nameEn.toLowerCase().includes(n)
  )
  return found || null
}

function findMatchingBooks(query) {
  const q = query.toLowerCase().replace(/\s+/g, '')
  if (!q) return []
  return books.filter(b =>
    b.name.includes(query) ||
    b.shortName === query ||
    b.nameEn.toLowerCase().includes(q) ||
    b.name.startsWith(query) ||
    b.shortName.startsWith(query)
  ).slice(0, 8)
}

// 구절 참조 파싱
function parseVerseReference(query) {
  const q = query.trim()
  const koPattern = /^(.+?)\s*(\d+)\s*[장:]\s*(\d+)\s*(?:[-~]\s*(\d+))?\s*[절]?\s*$/
  const enPattern = /^(.+?)\s+(\d+)\s*:\s*(\d+)\s*(?:[-~]\s*(\d+))?\s*$/
  const chapterOnlyPattern = /^(.+?)\s*(\d+)\s*장?\s*$/

  let match = q.match(koPattern) || q.match(enPattern)
  if (match) {
    const bookName = match[1].trim()
    const chapter = parseInt(match[2])
    const verseStart = parseInt(match[3])
    const verseEnd = match[4] ? parseInt(match[4]) : verseStart
    const book = findBook(bookName)
    if (book) return { book, chapter, verseStart, verseEnd, type: 'verse' }
  }

  match = q.match(chapterOnlyPattern)
  if (match) {
    const bookName = match[1].trim()
    const chapter = parseInt(match[2])
    const book = findBook(bookName)
    if (book) return { book, chapter, verseStart: null, verseEnd: null, type: 'chapter' }
  }

  return null
}

function SearchPanel({ bibleData, bibleDataEn, onNavigate, onPresent, onWordClick }) {
  const [tab, setTab] = useState('bible') // 'bible' | 'word'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [verseResults, setVerseResults] = useState(null)
  const [suggestions, setSuggestions] = useState([]) // 자동완성
  const [selectedBook, setSelectedBook] = useState(null) // 선택된 책
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  // 원어 사전 검색 상태
  const [wordQuery, setWordQuery] = useState('')
  const [wordResults, setWordResults] = useState([])
  const [wordSearching, setWordSearching] = useState(false)
  const [wordSearched, setWordSearched] = useState(false)
  const [strongsHeb, setStrongsHeb] = useState(null)
  const [strongsGrk, setStrongsGrk] = useState(null)
  const [selectedWords, setSelectedWords] = useState([]) // 비교용 선택 목록
  const [compareMode, setCompareMode] = useState(false)
  const wordInputRef = useRef(null)
  const wordSearchTimeoutRef = useRef(null)

  // Strong's 사전 lazy load
  useEffect(() => {
    if (tab === 'word' && !strongsHeb) {
      Promise.all([
        import('../data/strongs/hebrew.json'),
        import('../data/strongs/greek.json')
      ]).then(([h, g]) => {
        setStrongsHeb(h.default)
        setStrongsGrk(g.default)
      })
    }
  }, [tab, strongsHeb])

  // 한국어 유의어 매핑 (검색 확장용)
  const KO_SYNONYMS = useMemo(() => ({
    '예배': ['경배', '예배', '숭배', 'worship'],
    '경배': ['예배', '경배', '숭배', 'worship'],
    '기도': ['기도', '빌', 'prayer', 'pray'],
    '찬양': ['찬양', '찬송', '노래', 'praise'],
    '찬송': ['찬양', '찬송', 'praise', 'hymn'],
    '구원': ['구원', '구속', '건지', 'salvation', 'save'],
    '회개': ['회개', '돌이키', 'repent'],
    '심판': ['심판', '판단', 'judgment', 'judge'],
    '율법': ['율법', '법', 'law'],
    '계명': ['계명', '명령', 'commandment'],
    '복음': ['복음', 'gospel'],
    '천국': ['천국', '나라', '왕국', 'kingdom'],
    '성전': ['성전', '전', 'temple'],
    '제사': ['제사', '제물', 'sacrifice', 'offering'],
    '죄악': ['죄악', '죄', '불의', 'sin', 'iniquity'],
    '용서': ['용서', '사면', 'forgive', 'pardon'],
    '축복': ['축복', '복', 'bless'],
    '저주': ['저주', 'curse'],
    '언약': ['언약', '약속', 'covenant'],
    '속죄': ['속죄', '대속', 'atone', 'propitiation'],
    '거룩': ['거룩', '성결', '성별', 'holy', 'sanctify'],
    '영원': ['영원', '영생', 'eternal', 'everlasting'],
    '은혜': ['은혜', '호의', 'grace', 'favor'],
    '긍휼': ['긍휼', '자비', '불쌍히', 'mercy', 'compassion'],
    '인자': ['인자', '사랑', '자비', 'lovingkindness', 'mercy'],
  }), [])

  // 원어 사전 검색
  const performWordSearch = useCallback((q) => {
    if (!q || q.trim().length < 1 || !strongsHeb || !strongsGrk) return
    setWordSearching(true)
    setWordSearched(true)

    setTimeout(() => {
      const query = q.trim().toLowerCase()
      const found = []
      const maxResults = 80

      // Strong's 번호 직접 검색 (H1234, G5678)
      const strongsMatch = query.match(/^([hg])(\d+)$/i)
      if (strongsMatch) {
        const key = strongsMatch[1].toUpperCase() + strongsMatch[2]
        const dict = key.startsWith('H') ? strongsHeb : strongsGrk
        const entry = dict[key]
        if (entry) {
          found.push({ strong: key, ...entry, matchType: 'exact', lang: key.startsWith('H') ? 'heb' : 'grk' })
        }
      }

      if (found.length === 0) {
        // 한국어 포함 여부 판단
        const hasKorean = /[가-힣]/.test(query)
        const hasEnglish = /[a-z]/.test(query)

        // 유의어 확장
        const synonyms = hasKorean ? (KO_SYNONYMS[query] || [query]) : [query]
        const koTerms = synonyms.filter(s => /[가-힣]/.test(s))
        const enTerms = synonyms.filter(s => /[a-z]/.test(s))

        const searchDict = (dict, lang) => {
          for (const [strong, entry] of Object.entries(dict)) {
            if (found.length >= maxResults) break

            let matchType = null
            let score = 0

            // 원어(lemma) 매칭
            if (entry.lemma && entry.lemma.toLowerCase().includes(query)) {
              matchType = 'lemma'
              score = 100
            }
            // 음역(xlit) 매칭
            else if (entry.xlit && entry.xlit.toLowerCase().includes(query)) {
              matchType = 'xlit'
              score = 90
            }
            // 한국어 정의 매칭 (유의어 확장 포함)
            else if (hasKorean && entry.defKo) {
              for (const term of koTerms) {
                if (entry.defKo.includes(term)) {
                  matchType = 'defKo'
                  const parts = entry.defKo.split(/[,，·\s]+/)
                  const isOriginal = term === query
                  if (parts.some(p => p.trim() === term)) {
                    score = isOriginal ? 85 : 78
                  } else if (entry.defKo.startsWith(term)) {
                    score = isOriginal ? 80 : 72
                  } else {
                    score = isOriginal ? 60 : 50
                  }
                  break
                }
              }
              // 영어 유의어로도 검색
              if (!matchType && enTerms.length > 0) {
                for (const term of enTerms) {
                  if (entry.kjv && entry.kjv.toLowerCase().includes(term)) {
                    matchType = 'kjv'
                    score = 65
                    break
                  }
                  if (entry.defEn && entry.defEn.toLowerCase().includes(term)) {
                    matchType = 'defEn'
                    score = 55
                    break
                  }
                }
              }
            }
            // 영어 정의 매칭
            else if (hasEnglish && entry.defEn && entry.defEn.toLowerCase().includes(query)) {
              matchType = 'defEn'
              const defWords = entry.defEn.toLowerCase().split(/[\s,;()]+/)
              if (defWords.includes(query)) {
                score = 75
              } else {
                score = 50
              }
            }
            // KJV 용례 매칭
            else if (hasEnglish && entry.kjv && entry.kjv.toLowerCase().includes(query)) {
              matchType = 'kjv'
              const kjvWords = entry.kjv.toLowerCase().split(/[\s,;()]+/)
              if (kjvWords.includes(query)) {
                score = 70
              } else {
                score = 40
              }
            }

            if (matchType) {
              found.push({ strong, ...entry, matchType, score, lang })
            }
          }
        }

        searchDict(strongsHeb, 'heb')
        searchDict(strongsGrk, 'grk')

        // 점수 순으로 정렬
        found.sort((a, b) => b.score - a.score)
      }

      setWordResults(found)
      setWordSearching(false)
    }, 10)
  }, [strongsHeb, strongsGrk])

  const handleWordInputChange = (e) => {
    const value = e.target.value
    setWordQuery(value)
    setWordSearched(false)
    setWordResults([])

    if (wordSearchTimeoutRef.current) clearTimeout(wordSearchTimeoutRef.current)
    if (value.trim().length >= 2) {
      wordSearchTimeoutRef.current = setTimeout(() => performWordSearch(value), 300)
    }
  }

  const handleWordSubmit = (e) => {
    e.preventDefault()
    if (wordSearchTimeoutRef.current) clearTimeout(wordSearchTimeoutRef.current)
    performWordSearch(wordQuery)
  }

  const toggleWordSelect = (entry) => {
    setSelectedWords(prev => {
      const exists = prev.find(w => w.strong === entry.strong)
      if (exists) return prev.filter(w => w.strong !== entry.strong)
      if (prev.length >= 4) return prev // 최대 4개
      return [...prev, entry]
    })
  }

  const isWordSelected = (strong) => selectedWords.some(w => w.strong === strong)

  // 자동완성 업데이트
  const updateSuggestions = useCallback((value) => {
    if (!value.trim()) {
      setSuggestions([])
      setSelectedBook(null)
      return
    }

    // 숫자만 입력된 경우 (선택된 책이 있으면 장 선택)
    if (selectedBook && /^\d+$/.test(value.trim())) {
      return
    }

    // 구절 참조 형식이면 자동완성 숨기기
    const ref = parseVerseReference(value)
    if (ref) {
      setSuggestions([])
      return
    }

    // 책이름 매칭
    const matches = findMatchingBooks(value.trim())
    setSuggestions(matches)
  }, [selectedBook])

  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      setVerseResults(null)
      setSearched(false)
      return
    }

    setSearching(true)
    setSearched(true)
    setSuggestions([])

    setTimeout(() => {
      // 1. 구절 참조 검색 시도
      const ref = parseVerseReference(searchQuery)
      if (ref) {
        const bookData = bibleData[ref.book.id]
        const bookDataEn = bibleDataEn?.[ref.book.id]

        if (ref.type === 'chapter' && bookData?.[ref.chapter]) {
          const verses = []
          const chapterData = bookData[ref.chapter]
          const chapterDataEn = bookDataEn?.[ref.chapter]
          for (const [vNum, text] of Object.entries(chapterData)) {
            verses.push({ verse: parseInt(vNum), textKo: text, textEn: chapterDataEn?.[vNum] || '' })
          }
          verses.sort((a, b) => a.verse - b.verse)
          setVerseResults({ book: ref.book, chapter: ref.chapter, verses, label: `${ref.book.name} ${ref.chapter}장` })
          setResults([])
          setSearching(false)
          return
        }

        if (ref.type === 'verse' && bookData?.[ref.chapter]) {
          const verses = []
          const chapterData = bookData[ref.chapter]
          const chapterDataEn = bookDataEn?.[ref.chapter]
          for (let v = ref.verseStart; v <= ref.verseEnd; v++) {
            if (chapterData[v]) {
              verses.push({ verse: v, textKo: chapterData[v], textEn: chapterDataEn?.[v] || '' })
            }
          }
          if (verses.length > 0) {
            const label = ref.verseStart === ref.verseEnd
              ? `${ref.book.name} ${ref.chapter}장 ${ref.verseStart}절`
              : `${ref.book.name} ${ref.chapter}장 ${ref.verseStart}-${ref.verseEnd}절`
            setVerseResults({ book: ref.book, chapter: ref.chapter, verses, label })
            setResults([])
            setSearching(false)
            return
          }
        }
      }

      // 2. 키워드 검색
      setVerseResults(null)
      if (searchQuery.trim().length < 2) {
        setResults([])
        setSearching(false)
        return
      }

      const found = []
      const q = searchQuery.trim().toLowerCase()
      const maxResults = 100

      for (const bookMeta of books) {
        if (found.length >= maxResults) break
        const bookData = bibleData[bookMeta.id]
        if (!bookData) continue
        for (const [chapterNum, verses] of Object.entries(bookData)) {
          if (found.length >= maxResults) break
          for (const [verseNum, text] of Object.entries(verses)) {
            if (found.length >= maxResults) break
            if (text.toLowerCase().includes(q)) {
              found.push({
                bookId: bookMeta.id, bookName: bookMeta.name, shortName: bookMeta.shortName,
                chapter: parseInt(chapterNum), verse: parseInt(verseNum), text,
                matchIndex: text.toLowerCase().indexOf(q), matchLength: q.length
              })
            }
          }
        }
      }
      setResults(found)
      setSearching(false)
    }, 10)
  }, [bibleData, bibleDataEn])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSearched(false)
    setVerseResults(null)
    setResults([])
    updateSuggestions(value)

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      // 자동으로 구절 참조 검색 시도
      const ref = parseVerseReference(value)
      if (ref) {
        performSearch(value)
      }
    }, 500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    setSuggestions([])
    performSearch(query)
  }

  // 책 선택 시 장 목록 표시
  const selectBook = (book) => {
    setSelectedBook(book)
    setSuggestions([])
    setQuery(book.name + ' ')
    inputRef.current?.focus()
  }

  // 장 선택 시 바로 이동
  const selectChapter = (book, chapter) => {
    setSelectedBook(null)
    setSuggestions([])
    setQuery(`${book.name} ${chapter}장`)
    onNavigate(book.id, chapter)
  }

  const highlightText = (text, matchIndex, matchLength) => {
    if (matchIndex < 0) return text
    const before = text.slice(0, matchIndex)
    const match = text.slice(matchIndex, matchIndex + matchLength)
    const after = text.slice(matchIndex + matchLength)
    return <>{before}<mark>{match}</mark>{after}</>
  }

  // 원어 카드 렌더링
  const renderWordCard = (entry, idx, isCompare = false) => {
    const isHebrew = entry.strong.startsWith('H')
    return (
      <div
        key={entry.strong + idx}
        className={`ws-card${isWordSelected(entry.strong) ? ' ws-card-selected' : ''}${isCompare ? ' ws-card-compare' : ''}`}
        onClick={() => onWordClick?.(entry.strong, '')}
      >
        {/* 선택 체크 */}
        <button
          className={`ws-card-check${isWordSelected(entry.strong) ? ' checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWordSelect(entry) }}
          title="비교 목록에 추가"
        >
          {isWordSelected(entry.strong) ? '✓' : '+'}
        </button>

        <div className="ws-card-header">
          <span className="ws-card-strong">{entry.strong}</span>
          <span className={`ws-card-lang ${isHebrew ? 'heb' : 'grk'}`}>
            {isHebrew ? '히브리어' : '헬라어'}
          </span>
        </div>

        <div className={`ws-card-lemma ${isHebrew ? 'hebrew' : 'greek'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
          {entry.lemma}
        </div>
        {entry.xlit && <div className="ws-card-translit">{entry.xlit}</div>}

        {entry.defKo && (
          <div className="ws-card-def">
            <span className="ws-card-def-label">한국어</span>
            <span className="ws-card-def-text">{entry.defKo}</span>
          </div>
        )}

        <div className="ws-card-def">
          <span className="ws-card-def-label">English</span>
          <span className="ws-card-def-text en">{(entry.defEn || '').slice(0, 150)}{(entry.defEn || '').length > 150 ? '…' : ''}</span>
        </div>

        {entry.kjv && (
          <div className="ws-card-kjv">
            KJV: {entry.kjv.slice(0, 100)}{entry.kjv.length > 100 ? '…' : ''}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="search-panel">
      {/* 탭 바 */}
      <div className="search-tabs">
        <button
          className={`search-tab${tab === 'bible' ? ' active' : ''}`}
          onClick={() => setTab('bible')}
        >
          성경 검색
        </button>
        <button
          className={`search-tab${tab === 'word' ? ' active' : ''}`}
          onClick={() => { setTab('word'); setTimeout(() => wordInputRef.current?.focus(), 100) }}
        >
          원어 사전
        </button>
      </div>

      {/* ─── 성경 검색 탭 ─── */}
      {tab === 'bible' && (
        <>
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="성경 검색 (예: 창세기, 요 3:16, 사랑)"
                value={query}
                onChange={handleInputChange}
                autoFocus
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => {
                  setQuery(''); setResults([]); setVerseResults(null); setSearched(false);
                  setSuggestions([]); setSelectedBook(null); inputRef.current?.focus();
                }}>✕</button>
              )}
            </div>
          </form>

          {suggestions.length > 0 && !searched && (
            <div className="autocomplete-list">
              {suggestions.map(b => (
                <button key={b.id} className="autocomplete-item" onClick={() => selectBook(b)}>
                  <span className="ac-name">{b.name}</span>
                  <span className="ac-meta">{b.nameEn} · {b.chapters}장</span>
                </button>
              ))}
            </div>
          )}

          {selectedBook && !searched && suggestions.length === 0 && (
            <div className="chapter-grid-wrap">
              <div className="chapter-grid-header">
                <h3>{selectedBook.name} <span className="cg-en">{selectedBook.nameEn}</span></h3>
                <p className="cg-sub">장을 선택하세요</p>
              </div>
              <div className="chapter-grid">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button key={ch} className="chapter-grid-btn" onClick={() => selectChapter(selectedBook, ch)}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searching && <div className="search-status">검색 중...</div>}

          {verseResults && (
            <div className="verse-ref-results">
              <div className="verse-ref-header">
                <h3>{verseResults.label}</h3>
                <span className="verse-ref-en">{verseResults.book.nameEn} {verseResults.chapter}</span>
                <div className="verse-ref-actions">
                  <button className="verse-ref-goto" onClick={() => onNavigate(verseResults.book.id, verseResults.chapter)}>
                    해당 장으로 이동 →
                  </button>
                  {onPresent && (
                    <button className="verse-ref-present" onClick={() => onPresent(verseResults.book.id, verseResults.chapter, verseResults.verses[0]?.verse || 1)}>
                      ▶ 프레젠테이션
                    </button>
                  )}
                </div>
              </div>

              {/* 구절 빠른 이동 칩 */}
              {verseResults.verses.length > 10 && (
                <div className="verse-jump-bar">
                  {(() => {
                    const total = verseResults.verses[verseResults.verses.length - 1]?.verse || 0
                    const ranges = []
                    for (let start = 1; start <= total; start += 10) {
                      const end = Math.min(start + 9, total)
                      ranges.push({ start, end, label: `${start}-${end}` })
                    }
                    return ranges.map(r => (
                      <button
                        key={r.start}
                        className="verse-jump-chip"
                        onClick={() => {
                          const el = document.getElementById(`vref-${r.start}`)
                          if (!el) return
                          // 점프바 높이 감안하여 위치 보정
                          const y = el.getBoundingClientRect().top + window.pageYOffset - 130
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }}
                      >
                        {r.label}
                      </button>
                    ))
                  })()}
                </div>
              )}

              <div className="verse-ref-list">
                {verseResults.verses.map(v => (
                  <button
                    key={v.verse}
                    id={`vref-${v.verse}`}
                    className="verse-ref-item"
                    onClick={() => onPresent?.(verseResults.book.id, verseResults.chapter, v.verse)}
                  >
                    <span className="verse-ref-num">{v.verse}</span>
                    <div className="verse-ref-content">
                      <div className="verse-ref-ko">{v.textKo}</div>
                      {v.textEn && <div className="verse-ref-en-text">{v.textEn}</div>}
                    </div>
                    <span className="verse-ref-play">▶</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searched && !searching && !verseResults && (
            <div className="search-status">
              {results.length > 0 ? `${results.length}개 결과${results.length >= 100 ? ' (최대 100개)' : ''}` : '검색 결과가 없습니다'}
            </div>
          )}

          <div className="search-results">
            {results.map((result, idx) => (
              <button
                key={`${result.bookId}-${result.chapter}-${result.verse}-${idx}`}
                className="search-result"
                onClick={() => onNavigate(result.bookId, result.chapter)}
              >
                <div className="result-ref">{result.bookName} {result.chapter}:{result.verse}</div>
                <div className="result-text">{highlightText(result.text, result.matchIndex, result.matchLength)}</div>
              </button>
            ))}
          </div>

          {!searched && !selectedBook && suggestions.length === 0 && !query && (
            <div className="search-suggestions">
              <p className="suggestion-title">검색 예시</p>
              <div className="suggestion-chips">
                {['창세기 1장 1절', '시편 23장', '요 3:16', '롬 8:28-30'].map(word => (
                  <button key={word} className="suggestion-chip" onClick={() => { setQuery(word); performSearch(word); }}>{word}</button>
                ))}
              </div>
              <p className="suggestion-title" style={{ marginTop: 24 }}>키워드 검색</p>
              <div className="suggestion-chips">
                {['사랑', '믿음', '소망', '은혜', '평안', '기도'].map(word => (
                  <button key={word} className="suggestion-chip" onClick={() => { setQuery(word); performSearch(word); }}>{word}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── 원어 사전 탭 ─── */}
      {tab === 'word' && (
        <>
          <form className="search-form" onSubmit={handleWordSubmit}>
            <div className="search-input-wrap">
              <span className="search-icon">📖</span>
              <input
                ref={wordInputRef}
                type="text"
                className="search-input"
                placeholder="원어 검색 (예: 사랑, worship, G25, H2617)"
                value={wordQuery}
                onChange={handleWordInputChange}
              />
              {wordQuery && (
                <button type="button" className="search-clear" onClick={() => {
                  setWordQuery(''); setWordResults([]); setWordSearched(false);
                  wordInputRef.current?.focus();
                }}>✕</button>
              )}
            </div>
          </form>

          {/* 비교 모드 바 */}
          {selectedWords.length > 0 && (
            <div className="ws-compare-bar">
              <div className="ws-compare-info">
                <span className="ws-compare-count">{selectedWords.length}개 선택</span>
                <span className="ws-compare-items">
                  {selectedWords.map(w => w.strong).join(', ')}
                </span>
              </div>
              <div className="ws-compare-actions">
                <button
                  className={`ws-compare-btn${compareMode ? ' active' : ''}`}
                  onClick={() => setCompareMode(prev => !prev)}
                >
                  {compareMode ? '목록으로' : '비교하기'}
                </button>
                <button className="ws-compare-clear" onClick={() => { setSelectedWords([]); setCompareMode(false) }}>
                  초기화
                </button>
              </div>
            </div>
          )}

          {/* 비교 모드 */}
          {compareMode && selectedWords.length > 0 && (
            <div className="ws-compare-grid">
              {selectedWords.map((w, i) => renderWordCard(w, i, true))}
            </div>
          )}

          {/* 사전 로딩 중 */}
          {tab === 'word' && !strongsHeb && (
            <div className="search-status">원어 사전을 불러오는 중...</div>
          )}

          {/* 결과 */}
          {wordSearching && <div className="search-status">검색 중...</div>}

          {wordSearched && !wordSearching && !compareMode && (
            <div className="search-status">
              {wordResults.length > 0
                ? `${wordResults.length}개 원어 항목${wordResults.length >= 80 ? ' (최대 80개)' : ''}`
                : '검색 결과가 없습니다'}
            </div>
          )}

          {!compareMode && (
            <div className="ws-results">
              {wordResults.map((entry, idx) => renderWordCard(entry, idx))}
            </div>
          )}

          {/* 검색 전 안내 */}
          {!wordSearched && !wordQuery && strongsHeb && (
            <div className="search-suggestions">
              <p className="suggestion-title">원어 검색</p>
              <p className="ws-help-text">
                한국어, 영어, 원어, Strong 번호로 검색할 수 있습니다.<br/>
                여러 단어를 선택하여 원어 뜻을 비교해 보세요.
              </p>
              <p className="suggestion-title" style={{ marginTop: 20 }}>한국어 검색</p>
              <div className="suggestion-chips">
                {['사랑', '예배', '기도', '은혜', '영광', '거룩', '죄', '구원', '믿음', '평안'].map(word => (
                  <button key={word} className="suggestion-chip" onClick={() => { setWordQuery(word); performWordSearch(word); }}>{word}</button>
                ))}
              </div>
              <p className="suggestion-title" style={{ marginTop: 20 }}>영어 검색</p>
              <div className="suggestion-chips">
                {['love', 'worship', 'prayer', 'grace', 'holy', 'sin', 'faith', 'salvation'].map(word => (
                  <button key={word} className="suggestion-chip" onClick={() => { setWordQuery(word); performWordSearch(word); }}>{word}</button>
                ))}
              </div>
              <p className="suggestion-title" style={{ marginTop: 20 }}>Strong 번호</p>
              <div className="suggestion-chips">
                {['H430', 'H2617', 'G26', 'G4102', 'G5485'].map(word => (
                  <button key={word} className="suggestion-chip" onClick={() => { setWordQuery(word); performWordSearch(word); }}>{word}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPanel
