import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { books } from '../data/bibleMeta'
import './PresentationMode.css'

function PresentationMode({ book, chapter, versesKo, versesEn, currentVerse, onClose, showEnglish, bibleData, bibleDataEn }) {
  const [currentBookId, setCurrentBookId] = useState(book.id)
  const [currentChapter, setCurrentChapter] = useState(chapter)
  const [verse, setVerse] = useState(currentVerse)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const contentRef = useRef(null)
  const containerRef = useRef(null)

  const currentBook = useMemo(() => books.find(b => b.id === currentBookId) || book, [currentBookId, book])
  const curVersesKo = useMemo(() => {
    if (currentBookId === book.id && currentChapter === chapter) return versesKo
    return bibleData?.[currentBookId]?.[currentChapter] || {}
  }, [currentBookId, currentChapter, bibleData, book.id, chapter, versesKo])
  const curVersesEn = useMemo(() => {
    if (currentBookId === book.id && currentChapter === chapter) return versesEn
    return bibleDataEn?.[currentBookId]?.[currentChapter] || {}
  }, [currentBookId, currentChapter, bibleDataEn, book.id, chapter, versesEn])

  const verseKeys = Object.keys(curVersesKo).map(Number).sort((a, b) => a - b)
  const totalVerses = verseKeys.length
  const currentIndex = verseKeys.indexOf(verse)

  const koText = curVersesKo[verse] || ''
  const enText = curVersesEn[verse] || ''

  // 화면에 맞게 폰트 자동 조절
  useLayoutEffect(() => {
    setFontScale(1) // 먼저 리셋
  }, [koText, enText, showEnglish])

  useEffect(() => {
    const fitText = () => {
      const container = containerRef.current
      const content = contentRef.current
      if (!container || !content) return

      // 사용 가능한 높이 (화면 - 상단 참조 - 하단 여백)
      const availableHeight = container.clientHeight
      const contentHeight = content.scrollHeight

      if (contentHeight > availableHeight && fontScale > 0.3) {
        // 비율 계산으로 한번에 줄이기
        const ratio = availableHeight / contentHeight
        const newScale = Math.max(0.3, fontScale * ratio * 0.95) // 약간 여유
        setFontScale(newScale)
      }
    }

    // 렌더링 후 측정
    const timer = requestAnimationFrame(fitText)
    return () => cancelAnimationFrame(timer)
  }, [fontScale, koText, enText, showEnglish])

  // 기본 폰트 크기 계산 - 한국어+영어 합산 길이 기준
  const baseFontSize = useMemo(() => {
    const koLen = koText.length
    const enLen = showEnglish ? enText.length : 0
    // 영어는 글자당 폭이 좁으므로 0.5배로 환산
    const totalLen = koLen + Math.round(enLen * 0.5)
    if (totalLen <= 15) return 100
    if (totalLen <= 25) return 80
    if (totalLen <= 40) return 66
    if (totalLen <= 60) return 54
    if (totalLen <= 80) return 46
    if (totalLen <= 110) return 40
    if (totalLen <= 150) return 36
    if (totalLen <= 200) return 32
    return 28
  }, [koText, enText, showEnglish])

  const enBaseFontSize = useMemo(() => {
    return baseFontSize
  }, [baseFontSize])

  const koFontPx = Math.round(baseFontSize * fontScale)
  const enFontPx = Math.round(enBaseFontSize * fontScale)

  // 다음 장으로 이동
  const goNextChapter = useCallback(() => {
    const bookIdx = books.findIndex(b => b.id === currentBookId)
    if (currentChapter < currentBook.chapters) {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentChapter(prev => prev + 1)
        setVerse(1)
        setTransitioning(false)
      }, 200)
      return true
    } else if (bookIdx < books.length - 1) {
      const nextBook = books[bookIdx + 1]
      setTransitioning(true)
      setTimeout(() => {
        setCurrentBookId(nextBook.id)
        setCurrentChapter(1)
        setVerse(1)
        setTransitioning(false)
      }, 200)
      return true
    }
    return false
  }, [currentBookId, currentChapter, currentBook])

  const goPrevChapter = useCallback(() => {
    const bookIdx = books.findIndex(b => b.id === currentBookId)
    if (currentChapter > 1) {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentChapter(prev => prev - 1)
        setVerse(-1)
        setTransitioning(false)
      }, 200)
      return true
    } else if (bookIdx > 0) {
      const prevBook = books[bookIdx - 1]
      setTransitioning(true)
      setTimeout(() => {
        setCurrentBookId(prevBook.id)
        setCurrentChapter(prevBook.chapters)
        setVerse(-1)
        setTransitioning(false)
      }, 200)
      return true
    }
    return false
  }, [currentBookId, currentChapter])

  useEffect(() => {
    if (verse === -1 && verseKeys.length > 0) {
      setVerse(verseKeys[verseKeys.length - 1])
    }
  }, [verse, verseKeys])

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (e) {}
    }
    enterFullscreen()
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!showControls) return
    const timer = setTimeout(() => setShowControls(false), 4000)
    return () => clearTimeout(timer)
  }, [showControls, verse])

  const goNext = useCallback(() => {
    if (currentIndex < totalVerses - 1) {
      setVerse(verseKeys[currentIndex + 1])
      setShowControls(true)
    } else {
      goNextChapter()
      setShowControls(true)
    }
  }, [currentIndex, totalVerses, verseKeys, goNextChapter])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setVerse(verseKeys[currentIndex - 1])
      setShowControls(true)
    } else {
      goPrevChapter()
      setShowControls(true)
    }
  }, [currentIndex, verseKeys, goPrevChapter])

  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goPrev()
          break
        case 'Escape':
          onClose()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  // 화면 리사이즈 시 재계산
  useEffect(() => {
    const handleResize = () => setFontScale(1)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    setShowControls(true)
    if (x < width / 3) {
      goPrev()
    } else {
      goNext()
    }
  }

  const locationLabel = `${currentBook.name} ${currentChapter}장`

  return (
    <div className={`presentation ${transitioning ? 'pres-transitioning' : ''}`} onClick={handleClick} onMouseMove={() => setShowControls(true)}>
      <div className="presentation-bg">
        <div className="presentation-cross">✝</div>
      </div>

      <div className="presentation-container" ref={containerRef}>
        <div className="presentation-content" ref={contentRef} key={`${currentBookId}-${currentChapter}-${verse}`}>
          <div className="presentation-ref">
            {currentBook.name} {currentChapter}:{verse}
            {showEnglish && <span className="presentation-ref-en"> | {currentBook.nameEn} {currentChapter}:{verse}</span>}
          </div>

          <div className="presentation-verse-ko" style={{ fontSize: `${koFontPx}px` }}>
            {koText}
          </div>

          {showEnglish && enText && (
            <div className="presentation-verse-en" style={{ fontSize: `${enFontPx}px` }}>
              {enText}
            </div>
          )}
        </div>
      </div>

      <div className={`presentation-controls ${showControls ? 'visible' : ''}`}>
        <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ✕ 닫기
        </button>
        <div className="pres-nav">
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goPrev(); }}>◀</button>
          <span className="pres-progress">{locationLabel} {verse}절</span>
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goNext(); }}>▶</button>
        </div>
        <div className="pres-hint">← → 키 또는 화면 클릭으로 이동 | ESC 종료</div>
      </div>

      <div className="presentation-progress-bar">
        <div className="presentation-progress-fill" style={{ width: `${((currentIndex + 1) / totalVerses) * 100}%` }} />
      </div>
    </div>
  )
}

export default PresentationMode
