import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

// Build the path to the ffmpeg binary WITHOUT importing ffmpeg-static.
// Importing ffmpeg-static causes webpack to bundle the module and mangle
// the returned path to .next/server/vendor-chunks/ffmpeg.exe (ENOENT).
// Using process.cwd() at runtime bypasses webpack entirely.
function resolveFfmpegBinary(): string {
  const ext = process.platform === 'win32' ? '.exe' : '';

  const candidates = [
    // Primary: ffmpeg-static inside node_modules (always present after install)
    path.resolve(process.cwd(), 'node_modules', 'ffmpeg-static', `ffmpeg${ext}`),
    // Fallback: system ffmpeg in PATH (Linux/macOS CI)
    `ffmpeg${ext}`,
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log('[ffmpeg] resolved binary:', candidate);
      return candidate;
    }
  }

  throw new Error(
    `ffmpeg binary not found. Searched:\n  ${candidates.slice(0, -1).join('\n  ')}`
  );
}

// Set path once at module load time
const ffmpegPath = resolveFfmpegBinary();
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffmpegPath.replace(/ffmpeg(\.exe)?$/, `ffprobe$1`));

export function normalizeVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-crf 23',
        '-preset fast',
        '-r 30',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration ?? 0);
    });
  });
}

export function extractAudio(videoPath: string, outputAudioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .output(outputAudioPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}
