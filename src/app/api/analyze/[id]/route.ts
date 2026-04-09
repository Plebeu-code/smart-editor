import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject } from '@/lib/store';
import { analyzeTranscript } from '@/lib/claude';

export const maxDuration = 120;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!project.transcription) {
    return NextResponse.json({ error: 'No transcription available' }, { status: 400 });
  }

  try {
    updateProject(params.id, { status: 'analyzing' });

    const result = await analyzeTranscript(project.transcription, project.prompt ?? '');

    const updated = updateProject(params.id, {
      scenes: result.scenes,
      palette: result.palette,
      narrativeFormat: result.narrativeFormat,
      status: 'ready',
    });

    return NextResponse.json({ project: updated });
  } catch (err) {
    console.error('[analyze]', err);
    updateProject(params.id, {
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Analysis failed',
    });
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
