import { Speaker, SpeakersState, ConversationEntry } from '@/types'

interface TranscriptAreaProps {
  speakersState: SpeakersState
  conversation: ConversationEntry[]
}

export function TranscriptArea({ speakersState, conversation }: TranscriptAreaProps) {
  const activeSpeaker = Object.keys(speakersState).find(speaker =>
    speakersState[speaker as Speaker]?.animationState === 'speaking'
  ) as Speaker | undefined

  if (activeSpeaker) {
    const currentEntry = [...conversation]
      .reverse()
      .find(entry => entry.speaker === activeSpeaker)

    if (currentEntry) {
      return (
        <div key={`${activeSpeaker}-speaking`} className={`message ${activeSpeaker} current speaking`}>
          <div className={`speaker-name ${activeSpeaker}`}>
            {activeSpeaker.toUpperCase()}
          </div>
          <div className="subtitle-text">{currentEntry.text}</div>
        </div>
      )
    }
  }
  
  return null
}