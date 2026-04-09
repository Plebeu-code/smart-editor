import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { TTSClip } from '@/types/dubbing';

// Must set ffmpegPath here — this module runs in a separate route context
// from lib/ffmpeg.ts and fluent-ffmpeg's path is global but not guaranteed to be set.
(function initFfmpeg() {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const bin = path.resolve(process.cwd(), 'node_modules', 'ffmpeg-static', `ffmpeg${ext}`);
  if (fs.existsSync(bin)) ffmpeg.setFfmpegPath(bin);
})();

interface ClipInput {
  path: string;
  startSeconds: number;
}

function buildFilterComplex(clips: ClipInput[]): string {
  if (clips.length === 0) {
    // Just lower the original audio, no TTS
    return '[0:a]volume=0.15[aout]';
  }

  const parts: string[] = [];

  // Original audio at 10% volume
  parts.push('[0:a]volume=0.10[orig]');

  // Delay each TTS clip to its start time
  clips.forEach(({ startSeconds }, i) => {
    const delayMs = Math.round(startSeconds * 1000);
    parts.push(`[${i + 1}:a]adelay=${delayMs}ms:all=1[t${i}]`);
  });

  // Mix all tracks together without normalization
  const inputLabels = ['[orig]', ...clips.map((_, i) => `[t${i}]`)].join('');
  parts.push(`${inputLabels}amix=inputs=${clips.length + 1}:normalize=0[aout]`);

  return parts.join(';');
}

export function mixDubbedAudio(
  normalizedVideoPath: string,
  clips: ClipInput[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(normalizedVideoPath);

    // Add each TTS clip as an input
    clips.forEach(({ path }) => command.addInput(path));

    const filterComplex = buildFilterComplex(clips);

    const outputOptions = [
      '-map 0:v',
      '-map [aout]',
      '-c:v copy',    // copy video stream (fast, no quality loss)
      '-c:a aac',
      '-b:a 192k',
      '-shortest',
    ];

    command
      .complexFilter(filterComplex)
      .outputOptions(outputOptions)
      .output(outputPath)
      .on('start', (cmd) => console.log('[audio-mix] ffmpeg command:', cmd))
      .on('progress', (p) => console.log('[audio-mix] progress:', p.percent?.toFixed(1), '%'))
      .on('end', () => {
        console.log('[audio-mix] done →', outputPath);
        resolve();
      })
      .on('error', (err) => {
        console.error('[audio-mix] error:', err);
        reject(err);
      })
      .run();
  });
}

export function buildClipInputs(clips: TTSClip[], getPath: (filename: string) => string): ClipInput[] {
  return clips
    .filter((c) => c.filename) // include all clips that have a file
    .map((c) => ({
      path: getPath(c.filename),
      startSeconds: c.startSeconds,
    }));
}
