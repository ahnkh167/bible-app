import { useState, useEffect, useCallback, useMemo } from 'react'
import './PresentationMode.css'

function PresentationMode({ book, chapter, versesKo, versesEn, currentVerse, onClose, showEnglish }) {
  const [verse, setVerse] = useState(currentVerse)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const verseKeys = Object.keys(versesKo).map(Number).sort((a, b) => a - b)
  const totalVerses = verseKeys.length
  const currentIndex = verseKeys.indexOf(verse)

  const koText = versesKo[verse] || ''
  const enText = versesEn[verse] || ''

  // 텍스트 길이에 따라 글자 크기 자동 계산
  const fontSizes = useMemo(() => {
    const totalLen = koText.length + (showEnglish ? enText.length : 0)

    let koSize, enSize
    if (totalLen <= 30) {
      koSize = 'pres-text-xl'    // 매우 큰 글씨
      enSize = 'pres-text-lg'
    } else if (totalLen <= 60) {
      koSize = 'pres-text-lg'    // 큰 글씨
      enSize = 'pres-text-md'
    } else if (totalLen <= 120) {
      koSize = 'pres-text-md'    // 중간
      enSize = 'pres-text-sm'
    } else {
      koSize = 'pres-text-sm'    // 긴 구절
      enSize = 'pres-text-xs'
    }

    return { koSize, enSize }
  }, [koText, enText, showEnglish])

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
    const timer = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(timer)
  }, [showControls, verse])

  const goNext = useCallback(() => {
    if (currentIndex < totalVerses - 1) {
      setVerse(verseKeys[currentIndex + 1])
      setShowControls(true)
    }
  }, [currentIndex, totalVerses, verseKeys])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setVerse(verseKeys[currentIndex - 1])
      setShowControls(true)
    }
  }, [currentIndex, verseKeys])

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

  return (
    <div className="presentation" onClick={handleClick} onMouseMove={() => setShowControls(true)}>
      <div className="presentation-bg">
        <div className="presentation-cross">✝</div>
      </div>

      <div className="presentation-content">
        <div className="presentation-ref">
          {book.name} {chapter}:{verse}
          {showEnglish && <span className="presentation-ref-en"> | {book.nameEn} {chapter}:{verse}</span>}
        </div>

        <div className={`presentation-verse-ko ${fontSizes.koSize}`} key={`ko-${verse}`}>
          {koText}
        </div>

        {showEnglish && (
          <div className={`presentation-verse-en ${fontSizes.enSize}`} key={`en-${verse}`}>
            {enText}
          </div>
        )}
      </div>

      <div className={`presentation-controls ${showControls ? 'visible' : ''}`}>
        <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ✕ 닫기
        </button>
        <div className="pres-nav">
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goPrev(); }} disabled={currentIndex === 0}>◀</button>
          <span className="pres-progress">{currentIndex + 1} / {totalVerses}</span>
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goNext(); }} disabled={currentIndex === totalVerses - 1}>▶</button>
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
