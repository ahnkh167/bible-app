import { useState, useCallback, useRef } from 'react'
import { books, getBook } from '../data/bibleMeta'
import './SearchPanel.css'

function SearchPanel({ bibleData, onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    setSearching(true)
    setSearched(true)

    // 비동기로 검색하여 UI 블로킹 방지
    setTimeout(() => {
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
                bookId: bookMeta.id,
                bookName: bookMeta.name,
                shortName: bookMeta.shortName,
                chapter: parseInt(chapterNum),
                verse: parseInt(verseNum),
                text,
                // 하이라이트 위치
                matchIndex: text.toLowerCase().indexOf(q),
                matchLength: q.length
              })
            }
          }
        }
      }

      setResults(found)
      setSearching(false)
    }, 10)
  }, [bibleData])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    performSearch(query)
  }

  const highlightText = (text, matchIndex, matchLength) => {
    if (matchIndex < 0) return text
    const before = text.slice(0, matchIndex)
    const match = text.slice(matchIndex, matchIndex + matchLength)
    const after = text.slice(matchIndex + matchLength)
    return (
      <>
        {before}<mark>{match}</mark>{after}
      </>
    )
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
            placeholder="성경 구절 검색..."
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
          {query && (
            <button type="button" className="search-clear" onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus(); }}>
              ✕
            </button>
          )}
        </div>
      </form>

      {searching && (
        <div className="search-status">검색 중...</div>
      )}

      {searched && !searching && (
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
            <div className="result-ref">
              {result.bookName} {result.chapter}:{result.verse}
            </div>
            <div className="result-text">
              {highlightText(result.text, result.matchIndex, result.matchLength)}
            </div>
          </button>
        ))}
      </div>

      {!searched && (
        <div className="search-suggestions">
          <p className="suggestion-title">추천 검색어</p>
          <div className="suggestion-chips">
            {['사랑', '믿음', '소망', '은혜', '평안', '기도', '감사', '축복'].map(word => (
              <button
                key={word}
                className="suggestion-chip"
                onClick={() => { setQuery(word); performSearch(word); }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
