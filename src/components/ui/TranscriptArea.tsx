import { Speaker, SpeakersState, ConversationEntry } from '@/types'

interface TranscriptAreaProps {
  speakersState: SpeakersState
  conversation: ConversationEntry[]
}

export function TranscriptArea({ speakersState, conversation }: TranscriptAreaProps) {
  console.log(`[UI] Current speaker states:`, {
    moderator: speakersState.moderator.animationState,
    tom: speakersState.tom.animationState,
    mark: speakersState.mark.animationState
  })
  
  const activeSpeaker = Object.keys(speakersState).find(speaker => 
    speakersState[speaker as Speaker]?.animationState === 'speaking'
  ) as Speaker | undefined
  
  console.log(`[UI] Active speaker (speaking): ${activeSpeaker}`)
  
  if (activeSpeaker) {
    const currentEntry = [...conversation]
      .reverse()
      .find(entry => entry.speaker === activeSpeaker)
    
    console.log(`[UI] Found subtitle for ${activeSpeaker}:`, currentEntry?.text?.substring(0, 50))
    
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
  
  const thinkingSpeakers = Object.keys(speakersState).filter(speaker => 
    speakersState[speaker as Speaker]?.animationState === 'thinking'
  )
  
  console.log(`[UI] Thinking speakers:`, thinkingSpeakers)
  
  return null
}