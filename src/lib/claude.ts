import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { Scene, ColorPalette, NarrativeFormat, SRTEntry, Sentiment } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

interface AnalysisResult {
  narrativeFormat: NarrativeFormat;
  palette: ColorPalette;
  scenes: Scene[];
}

const SYSTEM_PROMPT = `You are an expert video editor AI specialized in creating viral short-form vertical videos.
You analyze transcripts and design compelling visual compositions with strategic scene breakdowns.
Always respond with valid JSON only — no markdown, no explanations.`;

const buildPrompt = (srtContent: string, userPrompt: string, totalEntries: number): string => `
Analyze this video transcript and create an engaging vertical video composition (1080x1920, 9:16).

TRANSCRIPT (SRT format — ${totalEntries} entries, 0-indexed for startLeg):
${srtContent}

USER BRIEF: ${userPrompt || 'No brief provided. Create the most engaging composition possible.'}

Return ONLY this JSON structure (no markdown):
{
  "narrativeFormat": "educational|storytelling|tutorial|highlight|news|entertainment",
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#050508",
    "text": "#FFFFFF"
  },
  "scenes": [
    {
      "type": "title|content|highlight|outro",
      "startLeg": 0,
      "title": "Scene title (max 8 words)",
      "body": "Optional supporting text (max 20 words)",
      "sentiment": "positive|negative|neutral|exciting",
      "visualStyle": "minimal|bold|cinematic"
    }
  ]
}

RULES:
- Create 4 to 8 scenes
- startLeg must be a valid 0-based index between 0 and ${totalEntries - 1}
- Scene 0 must be type "title" with startLeg: 0
- Last scene must be type "outro"
- startLeg values must be strictly increasing
- Choose a color palette that matches the content mood
- accent color should complement #050508 background
- Keep titles punchy and engaging for short-form video`;

export async function analyzeTranscript(
  srtEntries: SRTEntry[],
  userPrompt: string
): Promise<AnalysisResult> {
  const srtContent = srtEntries
    .map((e) => `[${e.legIndex}] ${e.text}`)
    .join('\n');

  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildPrompt(srtContent, userPrompt, srtEntries.length),
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  let parsed: Omit<AnalysisResult, 'scenes'> & {
    scenes: Omit<Scene, 'id'>[];
  };

  try {
    parsed = JSON.parse(content.text.trim());
  } catch {
    // Try to extract JSON from the response
    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse JSON from Claude response');
    parsed = JSON.parse(match[0]);
  }

  // Validate and sanitize
  const scenes: Scene[] = parsed.scenes.map((s) => ({
    id: uuidv4(),
    type: s.type ?? 'content',
    startLeg: Math.min(Math.max(0, s.startLeg ?? 0), srtEntries.length - 1),
    title: s.title ?? 'Untitled',
    body: s.body,
    sentiment: (s.sentiment as Sentiment) ?? 'neutral',
    visualStyle: s.visualStyle ?? 'bold',
  }));

  return {
    narrativeFormat: parsed.narrativeFormat ?? 'educational',
    palette: {
      primary: parsed.palette?.primary ?? '#FFB800',
      secondary: parsed.palette?.secondary ?? '#FF6B00',
      accent: parsed.palette?.accent ?? '#FFB800',
      background: '#050508',
      text: '#FFFFFF',
    },
    scenes,
  };
}

export async function generateIllustrationPrompt(scene: Scene): Promise<string> {
  const anthropic2 = getClient();
  const message = await anthropic2.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Generate a concise DALL-E image prompt (max 50 words) for a vertical video scene background.
Scene title: "${scene.title}"
Scene body: "${scene.body ?? ''}"
Visual style: ${scene.visualStyle}
Sentiment: ${scene.sentiment}
Requirements: dark background, cinematic, abstract or conceptual, no text, 9:16 aspect ratio.
Return only the prompt text.`,
      },
    ],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text.trim() : `Cinematic abstract ${scene.sentiment} atmosphere`;
}
