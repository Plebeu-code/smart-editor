import Anthropic from '@anthropic-ai/sdk';
import { DiarizedSegment, TranslatedSegment } from '@/types/dubbing';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM = `You are a professional translator specializing in video dubbing.
Translate text naturally for text-to-speech delivery.
Keep translations concise and natural — the same emotional tone as the original.
Always respond with valid JSON only.`;

const BATCH_SIZE = 40;

interface TranslateItem {
  index: number;
  speakerId: string;
  text: string;
}

interface TranslatedItem {
  index: number;
  translatedText: string;
}

async function translateBatch(
  anthropic: Anthropic,
  items: TranslateItem[],
  targetLanguage: string,
  targetLanguageName: string
): Promise<TranslatedItem[]> {
  const input = items
    .map((it) => `[${it.index}] [${it.speakerId}] ${it.text}`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Translate the following video segments to ${targetLanguageName} (${targetLanguage}).
Each line has format: [index] [speakerId] text

Guidelines:
- Keep the same emotional tone and energy as the original
- Optimize for natural speech (TTS will read it aloud)
- Keep sentence length similar to original (for timing sync)
- Preserve speaker identity context

SEGMENTS:
${input}

Return ONLY JSON array (no markdown):
[
  { "index": 0, "translatedText": "..." },
  { "index": 1, "translatedText": "..." }
]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response');

  let parsed: TranslatedItem[];
  try {
    parsed = JSON.parse(content.text.trim());
  } catch {
    const match = content.text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Could not parse translation JSON');
    parsed = JSON.parse(match[0]);
  }

  return parsed;
}

export async function translateSegments(
  segments: DiarizedSegment[],
  targetLanguage: string,
  targetLanguageName: string
): Promise<TranslatedSegment[]> {
  const anthropic = getClient();

  const items: TranslateItem[] = segments.map((seg, i) => ({
    index: i,
    speakerId: seg.speakerId,
    text: seg.originalText,
  }));

  // Process in batches
  const results: TranslatedItem[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await translateBatch(anthropic, batch, targetLanguage, targetLanguageName);
    results.push(...batchResults);
  }

  // Merge back
  const resultMap = new Map(results.map((r) => [r.index, r.translatedText]));

  return segments.map((seg, i) => ({
    ...seg,
    translatedText: resultMap.get(i) ?? seg.originalText,
    targetLanguage,
  }));
}
