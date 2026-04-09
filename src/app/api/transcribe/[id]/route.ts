import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProject, updateProject, getUploadPath } from '@/lib/store';
import { transcribeVideo } from '@/lib/whisper';
import { normalizeVideo, extractAudio } from '@/lib/ffmpeg';
import { parseSRT, getTotalFrames } from '@/lib/srt-parser';

export const maxDuration = 300;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  try {
    // Step 1: Normalize video
    updateProject(params.id, { status: 'normalizing' });
    const rawPath = getUploadPath(params.id, project.rawFilename!);
    const normalizedPath = getUploadPath(params.id, 'normalized.mp4');

    if (!fs.existsSync(normalizedPath)) {
      await normalizeVideo(rawPath, normalizedPath);
    }

    updateProject(params.id, { videoFilename: 'normalized.mp4', status: 'transcribing' });

    // Step 2: Extract audio for Whisper
    const audioPath = getUploadPath(params.id, 'audio.mp3');
    if (!fs.existsSync(audioPath)) {
      await extractAudio(normalizedPath, audioPath);
    }

    // Step 3: Transcribe with Whisper
    const srtContent = await transcribeVideo(audioPath);
    const srtPath = getUploadPath(params.id, 'transcript.srt');
    fs.writeFileSync(srtPath, srtContent);

    const srtEntries = parseSRT(srtContent);
    const totalFrames = getTotalFrames(srtEntries);

    const updated = updateProject(params.id, {
      transcription: srtEntries,
      totalFrames,
      status: 'analyzing',
    });

    return NextResponse.json({ project: updated, srtEntries, totalFrames });
  } catch (err) {
    console.error('[transcribe]', err);
    updateProject(params.id, {
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Transcription failed',
    });
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
