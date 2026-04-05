import { Speaker, SpeakersState, ConversationEntry } from '@/types'

const SPEAKER_COLOR: Record<Speaker, string> = {
  moderator: '#adc6ff',
  tom:       '#ffd799',
  mark:      '#ffb690',
}

interface TranscriptAreaProps {
  speakersState: SpeakersState
  conversation: ConversationEntry[]
}

export function TranscriptArea({ speakersState, conversation }: TranscriptAreaProps) {
  const activeSpeaker = Object.keys(speakersState).find(speaker =>
    speakersState[speaker as Speaker]?.animationState === 'speaking'
  ) as Speaker | undefined

  const currentEntry = activeSpeaker
    ? [...conversation].reverse().find(entry => entry.speaker === activeSpeaker)
    : undefined

  const isVisible = !!(activeSpeaker && currentEntry)
  const accentColor = activeSpeaker ? SPEAKER_COLOR[activeSpeaker] : 'transparent'

  return (
    <div className="transcript-reserved">
      <div
        className="transcript-bar"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div className="transcript-bar-accent" style={{ background: accentColor }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: accentColor,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            flexShrink: 0,
            lineHeight: 1,
          }}>
            {activeSpeaker ?? ''}
          </span>
          <span style={{ fontSize: 13, color: 'rgba(233,223,236,0.9)', lineHeight: 1.55 }}>
            {currentEntry?.text ?? '\u00A0'}
          </span>
        </div>
      </div>
    </div>
  )
}
