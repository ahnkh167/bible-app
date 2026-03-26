import { useState, useCallback, useRef, useMemo } from 'react'
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

function SearchPanel({ bibleData, bibleDataEn, onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [verseResults, setVerseResults] = useState(null)
  const [suggestions, setSuggestions] = useState([]) // 자동완성
  const [selectedBook, setSelectedBook] = useState(null) // 선택된 책
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

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

  return (
    <div className="search-panel">
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

      {/* 자동완성: 책 목록 */}
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

      {/* 선택된 책의 장 목록 */}
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

      {/* 구절 참조 검색 결과 */}
      {verseResults && (
        <div className="verse-ref-results">
          <div className="verse-ref-header">
            <h3>{verseResults.label}</h3>
            <span className="verse-ref-en">{verseResults.book.nameEn} {verseResults.chapter}</span>
            <button className="verse-ref-goto" onClick={() => onNavigate(verseResults.book.id, verseResults.chapter)}>
              해당 장으로 이동 →
            </button>
          </div>
          <div className="verse-ref-list">
            {verseResults.verses.map(v => (
              <div key={v.verse} className="verse-ref-item">
                <span className="verse-ref-num">{v.verse}</span>
                <div className="verse-ref-content">
                  <div className="verse-ref-ko">{v.textKo}</div>
                  {v.textEn && <div className="verse-ref-en-text">{v.textEn}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 키워드 검색 결과 */}
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
    </div>
  )
}

export default SearchPanel
