import { useState, useEffect, useCallback, useMemo } from 'react'
import { books } from '../data/bibleMeta'
import './PresentationMode.css'

function PresentationMode({ book, chapter, versesKo, versesEn, currentVerse, onClose, showEnglish, bibleData, bibleDataEn }) {
  const [currentBookId, setCurrentBookId] = useState(book.id)
  const [currentChapter, setCurrentChapter] = useState(chapter)
  const [verse, setVerse] = useState(currentVerse)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  // 현재 책/장의 데이터
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

  // 텍스트 길이에 따라 글자 크기 자동 계산 - 최대한 크게
  const fontSizes = useMemo(() => {
    const koLen = koText.length
    const enLen = showEnglish ? enText.length : 0
    let koSize, enSize
    if (koLen <= 20) {
      koSize = 'pres-text-xl'
      enSize = 'pres-text-lg'
    } else if (koLen <= 40) {
      koSize = 'pres-text-lg'
      enSize = 'pres-text-md'
    } else if (koLen <= 80) {
      koSize = 'pres-text-md'
      enSize = 'pres-text-sm'
    } else if (koLen <= 150) {
      koSize = 'pres-text-sm'
      enSize = 'pres-text-xs'
    } else {
      koSize = 'pres-text-xs'
      enSize = 'pres-text-xs'
    }
    return { koSize, enSize }
  }, [koText, enText, showEnglish])

  // 다음 장으로 이동
  const goNextChapter = useCallback(() => {
    const bookIdx = books.findIndex(b => b.id === currentBookId)
    if (currentChapter < currentBook.chapters) {
      // 같은 책의 다음 장
      setTransitioning(true)
      setTimeout(() => {
        setCurrentChapter(prev => prev + 1)
        setVerse(1)
        setTransitioning(false)
      }, 200)
      return true
    } else if (bookIdx < books.length - 1) {
      // 다음 책의 1장
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

  // 이전 장으로 이동
  const goPrevChapter = useCallback(() => {
    const bookIdx = books.findIndex(b => b.id === currentBookId)
    if (currentChapter > 1) {
      // 같은 책의 이전 장
      setTransitioning(true)
      setTimeout(() => {
        setCurrentChapter(prev => prev - 1)
        setVerse(-1) // 마지막 절로 세팅 (아래에서 처리)
        setTransitioning(false)
      }, 200)
      return true
    } else if (bookIdx > 0) {
      // 이전 책의 마지막 장
      const prevBook = books[bookIdx - 1]
      setTransitioning(true)
      setTimeout(() => {
        setCurrentBookId(prevBook.id)
        setCurrentChapter(prevBook.chapters)
        setVerse(-1) // 마지막 절로
        setTransitioning(false)
      }, 200)
      return true
    }
    return false
  }, [currentBookId, currentChapter])

  // verse가 -1이면 마지막 절로 세팅
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
      // 마지막 절 → 다음 장
      goNextChapter()
      setShowControls(true)
    }
  }, [currentIndex, totalVerses, verseKeys, goNextChapter])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setVerse(verseKeys[currentIndex - 1])
      setShowControls(true)
    } else {
      // 첫 절 → 이전 장 마지막 절
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

  // 현재 위치 표시 텍스트
  const locationLabel = `${currentBook.name} ${currentChapter}장`
  const locationLabelEn = `${currentBook.nameEn} ${currentChapter}`

  return (
    <div className={`presentation ${transitioning ? 'pres-transitioning' : ''}`} onClick={handleClick} onMouseMove={() => setShowControls(true)}>
      <div className="presentation-bg">
        <div className="presentation-cross">✝</div>
      </div>

      <div className="presentation-content" key={`${currentBookId}-${currentChapter}-${verse}`}>
        <div className="presentation-ref">
          {currentBook.name} {currentChapter}:{verse}
          {showEnglish && <span className="presentation-ref-en"> | {currentBook.nameEn} {currentChapter}:{verse}</span>}
        </div>

        <div className={`presentation-verse-ko ${fontSizes.koSize}`}>
          {koText}
        </div>

        {showEnglish && enText && (
          <div className={`presentation-verse-en ${fontSizes.enSize}`}>
            {enText}
          </div>
        )}
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
        <div className="pres-hint">← → 키 또는 화면 클릭으로 이동 | 장 끝에서 자동으로 다음 장 이동 | ESC 종료</div>
      </div>

      <div className="presentation-progress-bar">
        <div className="presentation-progress-fill" style={{ width: `${((currentIndex + 1) / totalVerses) * 100}%` }} />
      </div>
    </div>
  )
}

export default PresentationMode
