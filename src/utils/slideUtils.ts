import { SlideData, SlidePlaylist, DebateScript, Speaker } from '@/types'

/**
 * Find the SlideData that corresponds to the currently speaking audio item.
 *
 * Matching strategy:
 * 1. If speaker is 'moderator': check text against intro/outro first.
 * 2. For conversation turns: match by speaker + text equality.
 * 3. Fallback: first slide for that speaker in conversation order.
 */
export function findSlideForSpeakerText(
  slides: SlidePlaylist,
  script: DebateScript,
  speaker: Speaker,
  text: string
): SlideData | null {
  // Check moderator intro
  if (speaker === 'moderator' && text === script.moderator_intro) {
    return slides.moderator_intro
  }

  // Check moderator outro
  if (speaker === 'moderator' && text === script.moderator_outro) {
    return slides.moderator_outro
  }

  // Check conversation turns — exact text match first
  const exactIdx = script.conversation.findIndex(
    t => t.speaker === speaker && t.text === text
  )
  if (exactIdx !== -1 && slides.conversation[exactIdx]) {
    return slides.conversation[exactIdx].slide
  }

  // Fallback: first conversation turn for this speaker
  const fallbackIdx = slides.conversation.findIndex(t => t.speaker === speaker)
  if (fallbackIdx !== -1) {
    return slides.conversation[fallbackIdx].slide
  }

  return null
}
