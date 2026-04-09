import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProject, updateProject } from '@/lib/store';
import { convertScenesFromLegendaIndex } from '@/lib/timing';

export const maxDuration = 600;

// Cache the webpack bundle between renders — bundling takes 1-2 min and only
// needs to redo if the Remotion source code changes (restart server to clear).
let bundleCache: string | null = null;

/**
 * Starts a render job in the background and returns immediately.
 * The client polls GET /api/project/[id] until status changes to 'done' or 'error'.
 */
async function runRender(projectId: string) {
  const project = getProject(projectId);
  if (!project || !project.scenes || !project.transcription) return;

  try {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3333';
    const videoSrc = `${appUrl}/api/video/${projectId}/normalized`;

    const scenesWithFrames = convertScenesFromLegendaIndex(
      project.scenes,
      project.transcription
    );

    const inputProps = {
      scenes: scenesWithFrames,
      srtEntries: project.transcription,
      videoSrc,
      palette: project.palette ?? {
        primary: '#FFB800',
        secondary: '#FF6B00',
        accent: '#FFB800',
        background: '#050508',
        text: '#FFFFFF',
      },
      totalFrames:
        project.totalFrames ??
        scenesWithFrames[scenesWithFrames.length - 1]?.endFrame ??
        900,
    };

    const entryPoint = path.resolve(process.cwd(), 'src/remotion/index.tsx');
    if (!bundleCache) {
      console.log('[render] bundling (first time, ~1-2 min)…');
      bundleCache = await bundle({ entryPoint });
      console.log('[render] bundle cached');
    } else {
      console.log('[render] using cached bundle');
    }
    const bundled = bundleCache;

    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'MainVideo',
      inputProps,
    });

    const rendersDir = path.join(process.cwd(), 'renders');
    if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

    const renderFilename = `${projectId}.mp4`;
    const outputPath = path.join(rendersDir, renderFilename);

    console.log('[render] rendering to', outputPath);
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        // Store progress so client can show it
        updateProject(projectId, { renderProgress: pct } as never);
      },
    });

    console.log('[render] done');
    updateProject(projectId, { status: 'done', renderFilename });
  } catch (err) {
    console.error('[render]', err);
    updateProject(projectId, {
      status: 'error',
      errorMessage: err instanceof Error ? err.message : 'Render failed',
    });
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!project.scenes || !project.transcription) {
    return NextResponse.json({ error: 'Project not ready for rendering' }, { status: 400 });
  }
  if (project.status === 'rendering') {
    return NextResponse.json({ status: 'rendering', message: 'Already rendering' });
  }

  updateProject(params.id, { status: 'rendering' });

  // Fire render in background — response returns immediately
  void runRender(params.id);

  return NextResponse.json({ status: 'rendering' });
}
