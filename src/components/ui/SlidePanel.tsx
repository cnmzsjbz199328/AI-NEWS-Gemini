'use client'

import { SlideData, Speaker, NewsItem } from '@/types'

const ACCENT: Record<Speaker, { hex: string; bg: string }> = {
  moderator: { hex: '#adc6ff', bg: 'rgba(173,198,255,0.15)' },
  tom:       { hex: '#ffd799', bg: 'rgba(255,215,153,0.15)' },
  mark:      { hex: '#ffb690', bg: 'rgba(255,182,144,0.15)' },
}

interface SlidePanelProps {
  currentSlide: SlideData | null
  activeSpeaker: Speaker | undefined
  activeNewsItem?: NewsItem | null
  newsError?: string
  onRefreshNews?: () => void
}

export function SlidePanel({ currentSlide, activeSpeaker, activeNewsItem, newsError, onRefreshNews }: SlidePanelProps) {
  const accent = activeSpeaker ? ACCENT[activeSpeaker] : null
  const hasSlide = !!(currentSlide && accent)
  const thumbnailUrl = activeNewsItem?.thumbnailUrl

  if (newsError) {
    return (
      <div className="slide-panel">
        <div className="slide-idle">
          <div style={{ marginBottom: 8 }}>{newsError}</div>
          {onRefreshNews && (
            <button onClick={onRefreshNews} className="refresh-btn">Refresh News</button>
          )}
        </div>
      </div>
    )
  }

  if (!activeNewsItem) {
    return (
      <div className="slide-panel">
        <div className="slide-idle">
          <div style={{ fontSize: '1.4rem', fontWeight: 700, opacity: 0.15 }}>AITV Studio</div>
          <div>Loading news...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="unified-news-panel">
      {/* 16:9 image panel — slide content overlays thumbnail */}
      <div className="slide-panel">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="slide-bg"
            style={{ filter: hasSlide ? 'brightness(0.25) blur(3px)' : 'brightness(0.55)' }}
          />
        )}

        {!hasSlide && (
          <div className="slide-idle">
            <div style={{ fontSize: '1.4rem', fontWeight: 700, opacity: 0.15 }}>AITV Studio</div>
            <div>Awaiting Discussion</div>
          </div>
        )}

        {hasSlide && (
          <>
            <div className="slide-accent-bar" style={{ background: accent.hex }} />
            <div className="slide-content visible">
              <span className="slide-tag" style={{ background: accent.bg, color: accent.hex }}>
                {currentSlide.tag}
              </span>
              <h3 className="slide-title">{currentSlide.title}</h3>
              <div className="slide-divider" style={{ background: accent.hex }} />
              <div className="slide-bullets">
                {currentSlide.points.map((point, i) => (
                  <div key={i} className="slide-point" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span style={{ color: accent.hex, flexShrink: 0 }}>▸</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              {currentSlide.stat && (
                <div className="slide-stat" style={{ borderColor: accent.hex + '40', color: accent.hex }}>
                  📊 {currentSlide.stat}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* News text below the image */}
      <div className="news-text-area">
        <h3 className="news-item-title">{activeNewsItem.title}</h3>
        {activeNewsItem.description && (
          <p className="news-item-desc">{activeNewsItem.description}</p>
        )}
        <div className="news-item-meta">
          <span>BBC News</span>
          <span>{activeNewsItem.date}</span>
        </div>
      </div>
    </div>
  )
}
