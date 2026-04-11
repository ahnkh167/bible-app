import { useEffect, useRef, useState } from 'react'
import './ChapterView.css'

function ChapterView({ bookId, book, chapter, verses, versesEn, showEnglish, fontSize, onNavigate, onBookmarkToggle, isBookmarked, onStartPresentation, selectedVerse, onSelectVerse, interlinear, onWordClick }) {
  const contentRef = useRef(null)
  const [localSelected, setLocalSelected] = useState(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
    setLocalSelected(null)
  }, [bookId, chapter])

  const verseEntries = Object.entries(verses).sort((a, b) => Number(a[0]) - Number(b[0]))

  const handleVerseClick = (verseNum) => {
    const num = Number(verseNum)
    if (localSelected === num) {
      // 같은 구절 다시 클릭 → 선택 해제
      setLocalSelected(null)
      onSelectVerse?.(null)
    } else {
      setLocalSelected(num)
      onSelectVerse?.(num)
    }
  }

  const handleVerseDoubleClick = (verseNum) => {
    onStartPresentation(Number(verseNum))
  }

  const handleBookmarkClick = (e, verseNum) => {
    e.stopPropagation()
    onBookmarkToggle(bookId, chapter, Number(verseNum))
  }

  // 토큰화된 구절 렌더링 (인터린어 데이터가 있으면 단어별 클릭 가능)
  const renderTokens = (tokens, fallbackText, langClass) => {
    if (!tokens || tokens.length === 0) {
      return <span className={`verse-text ${langClass}`}>{fallbackText}</span>
    }
    return (
      <span className={`verse-text ${langClass}`}>
        {tokens.map((tok, i) => {
          if (!tok.strong) {
            return <span key={i}>{tok.text}</span>
          }
          return (
            <span
              key={i}
              className="word-clickable"
              onClick={(e) => {
                e.stopPropagation()
                onWordClick?.(tok.strong, tok.text.trim())
              }}
            >
              {tok.text}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div className="chapter-view" ref={contentRef}>
      <div className="chapter-title">
        <h2>{book.name}</h2>
        {showEnglish && <h3 className="chapter-title-en">{book.nameEn}</h3>}
        <span className="chapter-number">{chapter}장</span>
      </div>

      <div className={`verses ${showEnglish ? 'bilingual' : ''}`} style={{ fontSize: `${fontSize}px` }}>
        {verseEntries.map(([num, text]) => {
          const interVerse = interlinear?.[String(chapter)]?.[String(num)]
          return (
          <div
            key={num}
            className={`verse ${isBookmarked(bookId, chapter, Number(num)) ? 'bookmarked' : ''} ${localSelected === Number(num) ? 'verse-selected' : ''}`}
            onClick={() => handleVerseClick(num)}
            onDoubleClick={() => handleVerseDoubleClick(num)}
          >
            <span className="verse-num">{num}</span>
            <div className="verse-content">
              {renderTokens(interVerse?.ko, text, 'verse-ko')}
              {showEnglish && versesEn[num] && (
                renderTokens(interVerse?.en, versesEn[num], 'verse-en')
              )}
            </div>
            <div className="verse-actions">
              {localSelected === Number(num) && (
                <button
                  className="verse-play-btn"
                  onClick={(e) => { e.stopPropagation(); onStartPresentation(Number(num)); }}
                  title="이 구절부터 프레젠테이션"
                >
                  ▶
                </button>
              )}
              <button
                className={`verse-bookmark-btn ${isBookmarked(bookId, chapter, Number(num)) ? 'active' : ''}`}
                onClick={(e) => handleBookmarkClick(e, num)}
                title="북마크"
              >
                🔖
              </button>
            </div>
          </div>
          )
        })}
      </div>

      <div className="chapter-end">
        <div className="chapter-end-divider" />
        <p>{book.name} {chapter}장</p>
        <p className="presentation-hint">구절을 클릭 → ▶ 버튼으로 프레젠테이션 시작</p>
        {chapter < book.chapters && (
          <button className="next-chapter-btn" onClick={() => onNavigate('next')}>
            {chapter + 1}장 읽기 →
          </button>
        )}
      </div>
    </div>
  )
}

export default ChapterView
