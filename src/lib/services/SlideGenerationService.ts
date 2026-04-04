import { DebateScript, SlideData, SlidePlaylist, Speaker } from '@/types';

const CEREBRAS_ENDPOINT =
  'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/small/cerebras';

const SPEAKER_TAG_LABEL: Record<string, string> = {
  moderator: 'MODERATOR',
  tom: 'TOM',
  mark: 'MARK',
};

/**
 * Slide Generation Service
 *
 * Calls the Cerebras AI endpoint to generate structured SlideData for every
 * segment of a DebateScript in a single batch request. Failures degrade
 * gracefully — callers receive null and the audio pipeline is not blocked.
 */
export class SlideGenerationService {

  /**
   * Generate a SlidePlaylist for the entire DebateScript.
   * Returns null on any failure (network, timeout, invalid JSON, schema mismatch).
   */
  public static async generateSlides(script: DebateScript): Promise<SlidePlaylist | null> {
    const prompt = SlideGenerationService.buildPrompt(script);

    try {
      const response = await fetch(CEREBRAS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(`Cerebras HTTP ${response.status}`);
      }

      const data = await response.json() as {
        success?: boolean;
        content?: string;
        choices?: { message?: { content?: string } }[];
      };

      // This backend returns { success, content } — not OpenAI choices format
      const raw = (data.content ?? data.choices?.[0]?.message?.content ?? '').trim();
      const parsed = SlideGenerationService.extractJson(raw);
      if (!parsed) {
        throw new Error('No valid JSON found in Cerebras response');
      }

      return SlideGenerationService.validateSlidePlaylist(parsed, script);

    } catch (error) {
      console.error('[SlideGenerationService] Generation failed:', error);
      return null;
    }
  }

  // ── Prompt construction ─────────────────────────────────────────────────────

  private static buildPrompt(script: DebateScript): string {
    const turns = [
      {
        role: 'moderator',
        label: 'MODERATOR · INTRO',
        text: script.moderator_intro,
      },
      ...script.conversation.map((turn, i) => ({
        role: turn.speaker,
        label: `${SPEAKER_TAG_LABEL[turn.speaker] ?? turn.speaker.toUpperCase()} · ${
          i % 2 === 0 ? 'ANALYSIS' : 'COUNTER-POINT'
        }`,
        text: turn.text,
      })),
      {
        role: 'moderator',
        label: 'MODERATOR · SIGN-OFF',
        text: script.moderator_outro,
      },
    ];

    return `You are a TV news slide designer. Given a news debate script, generate a visual slide for each speaker turn.

Script turns (${turns.length} total):
${JSON.stringify(turns, null, 2)}

Requirements:
- Return a single JSON object with this exact structure:
{
  "moderator_intro": { "tag": "MODERATOR · INTRO", "title": "...", "points": ["...", "..."], "stat": null },
  "conversation": [
    { "speaker": "tom",  "slide": { "tag": "TOM · ANALYSIS",    "title": "...", "points": ["..."], "stat": "..." } },
    { "speaker": "mark", "slide": { "tag": "MARK · COUNTER-POINT", "title": "...", "points": ["..."], "stat": null } }
  ],
  "moderator_outro": { "tag": "MODERATOR · SIGN-OFF", "title": "...", "points": ["...", "..."], "stat": null }
}
- "tag": use the label from the input turns
- "title": 3–7 word punchy headline summarising the turn
- "points": 2–4 bullet points, each under 80 characters
- "stat": one key statistic or null if not applicable
- conversation array must have exactly ${script.conversation.length} items, preserving speaker order
Output ONLY the JSON object. No markdown fences. No extra text.`;
  }

  // ── JSON extraction (handles models that wrap output in markdown) ────────────

  private static extractJson(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch { /* fall through */ }

    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch { /* fall through */ }
    }
    return null;
  }

  // ── Validation & repair ──────────────────────────────────────────────────────

  /**
   * Validates and repairs the raw LLM output against the expected SlidePlaylist shape.
   * Individual conversation items that fail validation are replaced with a fallback slide.
   * Returns null only when the top-level structure is unrecoverable.
   */
  public static validateSlidePlaylist(
    raw: unknown,
    script: DebateScript
  ): SlidePlaylist | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const obj = raw as Record<string, unknown>;

    const introSlide = SlideGenerationService.coerceSlide(obj.moderator_intro);
    const outroSlide = SlideGenerationService.coerceSlide(obj.moderator_outro);
    if (!introSlide || !outroSlide) return null;

    const rawConv = Array.isArray(obj.conversation) ? obj.conversation : [];
    const conversation: SlidePlaylist['conversation'] = [];

    for (let i = 0; i < script.conversation.length; i++) {
      const expectedSpeaker = script.conversation[i].speaker;
      const rawItem = rawConv[i] as Record<string, unknown> | undefined;
      const slide = rawItem
        ? SlideGenerationService.coerceSlide(rawItem.slide)
        : null;

      conversation.push({
        speaker: expectedSpeaker,
        slide: slide ?? SlideGenerationService.fallbackSlide(
          expectedSpeaker,
          script.conversation[i].text
        ),
      });
    }

    return { moderator_intro: introSlide, conversation, moderator_outro: outroSlide };
  }

  private static coerceSlide(raw: unknown): SlideData | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const obj = raw as Record<string, unknown>;

    const tag = typeof obj.tag === 'string' && obj.tag.trim() ? obj.tag.trim() : null;
    const title = typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : null;
    if (!tag || !title) return null;

    const points = Array.isArray(obj.points)
      ? (obj.points as unknown[])
          .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
          .map(p => p.trim())
          .slice(0, 4)
      : [];
    if (points.length === 0) return null;

    const stat =
      typeof obj.stat === 'string' && obj.stat.trim() ? obj.stat.trim() : null;

    return { tag, title, points, stat };
  }

  private static fallbackSlide(speaker: Speaker, text: string): SlideData {
    const prefix = SPEAKER_TAG_LABEL[speaker] ?? speaker.toUpperCase();
    return {
      tag: `${prefix} · COMMENTARY`,
      title: 'Key Point',
      points: [text.substring(0, 80)],
      stat: null,
    };
  }
}
