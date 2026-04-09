import OpenAI from 'openai';
import fs from 'fs';
import { getVideoDuration } from './ffmpeg';
import { TTSVoice, TTSClip, TranslatedSegment, Speaker } from '@/types/dubbing';

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateTTSClip(
  text: string,
  voice: TTSVoice,
  outputPath: string
): Promise<void> {
  const openai = getClient();

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3',
    speed: 1.0,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

export async function generateAllTTSClips(
  translatedSegments: TranslatedSegment[],
  speakers: Speaker[],
  getClipPath: (filename: string) => string
): Promise<TTSClip[]> {
  const speakerMap = new Map(speakers.map((s) => [s.id, s]));
  const clips: TTSClip[] = [];

  for (let i = 0; i < translatedSegments.length; i++) {
    const seg = translatedSegments[i];
    const speaker = speakerMap.get(seg.speakerId);
    if (!speaker) continue;

    const filename = `tts_${i}.mp3`;
    const clipPath = getClipPath(filename);

    // Skip if already generated (resume support)
    if (!fs.existsSync(clipPath)) {
      const textToSpeak = seg.translatedText.trim();
      if (textToSpeak) {
        await generateTTSClip(textToSpeak, speaker.voice, clipPath);
      } else {
        // Create empty file as placeholder
        fs.writeFileSync(clipPath, Buffer.alloc(0));
      }
    }

    // Estimate duration from file size (ffprobe not available — ffmpeg-static has no ffprobe.exe)
    // OpenAI TTS outputs ~192kbps MP3 → bytes / (192000/8) ≈ seconds
    let durationSeconds = 0;
    try {
      const stat = fs.statSync(clipPath);
      if (stat.size > 0) {
        durationSeconds = stat.size / (192000 / 8); // 192kbps estimate
      }
    } catch {
      durationSeconds = 1; // safe fallback — clip will still play
    }

    clips.push({
      segmentIndex: i,
      speakerId: seg.speakerId,
      filename,
      durationSeconds,
      startSeconds: seg.startSeconds,
    });
  }

  return clips;
}
