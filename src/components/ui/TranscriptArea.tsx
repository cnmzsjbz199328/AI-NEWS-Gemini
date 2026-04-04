import { Speaker, SpeakersState, ConversationEntry } from '@/types'

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

  // Always render the reserved container — height is fixed so flex layout never shifts.
  // The inner card fades in/out via opacity without affecting document flow.
  return (
    <div className="transcript-reserved">
      <div
        className={`message ${activeSpeaker ?? ''} current speaking`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          pointerEvents: isVisible ? 'auto' : 'none',
          width: '100%',
        }}
      >
        {activeSpeaker && (
          <div className={`speaker-name ${activeSpeaker}`}>
            {activeSpeaker.toUpperCase()}
          </div>
        )}
        <div className="subtitle-text">{currentEntry?.text ?? '\u00A0'}</div>
      </div>
    </div>
  )
}
