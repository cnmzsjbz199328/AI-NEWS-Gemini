import { Speaker, SpeakersState } from '@/types'

interface SpeakerAvatarProps {
  speaker: Speaker
  speakersState: SpeakersState
  title: string
}

export function SpeakerAvatar({ speaker, speakersState, title }: SpeakerAvatarProps) {
  const getSpeakerImage = (speaker: Speaker) => {
    const speakerState = speakersState[speaker]
    const animationState = speakerState.animationState
    
    console.log(`[UI] getSpeakerImage for ${speaker}: animationState = ${animationState}`)
    
    if (animationState === 'speaking') {
      console.log(`[UI] ${speaker} using ANIMATED image (state: ${animationState}) - AUDIO PLAYING`)
      switch (speaker) {
        case 'moderator':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/ezgif.com-video-to-gif-converter.gif"
        case 'tom':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/Moving-picture-dog-flips-hot-dog-on-nose-animated-gif.gif"
        case 'mark':
          return "https://pub-b436254f85684e9e95bebad4567b11ff.r2.dev/public/dog-ezgif.com-video-to-gif-converter%20(1).gif"
      }
    } else {
      console.log(`[UI] ${speaker} using STATIC image (state: ${animationState}) - ${animationState === 'thinking' ? 'THINKING' : 'IDLE'}`)
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

  return (
    <div className={`commentator ${speaker} ${speakersState[speaker].animationState === 'speaking' ? 'speaking' : ''}`}>
      <h2>{title}</h2>
      <div className="avatar">
        <img src={getSpeakerImage(speaker)} alt={`${title} Avatar`} />
      </div>
    </div>
  )
}