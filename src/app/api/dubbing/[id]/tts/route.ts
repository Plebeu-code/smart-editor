import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject, getUploadPath } from '@/lib/store';
import { generateAllTTSClips } from '@/lib/tts';
import { TranslatedSegment } from '@/types/dubbing';

export const maxDuration = 600;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project?.dubbing) return NextResponse.json({ error: 'No dubbing job found' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as { translatedSegments?: TranslatedSegment[] };

  // Allow edited segments from UI
  const segments = body.translatedSegments ?? project.dubbing.translatedSegments;
  if (!segments.length) {
    return NextResponse.json({ error: 'No translated segments' }, { status: 400 });
  }

  updateProject(params.id, {
    dubbing: {
      ...project.dubbing,
      status: 'generating_tts',
      translatedSegments: segments,
      updatedAt: new Date().toISOString(),
    },
  });

  try {
    const ttsClips = await generateAllTTSClips(
      segments,
      project.dubbing.speakers,
      (filename) => getUploadPath(params.id, filename)
    );

    const updated = updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'idle', // ready for mixing
        translatedSegments: segments,
        ttsClips,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ dubbing: updated?.dubbing });
  } catch (err) {
    console.error('[tts]', err);
    updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'TTS generation failed',
        updatedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
