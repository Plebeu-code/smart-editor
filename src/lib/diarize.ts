import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { SRTEntry } from '@/types';
import { Speaker, DiarizedSegment, TTSVoice, SPEAKER_COLORS } from '@/types/dubbing';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const VOICE_ORDER: TTSVoice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

const SYSTEM = `You are a professional video editor and linguist.
Analyze transcripts to identify different speakers purely from textual clues.
Always respond with valid JSON only — no markdown, no explanations.`;

interface RawSegment {
  speakerId: string;
  legIndexStart: number;
  legIndexEnd: number;
}

interface DiarizeResult {
  speakers: Array<{ id: string; label: string }>;
  segments: RawSegment[];
}

export async function diarizeTranscript(
  srtEntries: SRTEntry[]
): Promise<{ speakers: Speaker[]; diarizedSegments: DiarizedSegment[] }> {
  const anthropic = getClient();

  // Build numbered transcript for Claude
  const transcript = srtEntries
    .map((e) => `[${e.legIndex}] (${e.startSeconds.toFixed(1)}s) ${e.text}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Analyze this video transcript and identify distinct speakers.

TRANSCRIPT (${srtEntries.length} entries, 0-indexed):
${transcript}

RULES:
- Identify 1 to 4 speakers based on conversational context:
  * Look for question/answer patterns, topic changes, explicit name mentions
  * Different vocabulary, formality levels, or speaking styles
  * If it's a monologue, return exactly 1 speaker
- Group CONSECUTIVE entries by the same speaker into segments
- Every entry [0] to [${srtEntries.length - 1}] MUST be assigned to exactly one speaker
- Return compact segments: merge consecutive entries by the same speaker

Return ONLY this JSON (no markdown):
{
  "speakers": [
    { "id": "speaker_0", "label": "Speaker A" },
    { "id": "speaker_1", "label": "Speaker B" }
  ],
  "segments": [
    { "speakerId": "speaker_0", "legIndexStart": 0, "legIndexEnd": 3 },
    { "speakerId": "speaker_1", "legIndexStart": 4, "legIndexEnd": 7 }
  ]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  let parsed: DiarizeResult;
  try {
    parsed = JSON.parse(content.text.trim());
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse JSON from diarization response');
    parsed = JSON.parse(match[0]);
  }

  // Build speaker objects with voice + color assignments
  const speakers: Speaker[] = parsed.speakers.map((s, i) => ({
    id: s.id,
    label: s.label ?? `Speaker ${String.fromCharCode(65 + i)}`,
    voice: VOICE_ORDER[i % VOICE_ORDER.length],
    color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
  }));

  // Build diarized segments with full metadata
  const diarizedSegments: DiarizedSegment[] = parsed.segments.map((seg) => {
    const startEntry = srtEntries[seg.legIndexStart] ?? srtEntries[0];
    const endEntry = srtEntries[seg.legIndexEnd] ?? srtEntries[srtEntries.length - 1];
    const text = srtEntries
      .slice(seg.legIndexStart, seg.legIndexEnd + 1)
      .map((e) => e.text)
      .join(' ');

    return {
      speakerId: seg.speakerId,
      legIndexStart: seg.legIndexStart,
      legIndexEnd: seg.legIndexEnd,
      originalText: text,
      startSeconds: startEntry.startSeconds,
      endSeconds: endEntry.endSeconds,
    };
  });

  return { speakers, diarizedSegments };
}
