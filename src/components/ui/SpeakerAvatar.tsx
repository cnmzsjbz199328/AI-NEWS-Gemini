import { Speaker, SpeakersState } from '@/types'

// Per-speaker accent colours matching demo.html ACCENT object
const ACCENT: Record<Speaker, { hex: string; badgeBg: string; badgeText: string }> = {
  moderator: { hex: '#adc6ff', badgeBg: '#adc6ff', badgeText: '#001a42' },
  tom:       { hex: '#ffd799', badgeBg: '#ffd799', badgeText: '#432c00' },
  mark:      { hex: '#ffb690', badgeBg: '#ffb690', badgeText: '#341100' },
}

interface SpeakerAvatarProps {
  speaker: Speaker
  speakersState: SpeakersState
  title: string
}

export function SpeakerAvatar({ speaker, speakersState, title }: SpeakerAvatarProps) {
  // ── GIF / PNG switching — DO NOT MODIFY ────────────────────────────────────
  const getSpeakerImage = (speaker: Speaker) => {
    const speakerState = speakersState[speaker]
    const animationState = speakerState.animationState

    if (animationState === 'speaking') {
      switch (speaker) {
        case 'moderator':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/ezgif.com-video-to-gif-converter.gif"
        case 'tom':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/Moving-picture-dog-flips-hot-dog-on-nose-animated-gif.gif"
        case 'mark':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/dog-ezgif.com-video-to-gif-converter%20(1).gif"
      }
    } else {
      switch (speaker) {
        case 'moderator':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/1.png"
        case 'tom':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/3.png"
        case 'mark':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/2.png"
      }
    }
  }
  // ── END GIF / PNG switching ─────────────────────────────────────────────────

  const isSpeaking = speakersState[speaker].animationState === 'speaking'
  const accent = ACCENT[speaker]

  return (
    <div className="avatar-wrap" id={`wrap-${speaker}`}>
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div
          className={`avatar-glow absolute ${isSpeaking ? 'speaking' : 'idle'}`}
          style={isSpeaking ? {
            width: '144px',
            height: '144px',
            boxShadow: `0 0 0 4px ${accent.hex}, 0 0 50px ${accent.hex}55`,
          } : { width: '72px', height: '72px' }}
        />

        {/* Avatar image — src is driven by getSpeakerImage (GIF/PNG logic above) */}
        <img
          id={`img-${speaker}`}
          className={`avatar-img ${isSpeaking ? 'speaking' : 'idle'} relative z-10`}
          src={getSpeakerImage(speaker)}
          alt={`${title} avatar`}
        />

        {/* Speaking badge */}
        <div
          className={`spk-badge absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight z-20 ${isSpeaking ? '' : 'hidden'}`}
          style={{ background: accent.badgeBg, color: accent.badgeText }}
        >
          Speaking
        </div>
      </div>

      {/* Speaker name label */}
      <span
        className="font-headline text-xs font-medium tracking-widest uppercase mt-2 transition-colors duration-300"
        style={{ color: isSpeaking ? accent.hex : '#555' }}
      >
        {title}
      </span>
    </div>
  )
}
