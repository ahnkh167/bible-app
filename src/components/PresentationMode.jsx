import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { books } from '../data/bibleMeta'
import './PresentationMode.css'

// 한 페이지 내용이 화면 높이의 이 비율 안에 들어와야 함 (하단 컨트롤과 겹치지 않게)
const PAGE_FILL_RATIO = 0.85
const MAX_PAGES = 8

// 텍스트를 n개로 나눌 위치(다음 덩어리 시작 인덱스) 계산.
// 균등 분할 지점 근처에서 문장부호 뒤 → 절이 끝나는 곳(~하고, ~하며 / and, which 앞) → 띄어쓰기 순으로 우선
const KO_CLAUSE_END = /[고며매되사여니면서나]$/
const EN_CLAUSE_START = /^(and|but|which|that|who|for|when|whom|because|unto)\b/i

function findBreaks(text, n) {
  if (n <= 1 || !text) return []
  const punct = []
  const clause = []
  const all = []
  for (let i = 1; i < text.length - 1; i++) {
    if (text[i] !== ' ') continue
    const pos = i + 1
    all.push(pos)
    if (/[,.;:!?)]/.test(text[i - 1])) punct.push(pos)
    else if (KO_CLAUSE_END.test(text.slice(0, i)) || EN_CLAUSE_START.test(text.slice(pos))) clause.push(pos)
  }
  const breaks = []
  let prev = 0
  for (let k = 1; k < n; k++) {
    const target = (text.length * k) / n
    const tolerance = text.length / n / 3
    const nearest = (list) => list
      .filter(pos => pos > prev)
      .reduce((best, pos) => (best === null || Math.abs(pos - target) < Math.abs(best - target) ? pos : best), null)
    const within = (pos) => pos !== null && Math.abs(pos - target) <= tolerance
    let pos = nearest(punct)
    if (!within(pos)) pos = nearest([...punct, ...clause])
    if (!within(pos)) pos = nearest(all)
    if (pos === null) pos = Math.max(prev + 1, Math.round(target))
    breaks.push(pos)
    prev = pos
  }
  return breaks
}

// 텍스트(+인터린어 토큰)를 끊는 위치대로 나눔. 토큰이 경계에 걸치면 토큰도 잘라서 클릭 기능 유지
function splitChunks(text, tokens, breaks) {
  const bounds = [0, ...breaks, text.length]
  const texts = bounds.slice(0, -1).map((start, i) => text.slice(start, bounds[i + 1]))
  const joined = tokens?.map(t => t.text).join('')
  if (!tokens || tokens.length === 0 || joined !== text) {
    return texts.map(t => ({ text: t, tokens: null }))
  }
  const tokenChunks = texts.map(() => [])
  let offset = 0
  for (const tok of tokens) {
    const end = offset + tok.text.length
    for (let i = 0; i < tokenChunks.length; i++) {
      const from = Math.max(offset, bounds[i])
      const to = Math.min(end, bounds[i + 1])
      if (from < to) tokenChunks[i].push({ ...tok, text: tok.text.slice(from - offset, to - offset) })
    }
    offset = end
  }
  return texts.map((t, i) => ({ text: t, tokens: tokenChunks[i] }))
}

// 한국어/영어를 같은 비율로 n페이지로 나눔 → 각 페이지에 서로 대응하는 부분이 함께 표시됨
function buildPages(koText, enText, koTokens, enTokens, n) {
  // 인터린어 토큰이 있으면 기존처럼 토큰 텍스트를 표시 (원문과 주석 등이 조금 다를 수 있음)
  const source = (text, tokens) => (tokens?.length ? tokens.map(t => t.text).join('') : text)
  const koSrc = source(koText, koTokens)
  const enSrc = enText ? source(enText, enTokens) : ''
  const ko = splitChunks(koSrc, koTokens, findBreaks(koSrc, n))
  const en = enSrc ? splitChunks(enSrc, enTokens, findBreaks(enSrc, n)) : []
  return ko.map((k, i) => ({ ko: k, en: en[i] || null }))
}

// 인터린어 데이터 lazy 로더 (Vite glob)
const interlinearModules = import.meta.glob('../data/interlinear/*.json')

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {}
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
    return false
  }
}

function PresentationMode({ book, chapter, versesKo, versesEn, currentVerse, onClose, showEnglish, bibleData, bibleDataEn, onWordClick }) {
  const [currentBookId, setCurrentBookId] = useState(book.id)
  const [currentChapter, setCurrentChapter] = useState(chapter)
  const [verse, setVerse] = useState(currentVerse)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [interlinear, setInterlinear] = useState(null)
  const [copyToast, setCopyToast] = useState(false)
  const contentRef = useRef(null)
  const containerRef = useRef(null)

  // 현재 책의 인터린어 데이터 동적 로드 (있는 책만)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const path = `../data/interlinear/${currentBookId}.json`
        const loader = interlinearModules[path]
        if (loader) {
          const mod = await loader()
          if (!cancelled) setInterlinear(mod.default)
        } else {
          if (!cancelled) setInterlinear(null)
        }
      } catch (e) {
        if (!cancelled) setInterlinear(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentBookId])

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

  // 긴 구절은 1/2, 2/2 … 페이지로 나눠서 표시 (각 페이지에 한국어 일부 + 대응하는 영어 일부).
  // 레이아웃 상태는 구절/화면 단위로 묶어서, 구절이 바뀌면 렌더링 시점에 바로 기본값으로 돌아가게 함
  const interVerse = interlinear?.[String(currentChapter)]?.[String(verse)]
  // 인터린어 데이터가 늦게 로드되면 표시 텍스트가 바뀔 수 있으므로 함께 키에 포함
  const layoutId = `${currentBookId}-${currentChapter}-${verse}-${showEnglish}-${viewport.w}x${viewport.h}-${interVerse ? 'i' : 'p'}`
  const [fit, setFit] = useState({ id: null })
  const curFit = fit.id === layoutId ? fit : { id: layoutId, pages: 1, page: 0, scale: 1 }
  const { pages: pageCount, page, scale: fontScale } = curFit
  const setPage = useCallback((p) => {
    setFit(prev => (prev.id === layoutId ? { ...prev, page: p } : prev))
  }, [layoutId])
  const wantLastPageRef = useRef(false) // 뒤로 이동해 온 경우 마지막 페이지부터 표시

  const shownEnText = showEnglish ? enText : ''
  const pages = useMemo(
    () => buildPages(koText, shownEnText, interVerse?.ko, interVerse?.en, pageCount),
    [koText, shownEnText, interVerse, pageCount]
  )
  const currentPage = pages[Math.min(page, pages.length - 1)]

  // 기본 폰트 크기 - 구절 길이와 무관하게 화면 크기 기준으로 일정하게 유지
  const baseFontSize = useMemo(() => {
    // 프로젝터/파워포인트용 - 1080p 기준 약 97px
    const size = Math.min(viewport.w * 0.06, viewport.h * 0.09)
    const fixed = Math.max(28, Math.min(120, size))
    // 영어 병기 시 두 언어가 함께 들어가도록 약간 작게
    return Math.round(showEnglish ? fixed * 0.85 : fixed)
  }, [viewport, showEnglish])

  // 페이지 수 결정 - 화면 밖에서 미리 그려 보고, 모든 페이지가 들어가는 최소 페이지 수를 선택.
  // 그리기 전에 동기적으로 계산해서 넘치는 레이아웃이 깜빡이지 않음
  useLayoutEffect(() => {
    if (fit.id === layoutId) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content || !koText) return

    const limit = container.clientHeight * PAGE_FILL_RATIO
    const probe = document.createElement('div')
    probe.className = 'presentation-content'
    probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;animation:none;pointer-events:none'
    container.appendChild(probe)
    const measure = (page) => {
      probe.replaceChildren(content.querySelector('.presentation-ref').cloneNode(true))
      const ko = document.createElement('div')
      ko.className = 'presentation-verse-ko'
      ko.style.fontSize = `${baseFontSize}px`
      ko.textContent = page.ko.text
      probe.appendChild(ko)
      if (page.en) {
        const en = document.createElement('div')
        en.className = 'presentation-verse-en'
        en.style.fontSize = `${baseFontSize}px`
        en.textContent = page.en.text
        probe.appendChild(en)
      }
      return probe.scrollHeight
    }

    let chosen = MAX_PAGES
    let tallest = 0
    for (let n = 1; n <= MAX_PAGES; n++) {
      tallest = Math.max(...buildPages(koText, shownEnText, interVerse?.ko, interVerse?.en, n).map(measure))
      if (tallest <= limit) { chosen = n; break }
    }
    probe.remove()

    // MAX_PAGES로도 안 들어가는 극단적인 경우에만 글씨 축소
    const scale = tallest > limit ? Math.max(0.3, (limit / tallest) * 0.95) : 1
    setFit({ id: layoutId, pages: chosen, page: wantLastPageRef.current ? chosen - 1 : 0, scale })
    wantLastPageRef.current = false
  }, [fit.id, layoutId, koText, shownEnText, interVerse, baseFontSize])

  const koFontPx = Math.round(baseFontSize * fontScale)
  const enFontPx = koFontPx

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
    if (page < pageCount - 1) {
      setPage(page + 1)
      setShowControls(true)
    } else if (currentIndex < totalVerses - 1) {
      setVerse(verseKeys[currentIndex + 1])
      setShowControls(true)
    } else {
      goNextChapter()
      setShowControls(true)
    }
  }, [page, pageCount, setPage, currentIndex, totalVerses, verseKeys, goNextChapter])

  const goPrev = useCallback(() => {
    if (page > 0) {
      setPage(page - 1)
      setShowControls(true)
      return
    }
    // 이전 구절이 나뉘어 있으면 마지막 페이지부터 보여줌
    wantLastPageRef.current = true
    if (currentIndex > 0) {
      setVerse(verseKeys[currentIndex - 1])
      setShowControls(true)
    } else {
      if (!goPrevChapter()) wantLastPageRef.current = false
      setShowControls(true)
    }
  }, [page, setPage, currentIndex, verseKeys, goPrevChapter])

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
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
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

  // 토큰 렌더링 (인터린어 데이터가 있으면 단어 클릭 가능)
  const renderTokens = (tokens, fallbackText, extraClass = '') => {
    if (!tokens || tokens.length === 0 || !onWordClick) {
      return <>{fallbackText}</>
    }
    return tokens.map((tok, i) => {
      if (!tok.strong) {
        return <span key={i}>{tok.text}</span>
      }
      return (
        <span
          key={i}
          className={`pres-word-clickable ${extraClass}`}
          onClick={(e) => {
            e.stopPropagation()
            onWordClick(tok.strong, tok.text.trim())
          }}
        >
          {tok.text}
        </span>
      )
    })
  }

  // 구절 복사
  const handleCopy = async (e) => {
    e.stopPropagation()
    const ref = `${currentBook.name} ${currentChapter}:${verse}`
    let text = `${ref}\n${koText}`
    if (showEnglish && enText) text += `\n${enText}`
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 1500)
    }
  }

  return (
    <div className={`presentation ${transitioning ? 'pres-transitioning' : ''}`} onClick={handleClick} onMouseMove={() => setShowControls(true)}>
      <div className="presentation-bg">
        <div className="presentation-cross">✝</div>
      </div>

      <div className="presentation-container" ref={containerRef}>
        <div className="presentation-content" ref={contentRef} key={`${currentBookId}-${currentChapter}-${verse}-${page}`}>
          <div className="presentation-ref">
            {currentBook.name} {currentChapter}:{verse}
            {showEnglish && <span className="presentation-ref-en"> | {currentBook.nameEn} {currentChapter}:{verse}</span>}
            {pageCount > 1 && <span className="presentation-ref-en"> · {page + 1}/{pageCount}</span>}
          </div>

          <div className="presentation-verse-ko" style={{ fontSize: `${koFontPx}px` }}>
            {renderTokens(currentPage.ko.tokens, currentPage.ko.text)}
          </div>

          {currentPage.en && (
            <div className="presentation-verse-en" style={{ fontSize: `${enFontPx}px` }}>
              {renderTokens(currentPage.en.tokens, currentPage.en.text, 'en')}
            </div>
          )}
        </div>
      </div>

      {copyToast && (
        <div className="pres-copy-toast">✓ 복사됨</div>
      )}

      <div className={`presentation-controls ${showControls ? 'visible' : ''}`}>
        <div className="pres-top-row">
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            ✕ 닫기
          </button>
          <button className="pres-ctrl-btn" onClick={handleCopy} title="구절 복사">
            📋 복사
          </button>
        </div>
        <div className="pres-nav">
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goPrev(); }}>◀</button>
          <span className="pres-progress">{locationLabel} {verse}절</span>
          <button className="pres-ctrl-btn" onClick={(e) => { e.stopPropagation(); goNext(); }}>▶</button>
        </div>
        <div className="pres-hint">← → 키 또는 화면 클릭으로 이동 | ESC 종료 | 단어 클릭 → 원어 보기</div>
      </div>

      <div className="presentation-progress-bar">
        <div className="presentation-progress-fill" style={{ width: `${((currentIndex + 1) / totalVerses) * 100}%` }} />
      </div>
    </div>
  )
}

export default PresentationMode
