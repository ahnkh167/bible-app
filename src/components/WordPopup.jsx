import { useEffect } from 'react'
import './WordPopup.css'

function WordPopup({ strong, entry, wordText, onClose }) {
  // ESC로 닫기
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!entry) {
    return (
      <div className="wordpop-overlay" onClick={onClose}>
        <div className="wordpop-card" onClick={(e) => e.stopPropagation()}>
          <button className="wordpop-close" onClick={onClose}>✕</button>
          <div className="wordpop-loading">원어 사전을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const isHebrew = strong.startsWith('H')
  const languageLabel = isHebrew ? '히브리어' : '헬라어'
  const languageLabelEn = isHebrew ? 'Hebrew' : 'Greek'

  return (
    <div className="wordpop-overlay" onClick={onClose}>
      <div className="wordpop-card" onClick={(e) => e.stopPropagation()}>
        <button className="wordpop-close" onClick={onClose} aria-label="닫기">✕</button>

        {/* 헤더 */}
        <div className="wordpop-header">
          <div className="wordpop-strong">{strong}</div>
          <div className="wordpop-lang">{languageLabel} · {languageLabelEn}</div>
        </div>

        {/* 선택한 번역 단어 */}
        {wordText && (
          <div className="wordpop-selected">
            <div className="wordpop-label">번역 · Translation</div>
            <div className="wordpop-selected-text">{wordText}</div>
          </div>
        )}

        {/* 원어 */}
        <div className="wordpop-original">
          <div className={`wordpop-lemma ${isHebrew ? 'hebrew' : 'greek'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
            {entry.lemma}
          </div>
          <div className="wordpop-translit">
            {entry.xlit}
            {entry.pron && <span className="wordpop-pron"> · [{entry.pron}]</span>}
          </div>
        </div>

        {/* 한국어 정의 */}
        {entry.defKo && (
          <div className="wordpop-def">
            <div className="wordpop-label">뜻 · 한국어</div>
            <div className="wordpop-def-text ko">{entry.defKo}</div>
          </div>
        )}

        {/* 영어 정의 */}
        <div className="wordpop-def">
          <div className="wordpop-label">Definition · English</div>
          <div className="wordpop-def-text en">{entry.defEn}</div>
        </div>

        {/* KJV 번역 */}
        {entry.kjv && entry.kjv !== entry.defEn && (
          <div className="wordpop-def">
            <div className="wordpop-label">KJV Usage</div>
            <div className="wordpop-def-text en kjv">{entry.kjv}</div>
          </div>
        )}

        <div className="wordpop-footer">
          Strong's Concordance · Public Domain
        </div>
      </div>
    </div>
  )
}

export default WordPopup
