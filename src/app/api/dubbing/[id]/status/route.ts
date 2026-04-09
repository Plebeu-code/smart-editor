import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json({ dubbing: project.dubbing ?? null });
}
