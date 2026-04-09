import { SRTEntry, WordTiming, Sentiment } from '@/types';

const FPS = 30;

function timeToSeconds(time: string): number {
  // "00:00:01,234" or "00:00:01.234"
  const normalized = time.replace(',', '.');
  const parts = normalized.split(':');
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const s = parseFloat(parts[2]);
  return h * 3600 + m * 60 + s;
}

function secondsToFrames(seconds: number): number {
  return Math.round(seconds * FPS);
}

const POSITIVE_WORDS = new Set([
  'great', 'amazing', 'awesome', 'excellent', 'good', 'best', 'love', 'beautiful',
  'wonderful', 'fantastic', 'incredible', 'success', 'win', 'happy', 'joy', 'perfect',
  'outstanding', 'brilliant', 'superb', 'magnificent', 'incrível', 'ótimo', 'excelente',
  'perfeito', 'sucesso', 'melhor', 'bom', 'feliz', 'amor', 'maravilhoso', 'fantástico',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'wrong', 'fail', 'problem', 'issue', 'error',
  'danger', 'risk', 'difficult', 'hard', 'struggle', 'pain', 'sad', 'angry', 'fear',
  'ruim', 'terrível', 'problema', 'falha', 'erro', 'perigo', 'risco', 'difícil', 'triste',
]);

const EXCITING_WORDS = new Set([
  'wow', 'incredible', 'amazing', 'unbelievable', 'shocking', 'explosive', 'massive',
  'huge', 'epic', 'legendary', 'never', 'ever', 'first', 'only', 'exclusive', 'secret',
  'incrível', 'impressionante', 'surpreendente', 'inacreditável', 'exclusivo', 'secreto',
  'nunca', 'jamais', 'primeiro', 'único', 'épico', 'lendário',
]);

function classifyWord(word: string): Sentiment {
  const lower = word.toLowerCase().replace(/[^a-záàâãéèêíïóôõúçñ]/gi, '');
  if (EXCITING_WORDS.has(lower)) return 'exciting';
  if (POSITIVE_WORDS.has(lower)) return 'positive';
  if (NEGATIVE_WORDS.has(lower)) return 'negative';
  return 'neutral';
}

function buildWordTimings(text: string, startSeconds: number, endSeconds: number): WordTiming[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const duration = endSeconds - startSeconds;
  const wordDuration = duration / words.length;

  return words.map((word, i) => {
    const wordStart = startSeconds + i * wordDuration;
    const wordEnd = wordStart + wordDuration;
    return {
      word,
      startFrame: secondsToFrames(wordStart),
      endFrame: secondsToFrames(wordEnd),
      sentiment: classifyWord(word),
    };
  });
}

export function parseSRT(srtContent: string): SRTEntry[] {
  const blocks = srtContent.trim().split(/\n\s*\n/);
  const entries: SRTEntry[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0].trim());
    if (isNaN(index)) continue;

    const timeParts = lines[1].split('-->');
    if (timeParts.length !== 2) continue;

    const startTime = timeParts[0].trim();
    const endTime = timeParts[1].trim();
    const text = lines.slice(2).join(' ').trim();

    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);

    entries.push({
      index,
      legIndex: entries.length, // 0-based
      startTime,
      endTime,
      text,
      startSeconds,
      endSeconds,
      startFrame: secondsToFrames(startSeconds),
      endFrame: secondsToFrames(endSeconds),
      words: buildWordTimings(text, startSeconds, endSeconds),
    });
  }

  return entries;
}

export function getTotalFrames(entries: SRTEntry[]): number {
  if (entries.length === 0) return 0;
  return entries[entries.length - 1].endFrame;
}
