import { NextRequest, NextResponse } from 'next/server';
import { getProject, updateProject } from '@/lib/store';
import { Scene } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json() as { scenes?: Scene[]; prompt?: string };
    const project = updateProject(params.id, body);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err) {
    console.error('[project PATCH]', err);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
