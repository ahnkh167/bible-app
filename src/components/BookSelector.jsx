import { useState } from 'react'
import './BookSelector.css'

function BookSelector({ oldTestament, newTestament, currentBook, onSelect, bookmarks, onBookmarkSelect }) {
  const [tab, setTab] = useState('old')
  const [selectedBook, setSelectedBook] = useState(null)

  const handleBookClick = (book) => {
    if (selectedBook?.id === book.id) {
      setSelectedBook(null)
    } else {
      setSelectedBook(book)
    }
  }

  const handleChapterClick = (chapter) => {
    if (selectedBook) {
      onSelect(selectedBook.id, chapter)
    }
  }

  const displayBooks = tab === 'old' ? oldTestament : tab === 'new' ? newTestament : null

  return (
    <div className="book-selector">
      {/* 탭 */}
      <div className="tabs">
        <button className={`tab ${tab === 'old' ? 'active' : ''}`} onClick={() => { setTab('old'); setSelectedBook(null); }}>
          구약
        </button>
        <button className={`tab ${tab === 'new' ? 'active' : ''}`} onClick={() => { setTab('new'); setSelectedBook(null); }}>
          신약
        </button>
        <button className={`tab ${tab === 'bookmarks' ? 'active' : ''}`} onClick={() => { setTab('bookmarks'); setSelectedBook(null); }}>
          북마크
        </button>
      </div>

      {/* 북마크 탭 */}
      {tab === 'bookmarks' && (
        <div className="bookmarks-list">
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <p>저장된 북마크가 없습니다</p>
              <p className="empty-hint">읽기 화면에서 구절을 길게 누르면 북마크할 수 있습니다</p>
            </div>
          ) : (
            bookmarks.sort((a, b) => b.timestamp - a.timestamp).map(bm => (
              <button key={bm.key} className="bookmark-item" onClick={() => onBookmarkSelect(bm)}>
                <span className="bookmark-icon">🔖</span>
                <span className="bookmark-text">{bm.bookName} {bm.chapter}:{bm.verse}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* 책 목록 */}
      {displayBooks && !selectedBook && (
        <div className="books-grid">
          {displayBooks.map(book => (
            <button
              key={book.id}
              className={`book-item ${book.id === currentBook ? 'current' : ''}`}
              onClick={() => handleBookClick(book)}
            >
              <span className="book-short">{book.shortName}</span>
              <span className="book-name">{book.name}</span>
              <span className="book-chapters">{book.chapters}장</span>
            </button>
          ))}
        </div>
      )}

      {/* 장 선택 */}
      {selectedBook && (
        <div className="chapter-selector">
          <div className="chapter-header">
            <button className="back-btn" onClick={() => setSelectedBook(null)}>← 뒤로</button>
            <h2>{selectedBook.name}</h2>
          </div>
          <div className="chapters-grid">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                className="chapter-item"
                onClick={() => handleChapterClick(ch)}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BookSelector
