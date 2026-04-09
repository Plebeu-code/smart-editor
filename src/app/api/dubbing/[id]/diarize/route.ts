import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject } from '@/lib/store';
import { diarizeTranscript } from '@/lib/diarize';
import { DubbingJob } from '@/types/dubbing';

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!project.transcription?.length) {
    return NextResponse.json({ error: 'No transcription available' }, { status: 400 });
  }

  const body = await req.json() as { targetLanguage: string; targetLanguageName: string };

  const now = new Date().toISOString();
  const dubbingInit: DubbingJob = {
    status: 'diarizing',
    targetLanguage: body.targetLanguage,
    targetLanguageName: body.targetLanguageName,
    speakers: [],
    diarizedSegments: [],
    translatedSegments: [],
    ttsClips: [],
    createdAt: now,
    updatedAt: now,
  };

  updateProject(params.id, { dubbing: dubbingInit });

  try {
    const { speakers, diarizedSegments } = await diarizeTranscript(project.transcription);

    const updated = updateProject(params.id, {
      dubbing: {
        ...dubbingInit,
        status: 'idle', // ready for user review + translate step
        speakers,
        diarizedSegments,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ dubbing: updated?.dubbing });
  } catch (err) {
    console.error('[diarize]', err);
    updateProject(params.id, {
      dubbing: {
        ...dubbingInit,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Diarization failed',
        updatedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: 'Diarization failed' }, { status: 500 });
  }
}
