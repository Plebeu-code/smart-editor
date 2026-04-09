import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getProject, updateProject, getUploadPath } from '@/lib/store';
import { mixDubbedAudio, buildClipInputs } from '@/lib/audio-mix';

export const maxDuration = 600;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project?.dubbing) return NextResponse.json({ error: 'No dubbing job found' }, { status: 404 });
  if (!project.dubbing.ttsClips.length) {
    return NextResponse.json({ error: 'No TTS clips to mix' }, { status: 400 });
  }

  updateProject(params.id, {
    dubbing: { ...project.dubbing, status: 'mixing', updatedAt: new Date().toISOString() },
  });

  try {
    const normalizedPath = getUploadPath(params.id, 'normalized.mp4');
    const outputFilename = 'dubbed.mp4';
    const outputPath = getUploadPath(params.id, outputFilename);

    const clipInputs = buildClipInputs(
      project.dubbing.ttsClips,
      (filename) => getUploadPath(params.id, filename)
    );

    await mixDubbedAudio(normalizedPath, clipInputs, outputPath);

    const updated = updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'done',
        outputFilename,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      dubbing: updated?.dubbing,
      dubbedUrl: `/api/video/${params.id}/dubbed`,
    });
  } catch (err) {
    console.error('[mix]', err);
    updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Mix failed',
        updatedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'Mix failed' }, { status: 500 });
  }
}
