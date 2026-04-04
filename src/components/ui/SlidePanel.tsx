'use client'

import { SlideData, Speaker } from '@/types'

// Accent colours — mirrors demo.html ACCENT object
const ACCENT: Record<Speaker, { hex: string; bg: string }> = {
  moderator: { hex: '#adc6ff', bg: 'rgba(173,198,255,0.15)' },
  tom:       { hex: '#ffd799', bg: 'rgba(255,215,153,0.15)' },
  mark:      { hex: '#ffb690', bg: 'rgba(255,182,144,0.15)' },
}

interface SlidePanelProps {
  currentSlide: SlideData | null
  activeSpeaker: Speaker | undefined
}

export function SlidePanel({ currentSlide, activeSpeaker }: SlidePanelProps) {
  const accent = activeSpeaker ? ACCENT[activeSpeaker] : null

  if (!currentSlide || !accent) {
    return (
      <div className="slide-panel">
        <div className="slide-idle">
          <div style={{ fontSize: '1.4rem', fontWeight: 700, opacity: 0.15 }}>AITV Studio</div>
          <div>Awaiting Discussion</div>
        </div>
      </div>
    )
  }

  return (
    <div className="slide-panel">
      <div className="slide-accent-bar" style={{ background: accent.hex }} />

      <div className="slide-content visible">
        {/* Speaker tag */}
        <span
          className="slide-tag"
          style={{ background: accent.bg, color: accent.hex }}
        >
          {currentSlide.tag}
        </span>

        {/* Title */}
        <h3 className="slide-title">{currentSlide.title}</h3>

        {/* Divider */}
        <div className="slide-divider" style={{ background: accent.hex }} />

        {/* Bullet points */}
        <div className="slide-bullets">
          {currentSlide.points.map((point, i) => (
            <div
              key={i}
              className="slide-point"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span style={{ color: accent.hex, flexShrink: 0 }}>▸</span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        {/* Optional stat */}
        {currentSlide.stat && (
          <div
            className="slide-stat"
            style={{ borderColor: accent.hex + '40', color: accent.hex }}
          >
            📊 {currentSlide.stat}
          </div>
        )}
      </div>
    </div>
  )
}
