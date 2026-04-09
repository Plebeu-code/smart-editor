import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject } from '@/lib/store';
import { translateSegments } from '@/lib/translate';
import { Speaker } from '@/types/dubbing';

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project?.dubbing) return NextResponse.json({ error: 'No dubbing job found' }, { status: 404 });

  const body = await req.json() as { speakers?: Speaker[] };

  // Allow speaker overrides from UI
  const speakers = body.speakers ?? project.dubbing.speakers;
  const { diarizedSegments, targetLanguage, targetLanguageName } = project.dubbing;

  if (!diarizedSegments.length) {
    return NextResponse.json({ error: 'No segments to translate' }, { status: 400 });
  }

  updateProject(params.id, {
    dubbing: { ...project.dubbing, status: 'translating', speakers, updatedAt: new Date().toISOString() },
  });

  try {
    const translatedSegments = await translateSegments(diarizedSegments, targetLanguage, targetLanguageName);

    const updated = updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'idle', // ready for TTS generation
        speakers,
        translatedSegments,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ dubbing: updated?.dubbing });
  } catch (err) {
    console.error('[translate]', err);
    updateProject(params.id, {
      dubbing: {
        ...project.dubbing,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Translation failed',
        updatedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
