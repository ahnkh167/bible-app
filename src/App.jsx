import { useState, useEffect, useCallback, useMemo } from 'react'
import { books, oldTestamentBooks, newTestamentBooks, getBook } from './data/bibleMeta'
import BookSelector from './components/BookSelector'
import ChapterView from './components/ChapterView'
import SearchPanel from './components/SearchPanel'
import PresentationMode from './components/PresentationMode'
import './App.css'

function App() {
  const [bibleData, setBibleData] = useState(null)
  const [bibleDataEn, setBibleDataEn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentBook, setCurrentBook] = useState('gen')
  const [currentChapter, setCurrentChapter] = useState(1)
  const [view, setView] = useState('read') // 'read' | 'books' | 'search'
  const [fontSize, setFontSize] = useState(18)
  const [showEnglish, setShowEnglish] = useState(true)
  const [presentationMode, setPresentationMode] = useState(false)
  const [presentationVerse, setPresentationVerse] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(null) // 클릭으로 선택된 구절
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('bible-bookmarks')
    return saved ? JSON.parse(saved) : []
  })
  const [lastRead, setLastRead] = useState(() => {
    const saved = localStorage.getItem('bible-last-read')
    return saved ? JSON.parse(saved) : { book: 'gen', chapter: 1 }
  })

  // 한글 + 영어 성경 데이터 로드
  useEffect(() => {
    Promise.all([
      import('./data/bible/bible.json'),
      import('./data/bible/bible_en.json')
    ]).then(([ko, en]) => {
      setBibleData(ko.default)
      setBibleDataEn(en.default)
      setLoading(false)
    }).catch(err => {
      console.error('성경 데이터 로드 실패:', err)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (lastRead) {
      setCurrentBook(lastRead.book)
      setCurrentChapter(lastRead.chapter)
    }
  }, [])

  useEffect(() => {
    const data = { book: currentBook, chapter: currentChapter }
    localStorage.setItem('bible-last-read', JSON.stringify(data))
    setLastRead(data)
  }, [currentBook, currentChapter])

  useEffect(() => {
    localStorage.setItem('bible-bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  const book = useMemo(() => getBook(currentBook), [currentBook])

  const navigateToBook = useCallback((bookId, chapter = 1) => {
    setCurrentBook(bookId)
    setCurrentChapter(chapter)
    setView('read')
  }, [])

  const navigateChapter = useCallback((direction) => {
    if (direction === 'next') {
      if (currentChapter < book.chapters) {
        setCurrentChapter(prev => prev + 1)
      } else {
        const idx = books.findIndex(b => b.id === currentBook)
        if (idx < books.length - 1) {
          setCurrentBook(books[idx + 1].id)
          setCurrentChapter(1)
        }
      }
    } else {
      if (currentChapter > 1) {
        setCurrentChapter(prev => prev - 1)
      } else {
        const idx = books.findIndex(b => b.id === currentBook)
        if (idx > 0) {
          const prevBook = books[idx - 1]
          setCurrentBook(prevBook.id)
          setCurrentChapter(prevBook.chapters)
        }
      }
    }
  }, [currentBook, currentChapter, book])

  const toggleBookmark = useCallback((bookId, chapter, verse) => {
    setBookmarks(prev => {
      const key = `${bookId}-${chapter}-${verse}`
      const exists = prev.find(b => b.key === key)
      if (exists) {
        return prev.filter(b => b.key !== key)
      } else {
        const bookInfo = getBook(bookId)
        return [...prev, {
          key, bookId, chapter, verse,
          bookName: bookInfo.name,
          timestamp: Date.now()
        }]
      }
    })
  }, [])

  const isBookmarked = useCallback((bookId, chapter, verse) => {
    return bookmarks.some(b => b.key === `${bookId}-${chapter}-${verse}`)
  }, [bookmarks])

  // 프레젠테이션 모드 시작
  const startPresentation = useCallback((verseNum = 1) => {
    setPresentationVerse(verseNum)
    setPresentationMode(true)
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-icon">✝</div>
          <h1>성경</h1>
          <p>말씀을 불러오는 중...</p>
          <div className="loading-bar"><div className="loading-bar-fill" /></div>
        </div>
      </div>
    )
  }

  // 프레젠테이션 모드
  if (presentationMode && bibleData) {
    const versesKo = bibleData[currentBook]?.[currentChapter] || {}
    const versesEn = bibleDataEn?.[currentBook]?.[currentChapter] || {}
    return (
      <PresentationMode
        book={book}
        chapter={currentChapter}
        versesKo={versesKo}
        versesEn={versesEn}
        currentVerse={presentationVerse}
        onClose={() => setPresentationMode(false)}
        showEnglish={showEnglish}
        bibleData={bibleData}
        bibleDataEn={bibleDataEn}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {view === 'read' ? (
            <button className="header-btn" onClick={() => setView('books')}>☰</button>
          ) : (
            <button className="header-btn" onClick={() => setView('read')}>←</button>
          )}
        </div>
        <div className="header-center" onClick={() => view === 'read' && setView('books')}>
          <span className="header-title">
            {view === 'read' && `${book?.name} ${currentChapter}장`}
            {view === 'books' && '성경 목록'}
            {view === 'search' && '검색'}
          </span>
        </div>
        <div className="header-right">
          {view === 'read' && (
            <>
              <button
                className={`header-btn lang-btn ${showEnglish ? 'active' : ''}`}
                onClick={() => setShowEnglish(prev => !prev)}
                title={showEnglish ? '영어 숨기기' : '영어 보기'}
              >
                EN
              </button>
              <button
                className="header-btn"
                onClick={() => startPresentation(selectedVerse || 1)}
                title={selectedVerse ? `${selectedVerse}절부터 프레젠테이션` : '프레젠테이션'}
              >
                ▶
              </button>
              <button className="header-btn font-btn" onClick={() => setFontSize(prev => Math.max(14, prev - 2))}>A-</button>
              <button className="header-btn font-btn" onClick={() => setFontSize(prev => Math.min(28, prev + 2))}>A+</button>
            </>
          )}
          <button
            className={`header-btn ${view === 'search' ? 'active' : ''}`}
            onClick={() => setView(view === 'search' ? 'read' : 'search')}
          >
            🔍
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'read' && bibleData && (
          <ChapterView
            bookId={currentBook}
            book={book}
            chapter={currentChapter}
            verses={bibleData[currentBook]?.[currentChapter] || {}}
            versesEn={bibleDataEn?.[currentBook]?.[currentChapter] || {}}
            showEnglish={showEnglish}
            fontSize={fontSize}
            onNavigate={navigateChapter}
            onBookmarkToggle={toggleBookmark}
            isBookmarked={isBookmarked}
            onStartPresentation={startPresentation}
            selectedVerse={selectedVerse}
            onSelectVerse={setSelectedVerse}
          />
        )}
        {view === 'books' && (
          <BookSelector
            oldTestament={oldTestamentBooks}
            newTestament={newTestamentBooks}
            currentBook={currentBook}
            onSelect={navigateToBook}
            bookmarks={bookmarks}
            onBookmarkSelect={(bm) => navigateToBook(bm.bookId, bm.chapter)}
          />
        )}
        {view === 'search' && bibleData && (
          <SearchPanel
            bibleData={bibleData}
            bibleDataEn={bibleDataEn}
            onNavigate={(bookId, chapter) => navigateToBook(bookId, chapter)}
            onPresent={(bookId, chapter, verse) => {
              setCurrentBook(bookId)
              setCurrentChapter(chapter)
              setView('read')
              setPresentationVerse(verse || 1)
              setPresentationMode(true)
            }}
          />
        )}
      </main>

      {view === 'read' && (
        <nav className="bottom-nav">
          <button className="nav-btn" onClick={() => navigateChapter('prev')}
            disabled={currentBook === 'gen' && currentChapter === 1}>
            ◀ 이전
          </button>
          <button className="nav-btn chapter-select" onClick={() => setView('books')}>
            {book?.shortName} {currentChapter}장
          </button>
          <button className="nav-btn" onClick={() => navigateChapter('next')}
            disabled={currentBook === 'rev' && currentChapter === 22}>
            다음 ▶
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
