import { useEffect, useRef } from 'react'
import './ChapterView.css'

function ChapterView({ bookId, book, chapter, verses, versesEn, showEnglish, fontSize, onNavigate, onBookmarkToggle, isBookmarked, onStartPresentation }) {
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
  }, [bookId, chapter])

  const verseEntries = Object.entries(verses).sort((a, b) => Number(a[0]) - Number(b[0]))

  const handleVerseClick = (verseNum) => {
    onBookmarkToggle(bookId, chapter, Number(verseNum))
  }

  const handleVerseDoubleClick = (verseNum) => {
    onStartPresentation(Number(verseNum))
  }

  return (
    <div className="chapter-view" ref={contentRef}>
      <div className="chapter-title">
        <h2>{book.name}</h2>
        {showEnglish && <h3 className="chapter-title-en">{book.nameEn}</h3>}
        <span className="chapter-number">{chapter}장</span>
      </div>

      <div className={`verses ${showEnglish ? 'bilingual' : ''}`} style={{ fontSize: `${fontSize}px` }}>
        {verseEntries.map(([num, text]) => (
          <div
            key={num}
            className={`verse ${isBookmarked(bookId, chapter, Number(num)) ? 'bookmarked' : ''}`}
            onClick={() => handleVerseClick(num)}
            onDoubleClick={() => handleVerseDoubleClick(num)}
          >
            <span className="verse-num">{num}</span>
            <div className="verse-content">
              <span className="verse-text verse-ko">{text}</span>
              {showEnglish && versesEn[num] && (
                <span className="verse-text verse-en">{versesEn[num]}</span>
              )}
            </div>
            {isBookmarked(bookId, chapter, Number(num)) && (
              <span className="verse-bookmark">🔖</span>
            )}
          </div>
        ))}
      </div>

      <div className="chapter-end">
        <div className="chapter-end-divider" />
        <p>{book.name} {chapter}장</p>
        <p className="presentation-hint">구절을 더블클릭하면 프레젠테이션이 시작됩니다</p>
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
