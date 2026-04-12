import { useEffect, useRef, useState } from 'react'
import './ChapterView.css'

// 클립보드 복사 (Clipboard API + execCommand fallback)
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (e) {
    console.error('복사 실패:', e)
    return false
  }
}

function ChapterView({ bookId, book, chapter, verses, versesEn, showEnglish, fontSize, onNavigate, onBookmarkToggle, isBookmarked, onStartPresentation, selectedVerse, onSelectVerse, interlinear, onWordClick }) {
  const contentRef = useRef(null)
  const jumpBarRef = useRef(null)
  const [localSelected, setLocalSelected] = useState(null)
  const [copiedNum, setCopiedNum] = useState(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
    setLocalSelected(null)
  }, [bookId, chapter])

  const handleCopy = async (e, verseNum, koText, enText) => {
    e.stopPropagation()
    const ref = `${book.name} ${chapter}:${verseNum}`
    let text = `${ref}\n${koText}`
    if (showEnglish && enText) text += `\n${enText}`
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedNum(Number(verseNum))
      setTimeout(() => setCopiedNum(null), 1500)
    }
  }

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

      {/* 구절 빠른 이동 칩 */}
      {verseEntries.length > 10 && (() => {
        const total = Number(verseEntries[verseEntries.length - 1]?.[0]) || 0
        const ranges = []
        for (let start = 1; start <= total; start += 10) {
          const end = Math.min(start + 9, total)
          ranges.push({ start, end, label: `${start}-${end}` })
        }
        return (
          <div className="cv-verse-jump-bar" ref={jumpBarRef}>
            {ranges.map(r => (
              <button
                key={r.start}
                className="cv-verse-jump-chip"
                onClick={() => {
                  const el = document.getElementById(`cv-verse-${r.start}`)
                  if (!el) return
                  const barH = jumpBarRef.current?.offsetHeight || 100
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 56 - barH - 16
                  window.scrollTo({ top: y, behavior: 'smooth' })
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )
      })()}

      <div className={`verses ${showEnglish ? 'bilingual' : ''}`} style={{ fontSize: `${fontSize}px` }}>
        {verseEntries.map(([num, text]) => {
          const interVerse = interlinear?.[String(chapter)]?.[String(num)]
          return (
          <div
            key={num}
            id={`cv-verse-${num}`}
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
                <>
                  <button
                    className="verse-play-btn"
                    onClick={(e) => { e.stopPropagation(); onStartPresentation(Number(num)); }}
                    title="이 구절부터 프레젠테이션"
                  >
                    ▶
                  </button>
                  <button
                    className={`verse-copy-btn ${copiedNum === Number(num) ? 'copied' : ''}`}
                    onClick={(e) => handleCopy(e, num, text, versesEn[num])}
                    title="구절 복사"
                  >
                    {copiedNum === Number(num) ? '✓' : '📋'}
                  </button>
                </>
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
